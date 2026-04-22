import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../config/api';
import type { CuotaTarjeta } from '../types';

export const useCuotasTarjeta = () => {
  const [cuotas, setCuotas] = useState<CuotaTarjeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuotas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGet<CuotaTarjeta>('/cuotas_tarjeta', {
        activo: 'eq.true',
      });
      setCuotas(data);
    } catch (err) {
      console.error('[useCuotasTarjeta] Error al cargar cuotas de tarjeta:', err);
      setError('Error al cargar cuotas de tarjeta');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCuotas();
  }, [fetchCuotas]);

  return {
    cuotas,
    isLoading,
    error,
    refresh: fetchCuotas,
  };
};
