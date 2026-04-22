import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch, apiPost } from '../config/api';
import type {
  MovimientoPrevisto,
  ServicioDefinicion,
  ServicioDefinicionInput,
  EstadoPrevisto,
} from '../types';

const getCurrentPeriodo = () => new Date().toISOString().slice(0, 7); // "YYYY-MM"

export const useServicios = () => {
  const [movimientosPrevistos, setMovimientosPrevistos] = useState<MovimientoPrevisto[]>([]);
  const [servicios, setServicios] = useState<ServicioDefinicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [previstos, defs] = await Promise.all([
        apiGet<MovimientoPrevisto>('/movimientos_previstos_mes', {
          periodo: `eq.${getCurrentPeriodo()}`,
          referencia_tipo: 'eq.servicio',
          order: 'estado.asc,nombre.asc',
        }),
        apiGet<ServicioDefinicion>('/servicios_definicion', {
          activo: 'eq.true',
          order: 'dia_vencimiento.asc',
        }),
      ]);

      setMovimientosPrevistos(previstos);
      setServicios(defs);
    } catch (err) {
      console.error('Error fetching servicios:', err);
      setError('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateEstado = async (id: number, estado: EstadoPrevisto) => {
    try {
      const body: Partial<MovimientoPrevisto> = { estado };
      if (estado === 'PAID' || estado === 'PAGADO') {
        body.fecha_pago = new Date().toISOString();
      }
      const updated = await apiPatch<MovimientoPrevisto, MovimientoPrevisto>(
        '/movimientos_previstos_mes',
        { id: `eq.${id}` },
        body
      );
      if (updated.length > 0) {
        setMovimientosPrevistos(prev =>
          prev.map(mp => (mp.id === id ? updated[0] : mp))
        );
      }
    } catch (err) {
      console.error('Error updating estado:', err);
      throw err;
    }
  };

  const addServicio = async (servicio: ServicioDefinicionInput) => {
    try {
      const nuevo = await apiPost<ServicioDefinicionInput, ServicioDefinicion>(
        '/servicios_definicion',
        servicio
      );
      setServicios(prev => [...prev, nuevo]);
      return nuevo;
    } catch (err) {
      console.error('Error adding servicio:', err);
      throw err;
    }
  };

  return {
    movimientosPrevistos,
    servicios,
    loading,
    error,
    updateEstado,
    addServicio,
    refresh: fetchAll,
  };
};
