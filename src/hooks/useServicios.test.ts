import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useServicios } from './useServicios';
import type { MovimientoPrevisto, ServicioDefinicion } from '../types';

vi.mock('../config/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPatch, apiPost } from '../config/api';

const mockMovimientoPrevisto = (overrides: Partial<MovimientoPrevisto> = {}): MovimientoPrevisto => ({
  id: 1,
  periodo: '2026-04',
  tipo: 'gasto',
  referencia_id: 1,
  referencia_tipo: 'servicio',
  nombre: 'EPEC',
  monto_estimado: 5000,
  moneda: 'ARS',
  estado: 'PENDING',
  ...overrides,
});

const mockServicioDefinicion = (overrides: Partial<ServicioDefinicion> = {}): ServicioDefinicion => ({
  id: 1,
  nombre: 'EPEC',
  monto_estimado: 5000,
  moneda: 'ARS',
  unidad: 'HOGAR',
  categoria: 'Vivienda y Vida Diaria',
  concepto: 'Servicios',
  detalle: 'Electricidad',
  dia_vencimiento: 10,
  es_debito_automatico: false,
  activo: true,
  ...overrides,
});

describe('useServicios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetches both movimientosPrevistos and servicios on mount', () => {
    it('calls apiGet for movimientos_previstos_mes with correct filters', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useServicios());

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/movimientos_previstos_mes', expect.objectContaining({
          periodo: expect.stringContaining('eq.'),
          referencia_tipo: 'eq.servicio',
        }));
      });
    });

    it('calls apiGet for servicios_definicion with activo filter', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useServicios());

      await waitFor(() => {
        const calls = vi.mocked(apiGet).mock.calls;
        expect(calls.some(call => call[0] === '/servicios_definicion')).toBe(true);
      });
    });

    it('sets loading true initially and false after fetch', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result } = renderHook(() => useServicios());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('populates movimientosPrevistos from API response', async () => {
      const previstos: MovimientoPrevisto[] = [
        mockMovimientoPrevisto({ id: 1, nombre: 'EPEC' }),
        mockMovimientoPrevisto({ id: 2, nombre: 'Netflix' }),
      ];
      vi.mocked(apiGet).mockImplementation((endpoint) => {
        if (endpoint === '/movimientos_previstos_mes') return Promise.resolve(previstos);
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useServicios());

      await waitFor(() => {
        expect(result.current.movimientosPrevistos).toHaveLength(2);
        expect(result.current.movimientosPrevistos[0].nombre).toBe('EPEC');
      });
    });

    it('populates servicios from API response', async () => {
      const servicios: ServicioDefinicion[] = [
        mockServicioDefinicion({ id: 1, nombre: 'EPEC' }),
        mockServicioDefinicion({ id: 2, nombre: 'Netflix' }),
      ];
      vi.mocked(apiGet).mockImplementation((endpoint) => {
        if (endpoint === '/servicios_definicion') return Promise.resolve(servicios);
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useServicios());

      await waitFor(() => {
        expect(result.current.servicios).toHaveLength(2);
        expect(result.current.servicios[0].nombre).toBe('EPEC');
      });
    });
  });

  describe('updateEstado', () => {
    it('calls apiPatch with correct endpoint and filters', async () => {
      const previsto = mockMovimientoPrevisto({ id: 5, estado: 'PENDING' });
      vi.mocked(apiGet).mockResolvedValue([previsto]);
      vi.mocked(apiPatch).mockResolvedValue([{ ...previsto, estado: 'RESERVED' }]);

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.updateEstado(5, 'RESERVED');

      expect(apiPatch).toHaveBeenCalledWith('/movimientos_previstos_mes', { id: 'eq.5' }, { estado: 'RESERVED' });
    });

    it('sets fecha_pago when estado is PAID', async () => {
      const previsto = mockMovimientoPrevisto({ id: 5, estado: 'PENDING' });
      vi.mocked(apiGet).mockResolvedValue([previsto]);
      vi.mocked(apiPatch).mockResolvedValue([{ ...previsto, estado: 'PAID', fecha_pago: '2026-04-22T10:00:00Z' }]);

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.updateEstado(5, 'PAID');

      expect(apiPatch).toHaveBeenCalledWith('/movimientos_previstos_mes', { id: 'eq.5' }, expect.objectContaining({
        estado: 'PAID',
        fecha_pago: expect.any(String),
      }));
    });

    it('sets fecha_pago when estado is PAGADO', async () => {
      const previsto = mockMovimientoPrevisto({ id: 5, estado: 'PENDING' });
      vi.mocked(apiGet).mockResolvedValue([previsto]);
      vi.mocked(apiPatch).mockResolvedValue([{ ...previsto, estado: 'PAGADO', fecha_pago: '2026-04-22T10:00:00Z' }]);

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.updateEstado(5, 'PAGADO');

      expect(apiPatch).toHaveBeenCalledWith('/movimientos_previstos_mes', { id: 'eq.5' }, expect.objectContaining({
        estado: 'PAGADO',
        fecha_pago: expect.any(String),
      }));
    });

    it('updates local state with patched movimiento', async () => {
      const previsto = mockMovimientoPrevisto({ id: 5, estado: 'PENDING' });
      const updated = { ...previsto, estado: 'PAID' as const, fecha_pago: '2026-04-22T10:00:00Z' };
      vi.mocked(apiGet).mockResolvedValue([previsto]);
      vi.mocked(apiPatch).mockResolvedValue([updated]);

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.movimientosPrevistos).toHaveLength(1));

      await result.current.updateEstado(5, 'PAID');

      await waitFor(() => {
        expect(result.current.movimientosPrevistos[0].estado).toBe('PAID');
      });
    });

    it('throws error when apiPatch fails', async () => {
      const previsto = mockMovimientoPrevisto({ id: 5 });
      vi.mocked(apiGet).mockResolvedValue([previsto]);
      vi.mocked(apiPatch).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.updateEstado(5, 'PAID')).rejects.toThrow('Update failed');
    });
  });

  describe('addServicio', () => {
    it('calls apiPost with correct endpoint and payload', async () => {
      const nuevoServicio = mockServicioDefinicion({ id: 99, nombre: 'Nuevo Servicio' });
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockResolvedValue(nuevoServicio);

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const input = {
        nombre: 'Nuevo Servicio',
        moneda: 'ARS' as const,
        unidad: 'HOGAR' as const,
        categoria: 'Vivienda y Vida Diaria',
        concepto: 'Servicios',
        detalle: 'Test',
        dia_vencimiento: 15,
        es_debito_automatico: false,
        activo: true,
      };

      await result.current.addServicio(input);

      expect(apiPost).toHaveBeenCalledWith('/servicios_definicion', input);
    });

    it('appends new servicio to local state', async () => {
      const existing = mockServicioDefinicion({ id: 1 });
      const nuevo = mockServicioDefinicion({ id: 2, nombre: 'Nuevo Servicio' });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPost).mockResolvedValue(nuevo);

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.servicios).toHaveLength(1));

      const input = {
        nombre: 'Nuevo Servicio',
        moneda: 'ARS' as const,
        unidad: 'HOGAR' as const,
        categoria: 'Vivienda y Vida Diaria',
        concepto: 'Servicios',
        detalle: 'Test',
        dia_vencimiento: 15,
        es_debito_automatico: false,
        activo: true,
      };

      await result.current.addServicio(input);

      await waitFor(() => {
        expect(result.current.servicios).toHaveLength(2);
        expect(result.current.servicios[1].nombre).toBe('Nuevo Servicio');
      });
    });

    it('returns the created servicio', async () => {
      const nuevo = mockServicioDefinicion({ id: 99, nombre: 'Nuevo Servicio' });
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockResolvedValue(nuevo);

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const input = {
        nombre: 'Nuevo Servicio',
        moneda: 'ARS' as const,
        unidad: 'HOGAR' as const,
        categoria: 'Vivienda y Vida Diaria',
        concepto: 'Servicios',
        detalle: 'Test',
        dia_vencimiento: 15,
        es_debito_automatico: false,
        activo: true,
      };

      const returned = await result.current.addServicio(input);

      expect(returned).toEqual(nuevo);
    });

    it('throws error when apiPost fails', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockRejectedValue(new Error('Insert failed'));

      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const input = {
        nombre: 'Nuevo Servicio',
        moneda: 'ARS' as const,
        unidad: 'HOGAR' as const,
        categoria: 'Vivienda y Vida Diaria',
        concepto: 'Servicios',
        detalle: 'Test',
        dia_vencimiento: 15,
        es_debito_automatico: false,
        activo: true,
      };

      await expect(result.current.addServicio(input)).rejects.toThrow('Insert failed');
    });
  });

  describe('refresh', () => {
    it('refetches both movimientosPrevistos and servicios', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result } = renderHook(() => useServicios());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(apiGet).mockClear();

      await result.current.refresh();

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('error handling', () => {
    it('sets error when API fails on fetch', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useServicios());

      await waitFor(() => {
        expect(result.current.error).toBe('Error al cargar servicios');
      });
    });

    it('sets loading false after fetch error', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useServicios());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('does not populate movimientosPrevistos on fetch error', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useServicios());

      await waitFor(() => {
        expect(result.current.movimientosPrevistos).toHaveLength(0);
      });
    });

    it('does not populate servicios on fetch error', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useServicios());

      await waitFor(() => {
        expect(result.current.servicios).toHaveLength(0);
      });
    });
  });
});