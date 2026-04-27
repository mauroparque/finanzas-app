import { useState, useEffect, useCallback } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../config/api';
import type {
  Movimiento,
  MovimientoInput,
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

  const marcarComoPagado = async (id: number, monto: number) => {
    try {
      const previsto = movimientosPrevistos.find(mp => mp.id === id);
      if (!previsto) throw new Error(`MovimientoPrevisto id=${id} no encontrado`);

      // La definición podría estar inactiva pero el previsto sigue activo — fetch por ID como fallback
      let def = servicios.find(s => s.id === previsto.referencia_id);
      if (!def) {
        const [fetched] = await apiGet<ServicioDefinicion>('/servicios_definicion', {
          id: `eq.${previsto.referencia_id}`,
        });
        if (!fetched) throw new Error(`ServicioDefinicion id=${previsto.referencia_id} no encontrada — no se puede registrar el pago sin clasificación`);
        def = fetched;
      }

      // 1. Crear el movimiento primero para capturar su id
      const nuevoMovimiento = await apiPost<MovimientoInput, Movimiento>('/movimientos', {
        tipo: 'gasto',
        monto,
        moneda: previsto.moneda,
        unidad: def.unidad,
        categoria: def.categoria,
        concepto: def.concepto,
        detalle: def.detalle,
        fecha_operacion: new Date().toISOString(),
        medio_pago: def.medio_pago_default ?? 'Efectivo ARS',
        fuente: 'manual',
        notas: `Pago de servicio: ${previsto.nombre}`,
      });

      // 2. Marcar el previsto como PAGADO con back-reference al movimiento creado
      // Si el PATCH falla, hacemos rollback del movimiento para evitar dejar registros huérfanos
      let updated: MovimientoPrevisto[];
      try {
        updated = await apiPatch<MovimientoPrevisto, MovimientoPrevisto>(
          '/movimientos_previstos_mes',
          { id: `eq.${id}` },
          {
            estado: 'PAGADO' as EstadoPrevisto,
            monto_real: monto,
            fecha_pago: new Date().toISOString(),
            movimiento_id: nuevoMovimiento.id,
          }
        );
      } catch (patchError) {
        await apiDelete('/movimientos', { id: `eq.${nuevoMovimiento.id}` }).catch(() => {});
        throw patchError;
      }

      // 3. Update local state
      if (updated.length > 0) {
        setMovimientosPrevistos(prev =>
          prev.map(mp => (mp.id === id ? updated[0] : mp))
        );
      }
    } catch (err) {
      console.error('Error al marcar como pagado:', err);
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
    marcarComoPagado,
    refresh: fetchAll,
  };
};
