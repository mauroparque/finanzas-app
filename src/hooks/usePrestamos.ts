import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../config/api';
import type { Prestamo } from '../types';

export const usePrestamos = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrestamos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGet<Prestamo>('/prestamos', {
        activo: 'eq.true',
      });
      setPrestamos(data);
    } catch (err) {
      console.error('[usePrestamos] Error al cargar préstamos:', err);
      setError('Error al cargar préstamos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrestamos();
  }, [fetchPrestamos]);

  return {
    prestamos,
    isLoading,
    error,
    refresh: fetchPrestamos,
  };
};
