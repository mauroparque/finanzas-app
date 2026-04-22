import React, { useState } from 'react';
import { Wifi, Zap, Receipt, CheckCircle2, CircleDashed, Loader2, Plus } from 'lucide-react';
import type { EstadoPrevisto, Moneda, MovimientoPrevisto, Unidad } from '../types';
import { useServicios } from '../hooks/useServicios';
import Modal from './common/Modal';
import { cn } from '../utils/cn';

interface ServicesViewProps {
  onBack?: () => void;
}

const ServicesView: React.FC<ServicesViewProps> = ({ onBack }) => {
  const { movimientosPrevistos, servicios, loading, addServicio, marcarComoPagado } = useServicios();

  // — Add service modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // — Marcar pagado modal state
  const [isPagarModalOpen, setIsPagarModalOpen] = useState(false);
  const [selectedPrevisto, setSelectedPrevisto] = useState<MovimientoPrevisto | null>(null);
  const [montoInput, setMontoInput] = useState('');
  const [isPagando, setIsPagando] = useState(false);
  const [pagarError, setPagarError] = useState<string | null>(null);

  const [newServicio, setNewServicio] = useState({
    nombre: '',
    monto_estimado: '',
    moneda: 'ARS' as Moneda,
    unidad: 'HOGAR' as Unidad,
    categoria: 'Vivienda y Vida Diaria',
    concepto: 'Servicios e Impuestos',
    detalle: '',
    dia_vencimiento: '',
    es_debito_automatico: false,
  });

  const openPagarModal = (mp: MovimientoPrevisto) => {
    setSelectedPrevisto(mp);
    const montoDefault = mp.monto_real ?? mp.monto_estimado ?? '';
    setMontoInput(montoDefault !== '' ? String(montoDefault) : '');
    setPagarError(null);
    setIsPagarModalOpen(true);
  };

  const closePagarModal = () => {
    setIsPagarModalOpen(false);
    setSelectedPrevisto(null);
    setMontoInput('');
    setPagarError(null);
  };

  const handleConfirmarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrevisto) return;

    const monto = parseFloat(montoInput);
    if (isNaN(monto) || monto <= 0) {
      setPagarError('Ingresá un monto válido mayor a 0');
      return;
    }

    setIsPagando(true);
    setPagarError(null);
    try {
      await marcarComoPagado(selectedPrevisto.id, monto);
      closePagarModal();
    } catch {
      setPagarError('Error al registrar el pago. Intentá de nuevo.');
    } finally {
      setIsPagando(false);
    }
  };

  const getStatusInfo = (estado: EstadoPrevisto) => {
    switch (estado) {
      case 'PENDING':
        return {
          label: 'Por Pagar',
          badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
          icon: <CircleDashed size={10} />,
        };
      case 'RESERVED':
        return {
          label: 'Reservado',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <CircleDashed size={10} />,
        };
      case 'PAID':
      case 'PAGADO':
        return {
          label: 'Pagado',
          badgeClass: 'bg-sage-50 text-sage-700 border-sage-200',
          icon: <CheckCircle2 size={10} />,
        };
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
        <Loader2 className="animate-spin text-terracotta-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1">Pagos Mensuales</h1>
          <p className="text-stone-500 text-sm font-medium">Checklist de servicios</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2 bg-terracotta-500 hover:bg-terracotta-600 rounded-xl text-white shadow-md transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Monthly Progress Bar */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200 shadow-soft">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-1">Progreso del Mes</p>
            <h3 className="text-3xl font-bold text-stone-900 tracking-tight">
              {Math.round(progress)}%{' '}
              <span className="text-lg text-stone-400 font-medium">completado</span>
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-stone-500">{paidCount} / {movimientosPrevistos.length}</p>
          </div>
        </div>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
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
            const statusInfo = getStatusInfo(mp.estado);
            const monto = mp.monto_real ?? mp.monto_estimado ?? def?.monto_estimado;

            return (
              <div
                key={mp.id}
                className={cn(
                  'p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden',
                  isPaid
                    ? 'bg-stone-50 border-stone-200 opacity-70'
                    : 'bg-white border-stone-200 shadow-sm hover:border-terracotta-300'
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      isPaid
                        ? 'bg-stone-100 text-stone-400'
                        : 'bg-terracotta-50 text-terracotta-500 border border-terracotta-100'
                    )}>
                      {def?.categoria.toLowerCase().includes('vivienda') ? <Zap size={18} /> :
                        def?.categoria.toLowerCase().includes('aliment') ? <Wifi size={18} /> :
                          <Receipt size={18} />}
                    </div>
                    <div>
                      <p className={cn(
                        'font-bold text-sm transition-colors',
                        isPaid ? 'text-stone-400 line-through' : 'text-stone-800'
                      )}>
                        {mp.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">
                          {def ? `Día ${def.dia_vencimiento} • ` : ''}{mp.moneda}
                        </span>
                        {def?.es_debito_automatico && (
                          <div className="px-1.5 py-0.5 bg-sage-50 text-sage-600 text-[8px] font-bold rounded uppercase border border-sage-200">
                            Auto
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {monto != null ? (
                      <>
                        <p className={cn(
                          'text-base font-bold tracking-tight',
                          isPaid ? 'text-stone-400' : 'text-stone-800'
                        )}>
                          {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: mp.moneda === 'USDT' ? 'USD' : mp.moneda,
                            maximumFractionDigits: 0,
                          }).format(parseFloat(String(monto)))}
                        </p>
                        <p className="text-[9px] text-stone-400 font-bold">{mp.moneda}</p>
                      </>
                    ) : (
                      <p className="text-xs text-stone-400">Sin monto</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                  {/* Status badge */}
                  <div className={cn(
                    'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5',
                    statusInfo.badgeClass
                  )}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </div>

                  {/* Action button — only for non-paid items */}
                  {!isPaid && (
                    <button
                      onClick={() => openPagarModal(mp)}
                      className="px-3 py-1.5 bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95"
                    >
                      Marcar pagado
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Modal: Marcar como pagado ── */}
      <Modal
        isOpen={isPagarModalOpen}
        onClose={closePagarModal}
        title={`Pagar: ${selectedPrevisto?.nombre ?? ''}`}
      >
        <form onSubmit={handleConfirmarPago} className="space-y-4">
          <p className="text-stone-500 text-sm">
            Ingresá el monto real abonado. Se creará un movimiento de gasto y el servicio quedará marcado como pagado.
          </p>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 block">
              Monto pagado ({selectedPrevisto?.moneda ?? 'ARS'})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
              placeholder="0,00"
              value={montoInput}
              onChange={e => setMontoInput(e.target.value)}
              autoFocus
              required
            />
          </div>

          {pagarError && (
            <p className="text-red-600 text-xs font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {pagarError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closePagarModal}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPagando}
              className="flex-1 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-colors active:scale-95"
            >
              {isPagando ? 'Registrando...' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Nuevo Servicio Recurrente ── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nuevo Servicio Recurrente">
        <p className="text-stone-500 text-xs mb-4">
          Esto agrega una definición recurrente. El workflow n8n generará el pago mensual automáticamente.
        </p>
        <form onSubmit={handleAddServicio} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block">Nombre</label>
            <input
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              placeholder="Ej: Netflix"
              value={newServicio.nombre}
              onChange={e => setNewServicio({ ...newServicio, nombre: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block">Monto estimado</label>
              <input
                type="number"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                value={newServicio.monto_estimado}
                onChange={e => setNewServicio({ ...newServicio, monto_estimado: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block">Día Vence</label>
              <input
                type="number"
                min="1"
                max="31"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                value={newServicio.dia_vencimiento}
                onChange={e => setNewServicio({ ...newServicio, dia_vencimiento: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block">Unidad</label>
              <select
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                value={newServicio.unidad}
                onChange={e => setNewServicio({ ...newServicio, unidad: e.target.value as Unidad })}
              >
                <option value="HOGAR">HOGAR</option>
                <option value="PROFESIONAL">PROFESIONAL</option>
                <option value="BRASIL">BRASIL</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block">Moneda</label>
              <select
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-terracotta-400"
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
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <input
              type="checkbox"
              id="autopay"
              checked={newServicio.es_debito_automatico}
              onChange={e => setNewServicio({ ...newServicio, es_debito_automatico: e.target.checked })}
            />
            <label htmlFor="autopay" className="text-xs text-stone-600 font-medium">¿Es débito automático?</label>
          </div>
          <button
            type="submit"
            className="w-full bg-terracotta-500 hover:bg-terracotta-600 font-bold py-4 rounded-xl text-white shadow-md transition-colors mt-2"
          >
            Crear Servicio
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesView;
