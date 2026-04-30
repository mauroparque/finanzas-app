import React, { useMemo, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { MedioPago } from '../../types';

interface Props {
  accounts: MedioPago[];
}

const CURRENCY_EMOJI: Record<string, string> = {
  ARS: '🇦🇷',
  USD: '🇺🇸',
  USDT: '₿',
  BRL: '🇧🇷',
};

const CURRENCY_BG: Record<string, string> = {
  ARS: 'bg-stone-50',
  USD: 'bg-navy-50/30',
  USDT: 'bg-sage-50/30',
  BRL: 'bg-amber-50/30',
};

export function BalanceAccordion({ accounts }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((moneda: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(moneda)) {
        next.delete(moneda);
      } else {
        next.add(moneda);
      }
      return next;
    });
  }, []);

  const groups = useMemo(() => {
    const map: Record<string, { total: number; accounts: MedioPago[] }> = {};
    accounts
      .filter(acc => acc.tipo !== 'Crédito') // Exclude credit cards — saldo represents DEBT
      .forEach(acc => {
        const saldo = parseFloat(String(acc.saldo));
        if (!map[acc.moneda]) {
          map[acc.moneda] = { total: 0, accounts: [] };
        }
        map[acc.moneda].total += saldo;
        map[acc.moneda].accounts.push(acc);
      });

    return Object.entries(map)
      .filter(([, data]) => data.total > 0)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([moneda, data]) => [
        moneda,
        {
          ...data,
          accounts: data.accounts.sort((a, b) => parseFloat(String(b.saldo)) - parseFloat(String(a.saldo))),
        },
      ]) as [string, { total: number; accounts: MedioPago[] }][];
  }, [accounts]);

  if (accounts.length === 0) {
    return (
      <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200">
        <p className="text-stone-500 text-sm text-center">Sin cuentas activas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(([moneda, data]) => {
        const isExpanded = expanded.has(moneda);
        const bgClass = CURRENCY_BG[moneda] || 'bg-stone-50';
        return (
          <div
            key={moneda}
            className={`rounded-2xl border border-stone-200 overflow-hidden transition-colors ${bgClass}`}
          >
            <button
              onClick={() => toggle(moneda)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden="true">
                  {CURRENCY_EMOJI[moneda] || '💰'}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {moneda}
                  </p>
                  <p className="font-serif text-3xl font-bold text-stone-800 tracking-tight">
                    {formatCurrency(data.total, moneda)}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`text-stone-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && (
              <div className="px-5 pb-4 space-y-2">
                {data.accounts.map(acc => (
                  <div
                    key={acc.id}
                    className="flex justify-between items-center py-2 border-t border-stone-200/60"
                  >
                    <span className="text-sm font-medium text-stone-700">{acc.nombre}</span>
                    <span className="text-sm font-bold text-stone-800 tracking-tight">
                      {formatCurrency(parseFloat(String(acc.saldo)), acc.moneda)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
