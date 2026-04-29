import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../config/api';
import type { CotizacionFX } from '../types';

interface CriptoYaRate {
  ask: number;
  bid: number;
  time: number;
}

type CriptoYaResponse = Record<string, CriptoYaRate>;

const CRIPTOYA_DOLAR = 'https://criptoya.com/api/dolar';
const CRIPTOYA_BRL = 'https://criptoya.com/api/brl';

function parseCriptoYaDolar(data: CriptoYaResponse): Omit<CotizacionFX, 'id'>[] {
  const rates: Omit<CotizacionFX, 'id'>[] = [];
  const now = new Date().toISOString();

  const entries = Object.entries(data);
  for (const [tipo, rate] of entries) {
    if (!rate || typeof rate.ask !== 'number' || typeof rate.bid !== 'number') {
      continue;
    }
    rates.push({
      par: 'USD_ARS',
      tipo: tipo.toLowerCase(),
      compra: rate.bid,
      venta: rate.ask,
      timestamp: rate.time ? new Date(rate.time * 1000).toISOString() : now,
    });
  }
  return rates;
}

function parseCriptoYaBrl(data: CriptoYaResponse): Omit<CotizacionFX, 'id'>[] {
  const rates: Omit<CotizacionFX, 'id'>[] = [];
  const now = new Date().toISOString();

  const entries = Object.entries(data);
  for (const [tipo, rate] of entries) {
    if (!rate || typeof rate.ask !== 'number' || typeof rate.bid !== 'number') {
      continue;
    }
    rates.push({
      par: 'BRL_ARS',
      tipo: tipo.toLowerCase(),
      compra: rate.bid,
      venta: rate.ask,
      timestamp: rate.time ? new Date(rate.time * 1000).toISOString() : now,
    });
  }
  return rates;
}

function dedupeRates(rates: CotizacionFX[]): CotizacionFX[] {
  const map = new Map<string, CotizacionFX>();
  for (const rate of rates) {
    const key = `${rate.par}-${rate.tipo}`;
    const existing = map.get(key);
    if (!existing || new Date(rate.timestamp) > new Date(existing.timestamp)) {
      map.set(key, rate);
    }
  }
  return Array.from(map.values());
}

export const useCotizaciones = () => {
  const [rates, setRates] = useState<CotizacionFX[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch cached rates from Supabase
      const cached = await apiGet<CotizacionFX>('/cotizaciones_fx', {
        order: 'timestamp.desc',
        limit: '20',
      });
      setRates(cached);

      // 2. Fetch fresh rates from CriptoYa (fire in parallel)
      const [dolarRes, brlRes] = await Promise.all([
        fetch(CRIPTOYA_DOLAR)
          .then(r => {
            if (!r.ok) throw new Error(`CriptoYa dolar: ${r.status}`);
            return r.json() as Promise<CriptoYaResponse>;
          })
          .catch(err => {
            console.warn('[CriptoYa] dolar fetch failed:', err);
            return null;
          }),
        fetch(CRIPTOYA_BRL)
          .then(r => {
            if (!r.ok) throw new Error(`CriptoYa brl: ${r.status}`);
            return r.json() as Promise<CriptoYaResponse>;
          })
          .catch(err => {
            console.warn('[CriptoYa] brl fetch failed:', err);
            return null;
          }),
      ]);

      const freshRates: Omit<CotizacionFX, 'id'>[] = [];
      if (dolarRes) {
        freshRates.push(...parseCriptoYaDolar(dolarRes));
      }
      if (brlRes) {
        freshRates.push(...parseCriptoYaBrl(brlRes));
      }

      // 3. Write-back to Supabase cache (fire-and-forget, log errors)
      if (freshRates.length > 0) {
        Promise.all(
          freshRates.map(r =>
            apiPost<Omit<CotizacionFX, 'id'>, CotizacionFX>('/cotizaciones_fx', r).catch(err => {
              console.warn('Failed to write-back rate to cache:', err);
            })
          )
        );
      }

      // 4. Merge fresh rates on top of cache and deduplicate
      setRates(prev => {
        // Convert fresh rates to CotizacionFX-like objects for merging
        // (they lack id, but dedupe and the widget only use par/tipo/timestamp)
        const merged: CotizacionFX[] = [
          // We cast because the widget and dedupe only care about par/tipo/timestamp/compra/venta
          ...(freshRates as CotizacionFX[]),
          ...prev,
        ];
        return dedupeRates(merged);
      });
    } catch (err) {
      console.error('Error fetching cotizaciones:', err);
      setError('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { rates, loading, error, refresh: fetchRates };
};
