import React, { useMemo, useState } from 'react';
import { Wallet, Calendar, ChevronLeft, ChevronRight, ShoppingBag, PawPrint, Coffee, Info, ArrowRight, Loader2 } from 'lucide-react';
import { useMediosPago } from '../hooks/useMediosPago';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useServicios } from '../hooks/useServicios';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { Card } from './common/ui/Card';
import { Badge } from './common/ui/Badge';
import { CotizacionWidget } from './common/CotizacionWidget';
import { BalanceAccordion } from './dashboard/BalanceAccordion';
import { MacroSummary } from './dashboard/MacroSummary';
import { MacroPieChart } from './dashboard/MacroPieChart';
import { BudgetAndDeadlines } from './dashboard/BudgetAndDeadlines';
import { FxTicker } from './dashboard/FxTicker';
import { useUIStore } from '../store/uiStore';
import { formatCurrency } from '../utils/formatters';

export function Dashboard() {
  const { accounts, loading: loadingAccounts } = useMediosPago();
  const { presupuestos, loading: loadingPresupuestos } = usePresupuestos();
  const { movimientosPrevistos, servicios, loading: loadingServicios } = useServicios();
  const { rates, loading: loadingRates, refresh: refreshRates } = useCotizaciones();
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

  const { setActiveScreen } = useUIStore();

  const handleMacroClick = () => {
    setActiveScreen('movimientos');
  };

  const handleNavigateToCotizaciones = () => {
    setActiveScreen('cotizaciones');
  };

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
      <MacroSummary transactions={transactions} onMacroClick={handleMacroClick} />
      <MacroPieChart transactions={transactions} />

      {/* Cotizaciones FX Ticker */}
      <FxTicker
        rates={rates}
        onRefresh={refreshRates}
        loading={loadingRates}
        onNavigate={handleNavigateToCotizaciones}
      />

      {/* Presupuestos + Vencimientos Compactos */}
      <BudgetAndDeadlines
        presupuestosConGasto={presupuestosConGasto}
        upcomingDeadlines={upcomingDeadlines}
        servicios={servicios}
        loadingServicios={loadingServicios}
      />
    </div>
  );
}
