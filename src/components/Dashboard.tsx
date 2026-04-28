import React, { useMemo } from 'react';
import { Wallet, Calendar, ShoppingBag, PawPrint, Coffee, Info, ArrowRight, Loader2 } from 'lucide-react';
import { useMediosPago } from '../hooks/useMediosPago';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useServicios } from '../hooks/useServicios';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from './common/ui/Card';
import { Badge } from './common/ui/Badge';
import { CotizacionWidget } from './common/CotizacionWidget';
import { formatCurrency } from '../utils/formatters';

const Dashboard: React.FC = () => {
  const { accounts, loading: loadingAccounts } = useMediosPago();
  const { presupuestos, loading: loadingPresupuestos } = usePresupuestos();
  const { movimientosPrevistos, servicios, loading: loadingServicios } = useServicios();
  const monthFilter = useMemo(() => new Date(), []);
  const { transactions } = useTransactions({ month: monthFilter });

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

  // Static Tailwind JIT-safe color mappings
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    rose: 'bg-rose-500/10',
  };
  const textMap: Record<string, string> = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  };
  const barMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  if (loadingAccounts && accounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-0.5">
            Familia Mau & Agos
          </p>
          <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight">
            {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </h1>
        </div>
        <div className="w-10 h-10 bg-stone-100 rounded-full border border-stone-200 flex items-center justify-center text-terracotta-600 shadow-soft">
          <Calendar size={18} strokeWidth={2.5} />
        </div>
      </header>

      {/* Hero Balance Card */}
      <Card padding="lg" shadow="card" className="bg-stone-50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-stone-500 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Wallet size={14} /> Total Consolidado
            </p>
            <h3 className="text-4xl font-serif font-bold text-stone-800 tracking-tighter">
              {formatCurrency(totalBalance, 'ARS')}
            </h3>
          </div>
        </div>

        <div className="flex gap-3">
          {accounts.slice(0, 2).map(acc => (
            <div
              key={acc.id}
              className="flex-1 bg-white rounded-2xl p-3 border border-stone-200"
            >
              <div className="flex items-center gap-1.5 mb-1 text-stone-500">
                <span className="text-[10px] font-bold uppercase opacity-80">{acc.nombre}</span>
              </div>
              <p className="text-base font-bold text-stone-800 tracking-tight">
                {formatCurrency(acc.saldo, acc.moneda)}
              </p>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="flex-1 bg-white rounded-2xl p-3 border border-stone-200">
              <p className="text-xs text-stone-500">Sin cuentas activas</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-stone-500">
            <Info size={12} />
            <span className="font-medium">Total Cuentas: {accounts.length}</span>
          </div>
        </div>
      </Card>

      {/* Cotizaciones FX Widget */}
      <CotizacionWidget />

      {/* Semáforo de Presupuesto */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-serif font-bold text-stone-800 text-lg">Presupuestos</h4>
        </div>

        <div className="grid gap-3">
          {presupuestosConGasto.length === 0 ? (
            <Card padding="md" shadow="soft">
              <p className="text-center text-stone-500 text-sm">No hay presupuestos definidos.</p>
            </Card>
          ) : (
            presupuestosConGasto.map((p) => {
              const percentage = Math.min((p.spent / p.limite) * 100, 100);
              const isOver = p.spent > p.limite;
              const isNearLimit = percentage >= p.porcentaje_alerta;
              let color = 'emerald';
              if (isOver) color = 'rose';
              else if (isNearLimit) color = 'amber';

              return (
                <Card key={p.id} padding="md" shadow="soft" className="group">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${bgMap[color]} ${textMap[color]} group-hover:scale-110 transition-transform`}
                      >
                        {getCategoryIcon(p.nombre_objetivo)}
                      </div>
                      <div>
                        <span className="block font-semibold text-stone-800 text-sm">
                          {p.nombre_objetivo}
                        </span>
                        <span className={`text-[10px] font-bold uppercase ${isOver ? 'text-rose-600' : 'text-stone-500'}`}>
                          {p.unidad || 'GLOBAL'} • {isOver ? 'Excedido' : 'En rango'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-stone-800 tracking-tight">
                        {formatCurrency(p.spent, p.moneda)}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        de {formatCurrency(p.limite, p.moneda)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden relative">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${barMap[color]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Próximos Vencimientos */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-serif font-bold text-stone-800 text-lg">Próximos Vencimientos</h4>
        </div>

        <Card padding="none" shadow="soft" className="overflow-hidden">
          {loadingServicios ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin text-terracotta-500 mx-auto" size={24} />
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm">
              Sin vencimientos próximos
            </div>
          ) : (
            upcomingDeadlines.map((mp) => {
              const def = servicios.find(s => s.id === mp.referencia_id);
              const monto = mp.monto_real ?? mp.monto_estimado ?? def?.monto_estimado;
              return (
                <div
                  key={mp.id}
                  className="flex justify-between items-center p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        mp.estado === 'RESERVED'
                          ? 'bg-sage-500'
                          : 'bg-terracotta-500 animate-pulse'
                      }`}
                    />
                    <div>
                      <p className="text-stone-800 font-semibold text-sm">{mp.nombre}</p>
                      <p className="text-stone-500 text-[10px] font-bold uppercase">{mp.moneda}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {monto != null && (
                      <p className="text-stone-800 font-bold text-sm tracking-tight">
                        {formatCurrency(monto, mp.moneda)}
                      </p>
                    )}
                    {def && (
                      <div className="flex items-center justify-end gap-1 text-stone-500">
                        <Calendar size={10} />
                        <p className="text-[10px] font-medium">Día {def.dia_vencimiento}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <button className="w-full py-3 text-xs font-bold text-terracotta-600 uppercase tracking-widest hover:bg-terracotta-50 transition-colors flex items-center justify-center gap-2">
            Ver todo el calendario <ArrowRight size={12} />
          </button>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
