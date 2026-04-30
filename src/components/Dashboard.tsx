import React, { useMemo, useState } from 'react';
import { Wallet, Calendar, ChevronLeft, ChevronRight, ShoppingBag, PawPrint, Coffee, Info, ArrowRight, Loader2 } from 'lucide-react';
import { useMediosPago } from '../hooks/useMediosPago';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useServicios } from '../hooks/useServicios';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { Card } from './common/ui/Card';
import { Badge } from './common/ui/Badge';
import { CotizacionWidget } from './common/CotizacionWidget';
import { BalanceAccordion } from './dashboard/BalanceAccordion';
import { formatCurrency } from '../utils/formatters';

export function Dashboard() {
  const { accounts, loading: loadingAccounts } = useMediosPago();
  const { presupuestos, loading: loadingPresupuestos } = usePresupuestos();
  const { movimientosPrevistos, servicios, loading: loadingServicios } = useServicios();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const { transactions } = useTransactions({ month: selectedMonth });

  const goToPrevMonth = () => {
    setSelectedMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const balancesByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    accounts.forEach(acc => {
      const moneda = acc.moneda;
      map[moneda] = (map[moneda] || 0) + parseFloat(String(acc.saldo));
    });
    return map;
  }, [accounts]);

  const spentByMacro = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.tipo === 'gasto')
      .forEach(t => {
        const macro = t.macro || 'VIVIR';
        const monto = parseFloat(String(t.monto));
        map[macro] = (map[macro] || 0) + monto;
      });
    return map;
  }, [transactions]);

  const upcomingDeadlines = useMemo(() =>
    movimientosPrevistos
      .filter(mp => mp.estado !== 'PAGADO')
      .slice(0, 3),
    [movimientosPrevistos]
  );

  const presupuestosConGasto = useBudgetStatus(presupuestos, transactions);

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
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-1 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight min-w-[180px] text-center">
              {selectedMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </h1>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="w-10 h-10 bg-stone-100 rounded-full border border-stone-200 flex items-center justify-center text-terracotta-600 shadow-soft">
          <Calendar size={18} strokeWidth={2.5} />
        </div>
      </header>

      {/* Hero Balance Accordion */}
      <BalanceAccordion accounts={accounts} />

      {/* Macro Summary */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-serif font-bold text-stone-800 text-lg">
            ¿En qué gastamos?
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(['VIVIR', 'TRABAJAR', 'DEBER', 'DISFRUTAR'] as const).map(macro => {
            const spent = spentByMacro[macro] || 0;
            const labels: Record<string, string> = {
              VIVIR: 'Vivir',
              TRABAJAR: 'Trabajar',
              DEBER: 'Deber',
              DISFRUTAR: 'Disfrutar',
            };
            const colors: Record<string, { bg: string; text: string }> = {
              VIVIR: { bg: 'bg-sage-500/10', text: 'text-sage-600' },
              TRABAJAR: { bg: 'bg-navy-500/10', text: 'text-navy-600' },
              DEBER: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
              DISFRUTAR: { bg: 'bg-terracotta-500/10', text: 'text-terracotta-600' },
            };
            const c = colors[macro] || colors.VIVIR;

            return (
              <Card key={macro} padding="md" shadow="soft" className={c.bg}>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${c.text} mb-1`}>
                    {labels[macro]}
                  </span>
                  <span className="text-lg font-serif font-bold text-stone-800 tracking-tight">
                    {formatCurrency(spent, 'ARS')}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

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
              const limite = parseFloat(String(p.limite));
              const percentage = Math.min((p.spent / limite) * 100, 100);
              const isOver = p.spent > limite;
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
                        de {formatCurrency(limite, p.moneda)}
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
                        mp.estado === 'RESERVADO'
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
}
