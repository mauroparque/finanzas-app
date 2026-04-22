import React, { useState } from 'react';
import { Wifi, Zap, Receipt, CheckCircle2, CircleDashed, Loader2, Plus } from 'lucide-react';
import type { EstadoPrevisto, Moneda, Unidad } from '../types';
import { useServicios } from '../hooks/useServicios';
import Modal from './common/Modal';

interface ServicesViewProps {
  onBack?: () => void;
}

const ServicesView: React.FC<ServicesViewProps> = ({ onBack }) => {
  const { movimientosPrevistos, servicios, loading, updateEstado, addServicio } = useServicios();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const handleToggleEstado = (id: number, currentEstado: EstadoPrevisto) => {
    let nextEstado: EstadoPrevisto = 'PENDING';
    if (currentEstado === 'PENDING') nextEstado = 'RESERVED';
    else if (currentEstado === 'RESERVED') nextEstado = 'PAID';
    updateEstado(id, nextEstado);
  };

  const getStatusInfo = (estado: EstadoPrevisto) => {
    switch (estado) {
      case 'PENDING': return { label: 'Por Pagar', color: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
      case 'RESERVED': return { label: 'Reservado', color: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'PAID':
      case 'PAGADO': return { label: 'Pagado', color: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
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

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Pagos Mensuales</h1>
          <p className="text-slate-400 text-sm font-medium">Checklist de servicios</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2 bg-indigo-600 rounded-xl border border-indigo-500 text-white shadow-lg"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Monthly Progress Bar */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Progreso del Mes</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">{Math.round(progress)}% <span className="text-lg text-slate-500 font-medium">completado</span></h3>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-300">{paidCount} / {movimientosPrevistos.length}</p>
          </div>
        </div>
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative z-10">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* Services Checklist */}
      <div className="grid gap-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-slate-400 font-medium">No hay servicios para este mes</p>
            <p className="text-slate-500 text-sm">El workflow n8n genera los pagos previstos a inicio de cada mes.</p>
            <p className="text-slate-500 text-sm">Podés agregar servicios recurrentes con el botón +</p>
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
                onClick={() => handleToggleEstado(mp.id, mp.estado)}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none active:scale-[0.98] relative overflow-hidden group
                        ${isPaid ? 'bg-slate-900/30 border-slate-800/30 opacity-60' : 'bg-slate-900/80 border-slate-700 shadow-md hover:border-indigo-500/30'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPaid ? 'bg-emerald-900/20 text-emerald-600/50' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                      {def?.categoria.toLowerCase().includes('vivienda') ? <Zap size={18} /> :
                        def?.categoria.toLowerCase().includes('aliment') ? <Wifi size={18} /> :
                          <Receipt size={18} />}
                    </div>
                    <div>
                      <p className={`font-bold text-sm transition-colors ${isPaid ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                        {mp.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                          {def ? `Día ${def.dia_vencimiento} • ` : ''}{mp.moneda}
                        </span>
                        {def?.es_debito_automatico && (
                          <div className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-bold rounded uppercase border border-indigo-500/20">Auto</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {monto != null ? (
                      <>
                        <p className={`text-base font-bold tracking-tight ${isPaid ? 'text-slate-500' : 'text-white'}`}>
                          ${monto.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold">{mp.moneda}</p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">Sin monto</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${statusInfo.border} ${statusInfo.color} ${statusInfo.text}`}>
                    {isPaid ? <CheckCircle2 size={10} /> : <CircleDashed size={10} />}
                    {statusInfo.label}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nuevo Servicio Recurrente">
        <p className="text-slate-400 text-xs mb-4">Esto agrega una definición recurrente. El workflow n8n generará el pago mensual automáticamente.</p>
        <form onSubmit={handleAddServicio} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nombre</label>
            <input
              className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
              placeholder="Ej: Netflix"
              value={newServicio.nombre}
              onChange={e => setNewServicio({ ...newServicio, nombre: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Monto estimado</label>
              <input
                type="number"
                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
                value={newServicio.monto_estimado}
                onChange={e => setNewServicio({ ...newServicio, monto_estimado: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Día Vence</label>
              <input
                type="number"
                min="1" max="31"
                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
                value={newServicio.dia_vencimiento}
                onChange={e => setNewServicio({ ...newServicio, dia_vencimiento: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Unidad</label>
              <select
                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white appearance-none"
                value={newServicio.unidad}
                onChange={e => setNewServicio({ ...newServicio, unidad: e.target.value as Unidad })}
              >
                <option value="HOGAR">HOGAR</option>
                <option value="PROFESIONAL">PROFESIONAL</option>
                <option value="BRASIL">BRASIL</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Moneda</label>
              <select
                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white appearance-none"
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
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
            <input
              type="checkbox"
              id="autopay"
              checked={newServicio.es_debito_automatico}
              onChange={e => setNewServicio({ ...newServicio, es_debito_automatico: e.target.checked })}
            />
            <label htmlFor="autopay" className="text-xs text-slate-300 font-medium">¿Es débito automático?</label>
          </div>
          <button className="w-full bg-indigo-600 font-bold py-4 rounded-xl text-white shadow-xl mt-2">Crear Servicio</button>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesView;
