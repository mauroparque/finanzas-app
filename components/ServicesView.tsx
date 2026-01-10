
import React, { useState } from 'react';
import { Wifi, Zap, Flame, Receipt, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, CircleDashed } from 'lucide-react';
import { ServiceStatus, ServiceItem } from '../types';

const ServicesView: React.FC = () => {
  const [items, setItems] = useState<ServiceItem[]>([
    { id: '1', name: 'Personal (Celulares)', amount: 69957, status: ServiceStatus.PAID, variation: 'up', dueDate: '12/12' },
    { id: '2', name: 'EPEC (Luz)', amount: 28302, status: ServiceStatus.PAID, variation: 'up', dueDate: '10/12' },
    { id: '3', name: 'Cooperativa', amount: 15767, status: ServiceStatus.PAID, variation: 'down', dueDate: '14/12' },
    { id: '4', name: 'BancoRoela', amount: 6900, status: ServiceStatus.RESERVED, variation: 'up', dueDate: '12/12' },
    { id: '5', name: 'Monotributo Mau', amount: 37500, status: ServiceStatus.PENDING, variation: 'stable', dueDate: '20/12' },
    { id: '6', name: 'Monotributo Agos', amount: 18200, status: ServiceStatus.PENDING, variation: 'stable', dueDate: '20/12' },
    { id: '7', name: 'Alquiler', amount: 720000, status: ServiceStatus.PAID, variation: 'stable', dueDate: '05/12' },
  ]);

  const toggleStatus = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let nextStatus = ServiceStatus.PENDING;
        if (item.status === ServiceStatus.PENDING) nextStatus = ServiceStatus.RESERVED;
        else if (item.status === ServiceStatus.RESERVED) nextStatus = ServiceStatus.PAID;
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const getStatusInfo = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.PENDING: return { label: 'Por Pagar', color: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
      case ServiceStatus.RESERVED: return { label: 'Reservado', color: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
      case ServiceStatus.PAID: return { label: 'Pagado', color: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    }
  };

  const getVariationIcon = (variation: string) => {
    if (variation === 'up') return <ArrowUpRight size={14} className="text-rose-400" />;
    if (variation === 'down') return <ArrowDownRight size={14} className="text-emerald-400" />;
    return <Minus size={14} className="text-slate-500" />;
  };

  const paidCount = items.filter(i => i.status === ServiceStatus.PAID).length;
  const progress = (paidCount / items.length) * 100;

  // Sorting: Pending/Reserved first, Paid last
  const sortedItems = [...items].sort((a, b) => {
    if (a.status === ServiceStatus.PAID && b.status !== ServiceStatus.PAID) return 1;
    if (a.status !== ServiceStatus.PAID && b.status === ServiceStatus.PAID) return -1;
    return 0;
  });

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-white mb-1">Pagos Mensuales</h1>
           <p className="text-slate-400 text-sm font-medium">Checklist de servicios</p>
        </div>
        <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
           <Receipt className="text-indigo-400" size={20} />
        </div>
      </header>

      {/* Monthly Progress Bar */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden">
        {/* Glow effect underneath */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-indigo-500/5 blur-2xl"></div>
        
        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Progreso Diciembre</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">{Math.round(progress)}% <span className="text-lg text-slate-500 font-medium">completado</span></h3>
          </div>
          <div className="text-right">
             <p className="text-xs font-medium text-slate-300">{paidCount} / {items.length}</p>
          </div>
        </div>
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative z-10">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)] relative" 
            style={{ width: `${progress}%` }}
          >
             <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </section>

      {/* Services Checklist */}
      <div className="grid gap-3">
        {sortedItems.map((item) => {
          const statusInfo = getStatusInfo(item.status);
          const isPaid = item.status === ServiceStatus.PAID;
          
          return (
            <div 
              key={item.id} 
              onClick={() => toggleStatus(item.id)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none active:scale-[0.98] relative overflow-hidden group
                ${isPaid ? 'bg-slate-900/30 border-slate-800/30 opacity-60 hover:opacity-100' : 'bg-slate-900/80 border-slate-700 shadow-md hover:border-indigo-500/30'}`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPaid ? 'bg-emerald-900/20 text-emerald-600/50' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                    {item.name.toLowerCase().includes('luz') ? <Zap size={18} /> : 
                     item.name.toLowerCase().includes('internet') || item.name.toLowerCase().includes('personal') ? <Wifi size={18} /> : 
                     <Receipt size={18} />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm transition-colors ${isPaid ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Vence {item.dueDate}</span>
                      {!isPaid && (
                        <div className="flex items-center gap-0.5 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
                          {getVariationIcon(item.variation)}
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{item.variation === 'stable' ? 'Igual' : item.variation === 'up' ? 'Subió' : 'Bajó'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold tracking-tight ${isPaid ? 'text-slate-500' : 'text-white'}`}>${item.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1.5 ${statusInfo.border} ${statusInfo.color} ${statusInfo.text}`}>
                  {isPaid ? <CheckCircle2 size={10} /> : <CircleDashed size={10} />}
                  {statusInfo.label}
                </div>
                <div className={`text-[10px] font-medium transition-colors ${isPaid ? 'text-emerald-500/50' : 'text-indigo-400 opacity-0 group-hover:opacity-100'}`}>
                   {isPaid ? 'Completado' : 'Tocar para cambiar'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesView;
