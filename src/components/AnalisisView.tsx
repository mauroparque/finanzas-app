import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from './common/ui/Card';
import { MacroTrendChart } from './analisis/MacroTrendChart';

export function AnalisisView() {
  const [monthFilter] = useState(() => new Date());
  const { transactions, loading } = useTransactions({ month: monthFilter });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight">
          Análisis
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Tendencias de gasto por macro categoría
        </p>
      </header>

      <Card padding="md" shadow="card">
        <h3 className="font-serif font-bold text-stone-800 mb-4">
          Evolución del mes
        </h3>
        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500" />
          </div>
        ) : (
          <MacroTrendChart transactions={transactions} />
        )}
      </Card>
    </div>
  );
}
