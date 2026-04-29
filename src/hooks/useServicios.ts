import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch, apiPost } from '../config/api';
import type {
  Movimiento,
  MovimientoInput,
  MovimientoPrevisto,
  ServicioDefinicion,
  ServicioDefinicionInput,
  EstadoPrevisto,
} from '../types';
import { UNIDAD_TO_MACRO } from '../types';

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

  const markAsPaid = async (
    previstoId: number,
    servicioDef: ServicioDefinicion,
    medioPagoNombre: string
  ) => {
    try {
      const previsto = movimientosPrevistos.find(mp => mp.id === previstoId);
      if (!previsto) {
        throw new Error('Movimiento previsto no encontrado');
      }

      const movimientoBody: MovimientoInput = {
        tipo: 'gasto',
        monto: parseFloat(String(previsto.monto_real ?? previsto.monto_estimado ?? 0)),
        moneda: previsto.moneda,
        macro: UNIDAD_TO_MACRO[servicioDef.unidad],
        unidad: servicioDef.unidad,
        categoria: servicioDef.categoria,
        concepto: servicioDef.concepto,
        detalle: servicioDef.detalle ?? servicioDef.nombre,
        fecha_operacion: new Date().toISOString(),
        medio_pago: medioPagoNombre,
        fuente: 'manual',
      };
      await apiPost<MovimientoInput, Movimiento>('/movimientos', movimientoBody);

      const patchBody: Partial<MovimientoPrevisto> = {
        estado: 'PAGADO',
        fecha_pago: new Date().toISOString(),
      };
      const updatedPrevisto = await apiPatch<MovimientoPrevisto, MovimientoPrevisto>(
        '/movimientos_previstos_mes',
        { id: `eq.${previstoId}` },
        patchBody
      );

      if (updatedPrevisto.length > 0) {
        setMovimientosPrevistos(prev =>
          prev.map(mp => (mp.id === previstoId ? updatedPrevisto[0] : mp))
        );
      }
    } catch (err) {
      console.error('Error marking as paid:', err);
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
    markAsPaid,
    addServicio,
    refresh: fetchAll,
  };
};
