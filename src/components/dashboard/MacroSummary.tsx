import React, { useMemo } from 'react';
import { Home, Briefcase, Shield, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Movimiento, Macro } from '../../types';

interface Props {
  transactions: Movimiento[];
  onMacroClick?: (macro: Macro) => void;
}

const MACRO_META: Record<
  Macro,
  { label: string; icon: React.ElementType; bg: string; text: string }
> = {
  VIVIR: {
    label: 'Vivir',
    icon: Home,
    bg: 'bg-sage-500/10',
    text: 'text-sage-600',
  },
  TRABAJAR: {
    label: 'Trabajar',
    icon: Briefcase,
    bg: 'bg-navy-500/10',
    text: 'text-navy-600',
  },
  DEBER: {
    label: 'Deber',
    icon: Shield,
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
  },
  DISFRUTAR: {
    label: 'Disfrutar',
    icon: Sparkles,
    bg: 'bg-terracotta-500/10',
    text: 'text-terracotta-600',
  },
};

export function MacroSummary({ transactions, onMacroClick }: Props) {
  const { spentByMacro, totalSpent } = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.tipo === 'gasto' && t.moneda === 'ARS')
      .forEach(t => {
        const macro = t.macro || 'VIVIR';
        const monto = parseFloat(String(t.monto));
        map[macro] = (map[macro] || 0) + monto;
      });
    const total = Object.values(map).reduce((sum, v) => sum + v, 0);
    return { spentByMacro: map, totalSpent: total };
  }, [transactions]);

  if (totalSpent === 0) {
    return (
      <section className="space-y-4">
        <h4 className="font-serif font-bold text-stone-800 text-lg px-1">
          ¿En qué gastamos?
        </h4>
        <p className="text-stone-500 text-sm px-1">Sin gastos este mes</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h4 className="font-serif font-bold text-stone-800 text-lg px-1">
        ¿En qué gastamos?
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {(['VIVIR', 'TRABAJAR', 'DEBER', 'DISFRUTAR'] as const).map(macro => {
          const meta = MACRO_META[macro];
          const spent = spentByMacro[macro] || 0;
          const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
          const Icon = meta.icon;

          return (
            <button
              key={macro}
              onClick={() => onMacroClick?.(macro)}
              className={`text-left rounded-2xl p-4 border border-stone-200/60 ${meta.bg} hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={meta.text} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.text}`}>
                  {meta.label}
                </span>
              </div>
              <p className="text-lg font-serif font-bold text-stone-800 tracking-tight">
                {formatCurrency(spent, 'ARS')}
              </p>
              <p className="text-[10px] font-medium text-stone-500 mt-0.5">
                {pct.toFixed(1)}%
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function getSpentByMacro(transactions: Movimiento[]): Record<string, number> {
  const map: Record<string, number> = {};
  transactions
    .filter(t => t.tipo === 'gasto')
    .forEach(t => {
      const macro = t.macro || 'VIVIR';
      map[macro] = (map[macro] || 0) + parseFloat(String(t.monto));
    });
  return map;
}
