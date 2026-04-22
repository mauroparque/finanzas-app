import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch } from '../config/api';
import type { CuotaTarjeta } from '../types';

export const useCuotasTarjeta = (tarjeta?: string) => {
  const [cuotas, setCuotas] = useState<CuotaTarjeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuotas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        activo: 'eq.true',
        order: 'fecha_inicio.desc',
      };
      if (tarjeta) {
        params.tarjeta = `eq.${tarjeta}`;
      }
      const data = await apiGet<CuotaTarjeta>('/cuotas_tarjeta', params);
      setCuotas(data);
    } catch (err) {
      console.error('Error fetching cuotas:', err);
      setError('Error al cargar cuotas');
    } finally {
      setLoading(false);
    }
  }, [tarjeta]);

  useEffect(() => {
    fetchCuotas();
  }, [fetchCuotas]);

  const updateCuota = async (id: number, updates: Partial<CuotaTarjeta>) => {
    try {
      const updated = await apiPatch<CuotaTarjeta, CuotaTarjeta>(
        '/cuotas_tarjeta',
        { id: `eq.${id}` },
        updates,
      );
      if (updated.length > 0) {
        setCuotas(prev => prev.map(c => (c.id === id ? updated[0] : c)));
      }
    } catch (err) {
      console.error('Error updating cuota:', err);
      throw err;
    }
  };

  return { cuotas, loading, error, updateCuota, refresh: fetchCuotas };
};
