import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../config/api';
import type { CotizacionFX } from '../types';

export const useCotizaciones = () => {
  const [rates, setRates] = useState<CotizacionFX[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<CotizacionFX>('/cotizaciones_fx', {
        order: 'timestamp.desc',
        limit: '20',
      });
      setRates(data);
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
