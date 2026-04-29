import React, { useState } from 'react';
import { Wifi, Zap, Receipt, CheckCircle2, CircleDashed, Loader2, Plus, CreditCard } from 'lucide-react';
import type { EstadoPrevisto, Moneda, Unidad, MovimientoPrevisto, ServicioDefinicion } from '../types';
import { useServicios } from '../hooks/useServicios';
import { useMediosPago } from '../hooks/useMediosPago';
import { getCategoriesForUnit, getConceptsForCategory } from '../config/classificationMap';
import { Modal } from './common/Modal';
import { Card, Badge, Input, Button } from './common/ui';
import { formatCurrency } from '../utils/formatters';

interface ServicesViewProps {
  onBack?: () => void;
}

export function ServicesView({ onBack }: ServicesViewProps) {
  const { movimientosPrevistos, servicios, loading, updateEstado, addServicio, markAsPaid } = useServicios();
  const { mediosPago } = useMediosPago();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payingItemId, setPayingItemId] = useState<number | null>(null);
  const [selectedMedioPago, setSelectedMedioPago] = useState('');

  const [newServicio, setNewServicio] = useState({
    nombre: '',
    monto_estimado: '',
    moneda: 'ARS' as Moneda,
    unidad: 'HOGAR' as Unidad,
    categoria: 'Vivienda',
    concepto: 'Alquiler',
    detalle: '',
    dia_vencimiento: '',
    es_debito_automatico: false,
  });

  const handleToggleEstado = (id: number, currentEstado: EstadoPrevisto) => {
    if (currentEstado === 'PENDING') {
      updateEstado(id, 'RESERVED');
    } else if (currentEstado === 'RESERVED') {
      updateEstado(id, 'PENDING');
    }
    // PAGADO is only reachable via markAsPaid (dual-write)
  };

  const handleStartPay = (id: number) => {
    setPayingItemId(id);
    setSelectedMedioPago('');
  };

  const handleConfirmPay = async (mp: MovimientoPrevisto, def: ServicioDefinicion | undefined) => {
    if (!selectedMedioPago || !def) return;
    try {
      await markAsPaid(mp.id, def, selectedMedioPago);
      setPayingItemId(null);
      setSelectedMedioPago('');
    } catch (err) {
      // Error ya logueado en el hook
    }
  };

  const handleCancelPay = () => {
    setPayingItemId(null);
    setSelectedMedioPago('');
  };

  const getStatusVariant = (estado: EstadoPrevisto): React.ComponentProps<typeof Badge>['variant'] => {
    switch (estado) {
      case 'PENDING': return 'default';
      case 'RESERVED': return 'warning';
      case 'PAID':
      case 'PAGADO': return 'sage';
    }
  };

  const getStatusLabel = (estado: EstadoPrevisto) => {
    switch (estado) {
      case 'PENDING': return 'Por Pagar';
      case 'RESERVED': return 'Reservado';
      case 'PAID':
      case 'PAGADO': return 'Pagado';
    }
  };

  const handleAddServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServicio.nombre || !newServicio.dia_vencimiento) return;

    await addServicio({
      nombre: newServicio.nombre,
      monto_estimado: newServicio.monto_estimado ? parseFloat(newServicio.monto_estimado) : undefined,
      moneda: newServicio.moneda,
      unidad: newServicio.unidad,
      categoria: newServicio.categoria,
      concepto: newServicio.concepto,
      detalle: newServicio.detalle || newServicio.nombre,
      dia_vencimiento: parseInt(newServicio.dia_vencimiento),
      es_debito_automatico: newServicio.es_debito_automatico,
      activo: true,
    });
    setIsAddModalOpen(false);
    setNewServicio({
      nombre: '',
      monto_estimado: '',
      moneda: 'ARS' as Moneda,
      unidad: 'HOGAR' as Unidad,
      categoria: 'Vivienda',
      concepto: 'Alquiler',
      detalle: '',
      dia_vencimiento: '',
      es_debito_automatico: false,
    });
  };

  const paidCount = movimientosPrevistos.filter(mp => mp.estado === 'PAID' || mp.estado === 'PAGADO').length;
  const progress = movimientosPrevistos.length > 0 ? (paidCount / movimientosPrevistos.length) * 100 : 0;

  const sortedItems = [...movimientosPrevistos].sort((a, b) => {
    const aPaid = a.estado === 'PAID' || a.estado === 'PAGADO';
    const bPaid = b.estado === 'PAID' || b.estado === 'PAGADO';
    if (aPaid && !bPaid) return 1;
    if (!aPaid && bPaid) return -1;
    const aDia = servicios.find(s => s.id === a.referencia_id)?.dia_vencimiento ?? 99;
    const bDia = servicios.find(s => s.id === b.referencia_id)?.dia_vencimiento ?? 99;
    return aDia - bDia;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1 font-serif">Pagos Mensuales</h1>
          <p className="text-stone-500 text-sm font-medium">Checklist de servicios</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2 bg-terracotta-500 rounded-xl border border-terracotta-400 text-white shadow-lg hover:bg-terracotta-600 transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Monthly Progress Bar */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200 shadow-soft relative overflow-hidden">
        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 font-serif">Progreso del Mes</p>
            <h3 className="text-3xl font-bold text-stone-800 tracking-tight font-serif">{Math.round(progress)}% <span className="text-lg text-stone-400 font-medium">completado</span></h3>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-stone-600">{paidCount} / {movimientosPrevistos.length}</p>
          </div>
        </div>
        <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden border border-stone-200 relative z-10">
          <div
            className="h-full bg-terracotta-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* Services Checklist */}
      <div className="grid gap-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-stone-500 font-medium">No hay servicios para este mes</p>
            <p className="text-stone-400 text-sm">El workflow n8n genera los pagos previstos a inicio de cada mes.</p>
            <p className="text-stone-400 text-sm">Podés agregar servicios recurrentes con el botón +</p>
          </div>
        ) : (
          sortedItems.map((mp) => {
            const def = servicios.find(s => s.id === mp.referencia_id);
            const isPaid = mp.estado === 'PAID' || mp.estado === 'PAGADO';
            const statusVariant = getStatusVariant(mp.estado);
            const statusLabel = getStatusLabel(mp.estado);
            const monto = mp.monto_real ?? mp.monto_estimado ?? def?.monto_estimado;

            return (
              <Card
                key={mp.id}
                padding="md"
                shadow="soft"
                onClick={() => handleToggleEstado(mp.id, mp.estado)}
                className={`transition-all duration-300 cursor-pointer select-none active:scale-[0.98] relative overflow-hidden group ${isPaid ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${isPaid ? 'bg-sage-50 text-sage-600 border-sage-200' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                      {def?.categoria.toLowerCase().includes('vivienda') ? <Zap size={18} /> :
                        def?.categoria.toLowerCase().includes('aliment') ? <Wifi size={18} /> :
                          <Receipt size={18} />}
                    </div>
                    <div>
                      <p className={`font-bold text-sm transition-colors ${isPaid ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                        {mp.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-tight">
                          {def ? `Día ${def.dia_vencimiento} • ` : ''}{mp.moneda}
                        </span>
                        {def?.es_debito_automatico && (
                          <Badge variant="navy" className="text-[8px] px-1.5 py-0.5 rounded uppercase">Auto</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {monto != null ? (
                      <>
                        <p className={`text-base font-bold tracking-tight ${isPaid ? 'text-stone-400' : 'text-stone-800'}`}>
                          {formatCurrency(monto, mp.moneda)}
                        </p>
                        <p className="text-[9px] text-stone-400 font-bold">{mp.moneda}</p>
                      </>
                    ) : (
                      <p className="text-xs text-stone-400">Sin monto</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                  <Badge variant={statusVariant} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    {isPaid ? <CheckCircle2 size={10} /> : <CircleDashed size={10} />}
                    {statusLabel}
                  </Badge>

                  {mp.estado === 'PENDING' && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {payingItemId === mp.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="text-xs rounded-lg border border-stone-300 bg-white text-stone-800 px-2 py-1 focus:outline-none focus:border-terracotta-400"
                            value={selectedMedioPago}
                            onChange={e => setSelectedMedioPago(e.target.value)}
                          >
                            <option value="">Medio de pago</option>
                            {mediosPago.map(medio => (
                              <option key={medio.id} value={medio.nombre}>{medio.nombre}</option>
                            ))}
                          </select>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleConfirmPay(mp, def)}
                            disabled={!selectedMedioPago}
                          >
                            OK
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelPay}
                          >
                            X
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartPay(mp.id)}
                        >
                          <CreditCard size={12} className="mr-1" />
                          Marcar pagado
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nuevo Servicio Recurrente">
        <p className="text-stone-500 text-xs mb-4">Esto agrega una definición recurrente. El workflow n8n generará el pago mensual automáticamente.</p>
        <form onSubmit={handleAddServicio} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Netflix"
            value={newServicio.nombre}
            onChange={e => setNewServicio({ ...newServicio, nombre: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Monto estimado"
              value={newServicio.monto_estimado}
              onChange={e => setNewServicio({ ...newServicio, monto_estimado: e.target.value })}
            />
            <Input
              type="number"
              min={1}
              max={31}
              label="Día Vence"
              value={newServicio.dia_vencimiento}
              onChange={e => setNewServicio({ ...newServicio, dia_vencimiento: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Unidad</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 appearance-none"
                value={newServicio.unidad}
                onChange={e => {
                  const unidad = e.target.value as Unidad;
                  const categories = getCategoriesForUnit(unidad);
                  const firstCategory = categories[0]?.name || '';
                  const concepts = getConceptsForCategory(unidad, firstCategory);
                  const firstConcept = concepts[0]?.name || '';
                  setNewServicio({
                    ...newServicio,
                    unidad,
                    categoria: firstCategory,
                    concepto: firstConcept,
                  });
                }}
              >
                <option value="HOGAR">HOGAR</option>
                <option value="PROFESIONAL">PROFESIONAL</option>
                <option value="BRASIL">BRASIL</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Moneda</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 appearance-none"
                value={newServicio.moneda}
                onChange={e => setNewServicio({ ...newServicio, moneda: e.target.value as Moneda })}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
                <option value="USDT">USDT</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Categoría</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 appearance-none"
                value={newServicio.categoria}
                onChange={e => {
                  const categoria = e.target.value;
                  const concepts = getConceptsForCategory(newServicio.unidad, categoria);
                  const firstConcept = concepts[0]?.name || '';
                  setNewServicio({ ...newServicio, categoria, concepto: firstConcept });
                }}
              >
                {getCategoriesForUnit(newServicio.unidad).map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Concepto</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 appearance-none"
                value={newServicio.concepto}
                onChange={e => setNewServicio({ ...newServicio, concepto: e.target.value })}
              >
                {getConceptsForCategory(newServicio.unidad, newServicio.categoria).map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <input
              type="checkbox"
              id="autopay"
              checked={newServicio.es_debito_automatico}
              onChange={e => setNewServicio({ ...newServicio, es_debito_automatico: e.target.checked })}
            />
            <label htmlFor="autopay" className="text-xs text-stone-700 font-medium">¿Es débito automático?</label>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
            Crear Servicio
          </Button>
        </form>
      </Modal>
    </div>
  );
};


