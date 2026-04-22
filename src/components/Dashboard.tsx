import React, { useMemo } from 'react';
import { Wallet, Calendar, ShoppingBag, PawPrint, Coffee, Info, ArrowRight, Loader2 } from 'lucide-react';
import { useMediosPago } from '../hooks/useMediosPago';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useServicios } from '../hooks/useServicios';
import { useTransactions } from '../hooks/useTransactions';

const Dashboard: React.FC = () => {
  const { accounts, loading: loadingAccounts } = useMediosPago();
  const { presupuestos, loading: loadingPresupuestos } = usePresupuestos();
  const { movimientosPrevistos, servicios, loading: loadingServicios } = useServicios();
  const { transactions } = useTransactions({ month: new Date() });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.saldo, 0);

  const upcomingDeadlines = useMemo(() =>
    movimientosPrevistos
      .filter(mp => mp.estado !== 'PAID' && mp.estado !== 'PAGADO')
      .slice(0, 3),
    [movimientosPrevistos]
  );

  const presupuestosConGasto = useMemo(() =>
    presupuestos.map(p => {
      const spent = transactions
        .filter(t => {
          const campo = p.tipo_objetivo === 'categoria' ? t.categoria : t.concepto;
          return campo === p.nombre_objetivo && t.tipo === 'gasto';
        })
        .reduce((sum, t) => sum + parseFloat(String(t.monto)), 0);
      return { ...p, spent };
    }),
    [presupuestos, transactions]
  );

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('aliment') || c.includes('comida') || c.includes('super')) return <ShoppingBag size={18} />;
    if (c.includes('animal') || c.includes('mascota')) return <PawPrint size={18} />;
    if (c.includes('servici') || c.includes('impuesto')) return <Coffee size={18} />;
    return <ShoppingBag size={18} />;
  };

  if (loadingAccounts && accounts.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Familia Mau & Agos</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </h1>
        </div>
        <div className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 flex items-center justify-center text-indigo-400 shadow-lg">
          <Calendar size={18} strokeWidth={2.5} />
        </div>
      </header>

      {/* Hero Balance Card */}
      <section className="relative overflow-hidden rounded-[2rem] p-6 shadow-2xl shadow-indigo-900/30 border border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-indigo-100/80 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Wallet size={14} /> Total Consolidado
              </p>
              <h3 className="text-4xl font-bold text-white tracking-tighter drop-shadow-sm">
                ${totalBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="flex gap-3">
            {accounts.slice(0, 2).map(acc => (
              <div key={acc.id} className="flex-1 bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/5 hover:bg-black/30 transition-colors">
                <div className="flex items-center gap-1.5 mb-1 text-indigo-200">
                  <span className="text-[10px] font-bold uppercase opacity-80">{acc.nombre}</span>
                </div>
                <p className="text-base font-bold text-white tracking-tight">${acc.saldo.toLocaleString()}</p>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="flex-1 bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                <p className="text-xs text-indigo-200">Sin cuentas activas</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-indigo-100/80">
              <Info size={12} />
              <span className="font-medium">Total Cuentas: {accounts.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Semáforo de Presupuesto */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-bold text-slate-200 text-lg">Presupuestos</h4>
        </div>

        <div className="grid gap-3">
          {presupuestosConGasto.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-sm">
              No hay presupuestos definidos.
            </div>
          ) : (
            presupuestosConGasto.map((p) => {
              const percentage = Math.min((p.spent / p.limite) * 100, 100);
              const isOver = p.spent > p.limite;
              const isNearLimit = percentage >= p.porcentaje_alerta;
              let color = 'emerald';
              if (isOver) color = 'rose';
              else if (isNearLimit) color = 'amber';

              return (
                <div key={p.id} className="group p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-900 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
                        {getCategoryIcon(p.nombre_objetivo)}
                      </div>
                      <div>
                        <span className="block font-semibold text-slate-200 text-sm">{p.nombre_objetivo}</span>
                        <span className={`text-[10px] font-bold uppercase ${isOver ? 'text-rose-400' : 'text-slate-500'}`}>
                          {p.unidad || 'GLOBAL'} • {isOver ? 'Excedido' : 'En rango'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-slate-100 tracking-tight">${p.spent.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 font-medium">de ${p.limite.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden relative">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 bg-${color}-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Próximos Vencimientos */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-bold text-slate-200 text-lg">Próximos Vencimientos</h4>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden">
          {loadingServicios ? (
            <div className="p-8 text-center"><Loader2 className="animate-spin text-indigo-500 mx-auto" /></div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Sin vencimientos próximos</div>
          ) : (
            upcomingDeadlines.map((mp) => {
              const def = servicios.find(s => s.id === mp.referencia_id);
              const monto = mp.monto_real ?? mp.monto_estimado ?? def?.monto_estimado;
              return (
                <div key={mp.id} className="flex justify-between items-center p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${mp.estado === 'RESERVED' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`}></div>
                    <div>
                      <p className="text-slate-200 font-semibold text-sm">{mp.nombre}</p>
                      <p className="text-slate-500 text-[10px] font-bold uppercase">{mp.moneda}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {monto != null && (
                      <p className="text-slate-200 font-bold text-sm tracking-tight">${monto.toLocaleString()}</p>
                    )}
                    {def && (
                      <div className="flex items-center justify-end gap-1 text-slate-500">
                        <Calendar size={10} />
                        <p className="text-[10px] font-medium">Día {def.dia_vencimiento}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <button className="w-full py-3 text-xs font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/5 transition-colors flex items-center justify-center gap-2">
            Ver todo el calendario <ArrowRight size={12} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
