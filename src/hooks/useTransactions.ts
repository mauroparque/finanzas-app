import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../config/api';
import type { Movimiento, MovimientoInput } from '../types';
import { UNIDAD_TO_MACRO } from '../types';

export const useTransactions = (filters?: {
  categoria?: string;
  unidad?: string;
  month?: Date;
}) => {
  const [transactions, setTransactions] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Base params with ordering
      const params: Record<string, string> = {
        order: 'fecha_operacion.desc',
      };

      if (filters?.unidad) {
        params.unidad = `eq.${filters.unidad}`;
      }

      if (filters?.categoria) {
        params.categoria = `eq.${filters.categoria}`;
      }

      if (filters?.month) {
        // Map to first and last day of the month for PostgREST
        const year = filters.month.getFullYear();
        const month = (filters.month.getMonth() + 1).toString().padStart(2, '0');
        const firstDay = `${year}-${month}-01T00:00:00Z`;

        const lastDayDate = new Date(year, filters.month.getMonth() + 1, 0);
        const lastDay = `${year}-${month}-${lastDayDate.getDate().toString().padStart(2, '0')}T23:59:59Z`;

        params['and'] = `(fecha_operacion.gte.${firstDay},fecha_operacion.lte.${lastDay})`;
      }

      const data = await apiGet<Movimiento>('/movimientos', params);
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching movimientos:", err);
      setError('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  }, [filters?.categoria, filters?.unidad, filters?.month?.toISOString()]);

  // Initial fetch and fetch on filter changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: MovimientoInput) => {
    try {
      const enriched = {
        ...transaction,
        macro: UNIDAD_TO_MACRO[transaction.unidad],
      };
      const newTx = await apiPost<MovimientoInput, Movimiento>('/movimientos', enriched);
      
      setTransactions(prev => [newTx, ...prev]);
      
      return newTx;
    } catch (err) {
      console.error("Error adding movimiento:", err);
      throw err;
    }
  };

  const updateTransaction = async (id: number, updates: Partial<Movimiento>) => {
    try {
      const updatedArray = await apiPatch<Movimiento, Movimiento>('/movimientos', { id: `eq.${id}` }, updates);
      if (updatedArray.length > 0) {
        const updated = updatedArray[0];
        setTransactions(prev => prev.map(t => (t.id === id ? updated : t)));
      }
    } catch (err) {
      console.error("Error updating movimiento:", err);
      throw err;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await apiDelete('/movimientos', { id: `eq.${id}` });
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting movimiento:", err);
      throw err;
    }
  };

  return {
    transactions,  // which are actually Movimiento[] now
    loading,
    error,
    refresh: fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
};
