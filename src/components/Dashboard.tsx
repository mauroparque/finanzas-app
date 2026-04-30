import React, { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useMediosPago } from '../hooks/useMediosPago';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useServicios } from '../hooks/useServicios';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgetStatus } from '../hooks/useBudgetStatus';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { BalanceAccordion } from './dashboard/BalanceAccordion';
import { MacroSummary } from './dashboard/MacroSummary';
import { MacroPieChart } from './dashboard/MacroPieChart';
import { BudgetAndDeadlines } from './dashboard/BudgetAndDeadlines';
import { FxTicker } from './dashboard/FxTicker';
import { useUIStore } from '../store/uiStore';

export function Dashboard() {
  const { accounts, loading: loadingAccounts } = useMediosPago();
  const { presupuestos } = usePresupuestos();
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
