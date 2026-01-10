
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, AlertCircle, ShoppingBag, PawPrint, Coffee, Info, ArrowRight } from 'lucide-react';
import { BudgetCategory } from '../types';

const Dashboard: React.FC = () => {
  const budgets: BudgetCategory[] = [
    { name: 'Alimentos', spent: 300000, limit: 350000, icon: 'ShoppingBag' },
    { name: 'Animales', spent: 351000, limit: 350000, icon: 'PawPrint' },
    { name: 'Servicios', spent: 120928, limit: 150000, icon: 'Coffee' },
  ];

  const upcomingDeadlines = [
    { name: 'EPEC (Luz)', amount: 28302, due: '10/12', type: 'Servicio', urgent: true },
    { name: 'Cooperativa', amount: 15767, due: '14/12', type: 'Servicio', urgent: false },
    { name: 'BancoRoela', amount: 6900, due: '12/12', type: 'Servicio', urgent: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Familia Mau & Agos</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Diciembre 2025</h1>
        </div>
        <div className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 flex items-center justify-center text-indigo-400 shadow-lg">
          <Calendar size={18} strokeWidth={2.5} />
        </div>
      </header>

      {/* Hero Balance Card */}
      <section className="relative overflow-hidden rounded-[2rem] p-6 shadow-2xl shadow-indigo-900/30 border border-white/10 group">
        {/* Card Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-indigo-100/80 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Wallet size={14} /> Total Consolidado
              </p>
              <h3 className="text-4xl font-bold text-white tracking-tighter drop-shadow-sm">$249.087<span className="text-2xl text-indigo-200">,36</span></h3>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/5 hover:bg-black/30 transition-colors">
              <div className="flex items-center gap-1.5 mb-1 text-rose-300">
                <div className="bg-rose-500/20 p-1 rounded-full"><TrendingDown size={12} /></div>
                <span className="text-[10px] font-bold uppercase opacity-80">Deuda Mau</span>
              </div>
              <p className="text-base font-bold text-white tracking-tight">$25.000</p>
            </div>
            <div className="flex-1 bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/5 hover:bg-black/30 transition-colors">
              <div className="flex items-center gap-1.5 mb-1 text-rose-300">
                <div className="bg-rose-500/20 p-1 rounded-full"><TrendingDown size={12} /></div>
                <span className="text-[10px] font-bold uppercase opacity-80">Deuda Agos</span>
              </div>
              <p className="text-base font-bold text-white tracking-tight">$330.390</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
             <div className="flex items-center gap-2 text-[10px] text-indigo-100/80">
              <Info size={12} />
              <span className="font-medium">Deuda total: $355.390</span>
            </div>
          </div>
        </div>
      </section>

      {/* Semáforo de Presupuesto */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-bold text-slate-200 text-lg">Presupuestos</h4>
          <span className="px-2 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-400 font-bold uppercase tracking-wider border border-slate-700">Estado</span>
        </div>
        
        <div className="grid gap-3">
          {budgets.map((b) => {
            const percentage = Math.min((b.spent / b.limit) * 100, 100);
            const isOver = b.spent > b.limit;
            let color = 'emerald';
            
            if (isOver) color = 'rose';
            else if (percentage > 80) color = 'amber';

            return (
              <div key={b.name} className="group p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-900 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
                      {b.icon === 'ShoppingBag' && <ShoppingBag size={18} />}
                      {b.icon === 'PawPrint' && <PawPrint size={18} />}
                      {b.icon === 'Coffee' && <Coffee size={18} />}
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-200 text-sm">{b.name}</span>
                      <span className={`text-[10px] font-bold uppercase ${isOver ? 'text-rose-400' : 'text-slate-500'}`}>
                        {isOver ? 'Excedido' : 'En rango'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-slate-100 tracking-tight">${b.spent.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 font-medium">de ${b.limit.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-${color}-600 to-${color}-400 shadow-[0_0_10px_rgba(0,0,0,0.3)]`} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Próximos Vencimientos */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-bold text-slate-200 text-lg">Próximos Vencimientos</h4>
        </div>
        
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden">
          {upcomingDeadlines.map((v, i) => (
            <div key={i} className="flex justify-between items-center p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${v.urgent ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-slate-600'}`}></div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm">{v.name}</p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">{v.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-200 font-bold text-sm tracking-tight">${v.amount.toLocaleString()}</p>
                <div className="flex items-center justify-end gap-1 text-slate-500">
                  <Calendar size={10} />
                  <p className="text-[10px] font-medium">{v.due}</p>
                </div>
              </div>
            </div>
          ))}
          <button className="w-full py-3 text-xs font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/5 transition-colors flex items-center justify-center gap-2">
            Ver todo el calendario <ArrowRight size={12} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
