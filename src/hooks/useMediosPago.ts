import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch } from '../config/api';
import type { MedioPago, MedioPagoInput } from '../types';

export const useMediosPago = (onlyActive = true) => {
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediosPago = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};
      if (onlyActive) {
        params.activo = 'eq.true';
      }

      const data = await apiGet<MedioPago>('/medios_pago', params);
      setMediosPago(data);
    } catch (err) {
      console.error("Error fetching medios_pago:", err);
      setError('Error al cargar cuentas / medios de pago');
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  useEffect(() => {
    fetchMediosPago();
  }, [fetchMediosPago]);

  const addMedioPago = async (medio: MedioPagoInput) => {
    try {
      const newMedio = await apiPost<MedioPagoInput, MedioPago>('/medios_pago', medio);
      setMediosPago(prev => [...prev, newMedio]);
      return newMedio;
    } catch (err) {
      console.error("Error adding medio_pago:", err);
      throw err;
    }
  };

  const updateMedioPago = async (id: number, updates: Partial<MedioPago>) => {
    try {
      const updatedArray = await apiPatch<MedioPago, MedioPago>('/medios_pago', { id: `eq.${id}` }, updates);
      if (updatedArray.length > 0) {
        const updated = updatedArray[0];
        setMediosPago(prev => prev.map(m => (m.id === id ? updated : m)));
      }
    } catch (err) {
      console.error("Error updating medio_pago:", err);
      throw err;
    }
  };

  return {
    // Return aliases to minimize component breakage before Phase 3
    accounts: mediosPago,
    mediosPago,
    loading,
    error,
    refresh: fetchMediosPago,
    addAccount: addMedioPago,
    addMedioPago,
    updateAccount: updateMedioPago,
    updateMedioPago,
  };
};
