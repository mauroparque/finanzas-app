import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useCotizaciones } from '../../hooks/useCotizaciones';
import { Card } from './ui/Card';
import { formatCurrency } from '../../utils/formatters';

export const CotizacionWidget: React.FC = () => {
  const { rates, loading, error, refresh } = useCotizaciones();

  const latestByPair = useMemo(() => {
    const map = new Map<string, Map<string, typeof rates[0]>>();
    for (const rate of rates) {
      if (!map.has(rate.par)) map.set(rate.par, new Map());
      const tipoMap = map.get(rate.par)!;
      if (!tipoMap.has(rate.tipo)) {
        tipoMap.set(rate.tipo, rate);
      } else {
        const existing = tipoMap.get(rate.tipo)!;
        if (new Date(rate.timestamp) > new Date(existing.timestamp)) {
          tipoMap.set(rate.tipo, rate);
        }
      }
    }
    return map;
  }, [rates]);

  if (loading) {
    return (
      <Card padding="md" shadow="soft" className="flex justify-center items-center h-32">
        <RefreshCw className="animate-spin text-stone-400" size={24} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="md" shadow="soft" className="bg-rose-50 border-rose-200">
        <p className="text-rose-600 text-sm">{error}</p>
      </Card>
    );
  }

  const displayPairs = ['USD_ARS', 'BRL_ARS'];
  const hasAny = displayPairs.some(par => {
    const tipoMap = latestByPair.get(par);
    return tipoMap && tipoMap.size > 0;
  });

  if (!hasAny) {
    return (
      <Card padding="md" shadow="soft">
        <p className="text-stone-500 text-sm">No hay cotizaciones disponibles.</p>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h4 className="font-serif font-bold text-stone-800 text-lg">Cotizaciones</h4>
        <button
          onClick={refresh}
          className="text-stone-400 hover:text-terracotta-600 transition-colors"
          aria-label="Actualizar cotizaciones"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid gap-3">
        {displayPairs.map(par => {
          const tipoMap = latestByPair.get(par);
          if (!tipoMap || tipoMap.size === 0) return null;

          return (
            <Card key={par} padding="md" shadow="soft">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-stone-800 text-sm">
                  {par.replace('_', ' / ')}
                </h5>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from(tipoMap.entries()).map(([tipo, rate]) => (
                  <div
                    key={tipo}
                    className="bg-stone-50 rounded-xl p-3 border border-stone-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase text-stone-500">
                        {tipo}
                      </p>
                    </div>
                    <div className="flex justify-between items-end gap-2">
                      <div>
                        <p className="text-[10px] text-stone-400">Compra</p>
                        <p className="text-sm font-bold text-stone-800">
                          {formatCurrency(rate.compra, 'ARS')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-stone-400">Venta</p>
                        <p className="text-sm font-bold text-stone-800">
                          {formatCurrency(rate.venta, 'ARS')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
