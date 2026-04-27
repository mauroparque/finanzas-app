import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePresupuestos } from './usePresupuestos';
import type { PresupuestoDefinicion } from '../types';

vi.mock('../config/api', () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from '../config/api';

const mockPresupuesto = (overrides: Partial<PresupuestoDefinicion> = {}): PresupuestoDefinicion => ({
  id: 1,
  tipo_objetivo: 'categoria',
  nombre_objetivo: 'Vivienda y Vida Diaria',
  limite: 50000,
  moneda: 'ARS',
  unidad: 'HOGAR',
  porcentaje_alerta: 80,
  activo: true,
  ...overrides,
});

describe('usePresupuestos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetches presupuestos with activo filter', () => {
    it('calls apiGet with activo filter by default', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/presupuestos_definicion', expect.objectContaining({
          activo: 'eq.true',
        }));
      });
    });

    it('populates presupuestos from API response', async () => {
      const presupuestos: PresupuestoDefinicion[] = [
        mockPresupuesto({ id: 1, nombre_objetivo: 'Vivienda y Vida Diaria' }),
        mockPresupuesto({ id: 2, nombre_objetivo: 'Alimentación' }),
      ];
      vi.mocked(apiGet).mockResolvedValue(presupuestos);

      const { result } = renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(result.current.presupuestos).toHaveLength(2);
        expect(result.current.presupuestos[0].nombre_objetivo).toBe('Vivienda y Vida Diaria');
      });
    });

    it('sets loading true initially and false after fetch', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result } = renderHook(() => usePresupuestos());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('applies unidad filter when provided', () => {
    it('adds unidad filter to params when provided', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => usePresupuestos('HOGAR'));

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/presupuestos_definicion', expect.objectContaining({
          activo: 'eq.true',
          unidad: 'eq.HOGAR',
        }));
      });
    });

    it('returns presupuestos from API (server-side filtering via unidad param)', async () => {
      const presupuestos: PresupuestoDefinicion[] = [
        mockPresupuesto({ id: 1, unidad: 'HOGAR' }),
        mockPresupuesto({ id: 2, unidad: 'PROFESIONAL' }),
        mockPresupuesto({ id: 3, unidad: 'HOGAR' }),
      ];
      vi.mocked(apiGet).mockResolvedValue(presupuestos);

      const { result } = renderHook(() => usePresupuestos('HOGAR'));

      await waitFor(() => {
        expect(result.current.presupuestos).toHaveLength(3);
      });
    });

    it('re-fetches when unidad changes', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result, rerender } = renderHook(({ unidad }) => usePresupuestos(unidad), {
        initialProps: { unidad: undefined as 'HOGAR' | 'PROFESIONAL' | 'BRASIL' | undefined },
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(apiGet).mockClear();
      rerender({ unidad: 'HOGAR' });

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/presupuestos_definicion', expect.objectContaining({
          unidad: 'eq.HOGAR',
        }));
      });
    });
  });

  describe('returns empty array when no presupuestos', () => {
    it('returns empty array when API returns empty array', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);

      const { result } = renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(result.current.presupuestos).toEqual([]);
      });
    });

    it('has loading false when no presupuestos', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);

      const { result } = renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.presupuestos).toEqual([]);
      });
    });
  });

  describe('error handling', () => {
    it('sets error when API fails', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(result.current.error).toBe('Error al cargar presupuestos');
      });
    });

    it('sets loading false after fetch error', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('does not populate presupuestos on fetch error', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(result.current.presupuestos).toEqual([]);
      });
    });

    it('has no error when fetch succeeds', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);

      const { result } = renderHook(() => usePresupuestos());

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('refresh', () => {
    it('re-fetches presupuestos', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result } = renderHook(() => usePresupuestos());
      await waitFor(() => expect(result.current.loading).toBe(false));

      vi.mocked(apiGet).mockClear();

      await result.current.refresh();

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalled();
      });
    });

    it('sets loading true during refresh', async () => {
      vi.mocked(apiGet).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
      const { result } = renderHook(() => usePresupuestos());

      vi.mocked(apiGet).mockClear();
      vi.mocked(apiGet).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));

      const refreshPromise = result.current.refresh();

      expect(result.current.loading).toBe(true);

      await refreshPromise;
    });
  });
});