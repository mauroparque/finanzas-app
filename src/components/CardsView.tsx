
import React, { useState } from 'react';
import { Smartphone, ShoppingCart, Home, Utensils, TrendingUp, Landmark, PieChart, CreditCard, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

const CardsView: React.FC = () => {
  const [activeCard, setActiveCard] = useState<'visa' | 'prestamos'>('visa');

  // Proyección: Mes Actual (Dic), Mes Próximo (Ene), Mes +2 (Feb)
  const projectionData = [
    { month: 'Dic', total: 746860, label: 'Actual' },
    { month: 'Ene', total: 598492, label: 'Próximo' },
    { month: 'Feb', total: 478549, label: 'Futuro' },
  ];

  const installments = [
    { icon: <Smartphone size={18} />, desc: 'Celu Samsung', current: 15, total: 18, amount: 55555.55, category: 'Tech' },
    { icon: <Utensils size={18} />, desc: 'Essen', current: 14, total: 18, amount: 45708, category: 'Hogar' },
    { icon: <ShoppingCart size={18} />, desc: 'Aspiradora', current: 7, total: 24, amount: 23209.16, category: 'Hogar' },
    { icon: <Home size={18} />, desc: 'Colchón', current: 5, total: 12, amount: 14817.58, category: 'Hogar' },
    { icon: <ShoppingCart size={18} />, desc: 'Easy', current: 2, total: 6, amount: 50812.50, category: 'Construcción' },
  ];

  const loans = [
    { name: 'BNA', current: 15, total: 36, amount: 152590, totalDebt: 3182782, color: 'from-blue-600 to-blue-800' },
    { name: 'BBVA', current: 5, total: 6, amount: 51737, totalDebt: 101847, color: 'from-indigo-600 to-indigo-800' },
    { name: 'ANSES', current: 23, total: 36, amount: 54336, totalDebt: 759320, color: 'from-emerald-600 to-emerald-800' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
           <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Financiación</h1>
           <p className="text-slate-400 text-sm font-medium">Control de cuotas y límites</p>
        </div>
        <div className="w-10 h-10 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center text-indigo-400 backdrop-blur-sm shadow-lg">
           <PieChart size={20} />
        </div>
      </header>

      {/* Modern Toggle */}
      <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 flex relative shadow-inner animate-in zoom-in-95 duration-500 delay-100">
        <div 
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${activeCard === 'visa' ? 'left-1.5' : 'left-[calc(50%+4.5px)]'}`}
        ></div>
        <button 
          onClick={() => setActiveCard('visa')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${activeCard === 'visa' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <CreditCard size={14} /> Visa / Master
        </button>
        <button 
          onClick={() => setActiveCard('prestamos')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${activeCard === 'prestamos' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Landmark size={14} /> Préstamos
        </button>
      </div>

      <div className="relative min-h-[400px]">
        {activeCard === 'visa' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Projection Chart Card */}
            <section className="bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Proyección de Pagos</h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Próximos 3 meses</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white tracking-tight">${projectionData[0].total.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Este mes</p>
                </div>
              </div>
              
              <div className="h-44 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectionData} barSize={48}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      dy={15}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 p-3 rounded-xl shadow-2xl transform translate-y-[-10px]">
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{payload[0].payload.label}</p>
                              <p className="text-lg font-bold text-white tracking-tight">${payload[0].value?.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" radius={[12, 12, 12, 12]}>
                      {projectionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? '#6366f1' : '#1e293b'} 
                          stroke={index === 0 ? 'none' : '#334155'}
                          strokeWidth={index === 0 ? 0 : 2}
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Installments List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-lg font-bold text-slate-200">Cuotas Activas</h4>
                <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">{installments.length} activas</span>
              </div>
              
              <div className="grid gap-3">
                {installments.map((item, idx) => {
                   const progress = (item.current / item.total) * 100;
                   return (
                    <div 
                      key={idx} 
                      className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:bg-slate-800/40 hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-800/80 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-300">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.desc}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">${item.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            <span className="text-slate-300">{item.current}</span> <span className="text-slate-600">/</span> {item.total}
                          </p>
                        </div>
                      </div>
                      
                      {/* Integrated Progress */}
                      <div className="relative pt-2">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span>Progreso</span>
                          <span>Faltan {item.total - item.current} cuotas</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between px-2 mb-2">
               <h4 className="text-lg font-bold text-slate-200">Mis Préstamos</h4>
               <button className="text-[10px] font-bold uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full hover:bg-indigo-500/20 transition-colors">
                 Ver consolidado
               </button>
            </div>
            
            {loans.map((loan, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group transition-transform duration-300 hover:scale-[1.02] animate-in slide-in-from-bottom-8 fade-in fill-mode-backwards`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Dynamic Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${loan.color} opacity-20 group-hover:opacity-25 transition-opacity`}></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg">
                        <Landmark size={18} />
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-lg tracking-tight">{loan.name}</h5>
                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Préstamo Personal</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white tracking-tighter drop-shadow-md">${loan.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-white/60 uppercase font-bold">Cuota Mensual</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/5 space-y-3 group-hover:bg-black/30 transition-colors">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-white/70 font-medium">Progreso del pago</span>
                       <span className="text-white font-bold">{Math.round((loan.current / loan.total) * 100)}%</span>
                    </div>
                    
                    <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] relative overflow-hidden" 
                        style={{ width: `${(loan.current / loan.total) * 100}%` }}
                      >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end pt-1">
                      <div>
                        <p className="text-[10px] text-white/50 font-medium uppercase mb-0.5">Cuotas Pagas</p>
                        <p className="text-sm font-bold text-white">{loan.current} <span className="text-white/40 text-xs">/ {loan.total}</span></p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-white/50 font-medium uppercase mb-0.5">Deuda Restante</p>
                         <div className="flex items-center gap-1 justify-end text-white/90">
                           <span className="text-sm font-bold">${(loan.totalDebt - (loan.amount * loan.current)).toLocaleString()}</span>
                           <ArrowRight size={10} className="text-white/50" />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardsView;
