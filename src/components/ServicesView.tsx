
import React, { useState } from 'react';
import { Wifi, Zap, Flame, Receipt, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, CircleDashed, Loader2, Plus } from 'lucide-react';
import { ServiceStatus, Service } from '../types';
import { useServices } from '../hooks/useServices';
import Modal from './common/Modal';

interface ServicesViewProps {
  onBack?: () => void;
}

const ServicesView: React.FC<ServicesViewProps> = ({ onBack }) => {
  const { services, loading, updateServiceStatus, addService } = useServices();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Service Form State (Based on user UI hierarchy)
  const [newService, setNewService] = useState({
    name: '',
    amount: '',
    currency: 'ARS' as 'ARS' | 'USD' | 'USDT' | 'BRL',
    unit: 'HOGAR' as 'HOGAR' | 'PROFESIONAL' | 'BRASIL',
    category: 'Vivienda y Vida Diaria',
    concept: 'Servicios e Impuestos',
    detail: '',
    dueDate: '',
    isAutoPay: false
  });

  const handleToggleStatus = (id: string, currentStatus: ServiceStatus) => {
    let nextStatus = ServiceStatus.PENDING;
    if (currentStatus === ServiceStatus.PENDING) nextStatus = ServiceStatus.RESERVED;
    else if (currentStatus === ServiceStatus.RESERVED) nextStatus = ServiceStatus.PAID;
    updateServiceStatus(id, nextStatus);
  };

  const getStatusInfo = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.PENDING: return { label: 'Por Pagar', color: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
      case ServiceStatus.RESERVED: return { label: 'Reservado', color: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
      case ServiceStatus.PAID: return { label: 'Pagado', color: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.amount || !newService.dueDate) return;

    await addService({
      name: newService.name,
      amount: parseFloat(newService.amount),
      currency: newService.currency,
      unit: newService.unit,
      category: newService.category,
      concept: newService.concept,
      detail: newService.detail || newService.name,
      dueDate: parseInt(newService.dueDate),
      status: ServiceStatus.PENDING,
      isAutoPay: newService.isAutoPay,
      isActive: true
    });
    setIsAddModalOpen(false);
  };

  const paidCount = services.filter(i => i.status === ServiceStatus.PAID).length;
  const progress = services.length > 0 ? (paidCount / services.length) * 100 : 0;

  const sortedItems = [...services].sort((a, b) => {
    if (a.status === ServiceStatus.PAID && b.status !== ServiceStatus.PAID) return 1;
    if (a.status !== ServiceStatus.PAID && b.status === ServiceStatus.PAID) return -1;
    return a.dueDate - b.dueDate;
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
            <p className="text-xs font-medium text-slate-300">{paidCount} / {services.length}</p>
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
          <p className="text-center py-10 text-slate-500 italic">No hay servicios registrados.</p>
        ) : (
          sortedItems.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const isPaid = item.status === ServiceStatus.PAID;

            return (
              <div
                key={item.id}
                onClick={() => handleToggleStatus(item.id, item.status)}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none active:scale-[0.98] relative overflow-hidden group
                        ${isPaid ? 'bg-slate-900/30 border-slate-800/30 opacity-60' : 'bg-slate-900/80 border-slate-700 shadow-md hover:border-indigo-500/30'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPaid ? 'bg-emerald-900/20 text-emerald-600/50' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                      {item.category.toLowerCase().includes('vienda') ? <Zap size={18} /> :
                        item.category.toLowerCase().includes('aliment') ? <Wifi size={18} /> :
                          <Receipt size={18} />}
                    </div>
                    <div>
                      <p className={`font-bold text-sm transition-colors ${isPaid ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Día {item.dueDate} • {item.unit}</span>
                        {item.isAutoPay && <div className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-bold rounded uppercase border border-indigo-500/20">Auto</div>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold tracking-tight ${isPaid ? 'text-slate-500' : 'text-white'}`}>${item.amount.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{item.currency}</p>
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
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nombre del Servicio</label>
            <input
              className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
              placeholder="Ej: Netflix"
              value={newService.name}
              onChange={e => setNewService({ ...newService, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Monto $</label>
              <input
                type="number"
                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
                value={newService.amount}
                onChange={e => setNewService({ ...newService, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Día Vence</label>
              <input
                type="number"
                min="1" max="31"
                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
                value={newService.dueDate}
                onChange={e => setNewService({ ...newService, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Unidad</label>
              <select
                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white appearance-none"
                value={newService.unit}
                onChange={e => setNewService({ ...newService, unit: e.target.value as any })}
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
                value={newService.currency}
                onChange={e => setNewService({ ...newService, currency: e.target.value as any })}
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
              checked={newService.isAutoPay}
              onChange={e => setNewService({ ...newService, isAutoPay: e.target.checked })}
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
