import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch } from '../config/api';
import type { Prestamo } from '../types';

export const usePrestamos = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrestamos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Prestamo>('/prestamos', {
        activo: 'eq.true',
        order: 'fecha_inicio.desc',
      });
      setPrestamos(data);
    } catch (err) {
      console.error('Error fetching prestamos:', err);
      setError('Error al cargar préstamos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrestamos();
  }, [fetchPrestamos]);

  const updatePrestamo = async (id: number, updates: Partial<Prestamo>) => {
    try {
      const updated = await apiPatch<Prestamo, Prestamo>(
        '/prestamos',
        { id: `eq.${id}` },
        updates,
      );
      if (updated.length > 0) {
        setPrestamos(prev => prev.map(p => (p.id === id ? updated[0] : p)));
      }
    } catch (err) {
      console.error('Error updating prestamo:', err);
      throw err;
    }
  };

  return { prestamos, loading, error, updatePrestamo, refresh: fetchPrestamos };
};
