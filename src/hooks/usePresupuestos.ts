import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../config/api';
import type { PresupuestoDefinicion, Unidad } from '../types';

export const usePresupuestos = (unidad?: Unidad) => {
  const [presupuestos, setPresupuestos] = useState<PresupuestoDefinicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = { activo: 'eq.true' };
      if (unidad) params.unidad = `eq.${unidad}`;

      const data = await apiGet<PresupuestoDefinicion>('/presupuestos_definicion', params);
      setPresupuestos(data);
    } catch (err) {
      console.error('Error fetching presupuestos:', err);
      setError('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  }, [unidad]);

  useEffect(() => {
    fetchPresupuestos();
  }, [fetchPresupuestos]);

  return {
    presupuestos,
    loading,
    error,
    refresh: fetchPresupuestos,
  };
};
