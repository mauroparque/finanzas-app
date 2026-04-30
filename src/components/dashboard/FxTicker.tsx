import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { getLatestRate } from '../../utils/fx';
import { formatCurrency } from '../../utils/formatters';
import type { CotizacionFX } from '../../types';

interface Props {
  rates: CotizacionFX[];
  onRefresh: () => void;
  loading: boolean;
  onNavigate?: () => void;
}

const DISPLAY_SLOTS: { label: string; par: string; tipo: string }[] = [
  { label: 'Blue', par: 'USD_ARS', tipo: 'blue' },
  { label: 'Oficial', par: 'USD_ARS', tipo: 'oficial' },
];

function timeAgo(timestamp?: string): string {
  if (!timestamp) return '—';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins === 1) return 'hace 1 min';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return 'hace 1 h';
  return `hace ${hrs} h`;
}

export function FxTicker({ rates, onRefresh, loading, onNavigate }: Props) {
  const slots = useMemo(() => {
    return DISPLAY_SLOTS.map(slot => {
      const rate = getLatestRate(rates, slot.par, slot.tipo);
      return { ...slot, rate };
    }).filter(s => s.rate != null);
  }, [rates]);

  const latestTimestamp = useMemo(() => {
    const timestamps = slots.map(s => s.rate?.timestamp).filter(Boolean) as string[];
    if (timestamps.length === 0) return undefined;
    return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [slots]);

  if (slots.length === 0 && !loading) {
    return (
      <div className="bg-stone-50 rounded-2xl border border-stone-200 px-4 py-3 flex items-center justify-between">
        <p className="text-stone-500 text-xs">No hay cotizaciones disponibles.</p>
        <button
          onClick={onRefresh}
          className="text-stone-400 hover:text-terracotta-600 transition-colors"
          aria-label="Actualizar cotizaciones"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-stone-50 rounded-2xl border border-stone-200 px-4 py-3 cursor-pointer hover:bg-stone-100/50 transition-colors"
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate?.(); }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 overflow-x-auto">
          {loading ? (
            <RefreshCw className="animate-spin text-stone-400" size={16} />
          ) : (
            slots.map(slot => (
              <div key={`${slot.par}-${slot.tipo}`} className="text-center min-w-[60px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {slot.label}
                </p>
                <p className="font-bold text-sm text-stone-800 tracking-tight">
                  {formatCurrency(slot.rate!.venta, 'ARS')}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className="text-[10px] text-stone-400 font-medium hidden sm:inline">
            {timeAgo(latestTimestamp)}
          </span>
          <button
            onClick={e => {
              e.stopPropagation();
              onRefresh();
            }}
            className="text-stone-400 hover:text-terracotta-600 transition-colors"
            aria-label="Actualizar cotizaciones"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
