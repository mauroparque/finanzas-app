import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMediosPago } from './useMediosPago';
import type { MedioPago } from '../types';

vi.mock('../config/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}));

import { apiGet, apiPost, apiPatch } from '../config/api';

const mockMedioPago = (overrides: Partial<MedioPago> = {}): MedioPago => ({
  id: 1,
  nombre: 'MercadoPago',
  tipo: 'virtual',
  moneda: 'ARS',
  saldo: 10000,
  saldo_inicial: 10000,
  activo: true,
  ...overrides,
});

describe('useMediosPago', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetches medios de pago on mount', () => {
    it('calls apiGet with correct endpoint', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useMediosPago());

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/medios_pago', expect.any(Object));
      });
    });

    it('sets loading true initially and false after fetch', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result } = renderHook(() => useMediosPago());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('includes activo filter when onlyActive is true (default)', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useMediosPago());

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/medios_pago', expect.objectContaining({
          activo: 'eq.true',
        }));
      });
    });
  });

  describe('returns both accounts alias and mediosPago', () => {
    it('returns mediosPago array', async () => {
      const medios = [mockMedioPago({ id: 1 }), mockMedioPago({ id: 2 })];
      vi.mocked(apiGet).mockResolvedValue(medios);
      const { result } = renderHook(() => useMediosPago());

      await waitFor(() => {
        expect(result.current.mediosPago).toHaveLength(2);
        expect(result.current.mediosPago).toEqual(medios);
      });
    });

    it('returns accounts as alias to mediosPago', async () => {
      const medios = [mockMedioPago({ id: 1 })];
      vi.mocked(apiGet).mockResolvedValue(medios);
      const { result } = renderHook(() => useMediosPago());

      await waitFor(() => {
        expect(result.current.accounts).toEqual(medios);
        expect(result.current.accounts).toEqual(result.current.mediosPago);
      });
    });
  });

  describe('fetches all when onlyActive is false', () => {
    it('does not include activo filter when onlyActive is false', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useMediosPago(false));

      await waitFor(() => {
        const call = vi.mocked(apiGet).mock.calls[0];
        const params = call[1] as Record<string, string>;
        expect(params.activo).toBeUndefined();
      });
    });

    it('returns all medios de pago when onlyActive is false', async () => {
      const medios = [
        mockMedioPago({ id: 1, activo: true }),
        mockMedioPago({ id: 2, activo: false }),
      ];
      vi.mocked(apiGet).mockResolvedValue(medios);
      const { result } = renderHook(() => useMediosPago(false));

      await waitFor(() => {
        expect(result.current.mediosPago).toHaveLength(2);
      });
    });
  });

  describe('adds medio de pago', () => {
    it('calls apiPost with correct payload', async () => {
      const newMedio = mockMedioPago({ id: 99, nombre: 'Nueva Cuenta' });
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockResolvedValue(newMedio);

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const input = {
        nombre: 'Nueva Cuenta',
        tipo: 'banco' as const,
        moneda: 'ARS' as const,
        saldo: 5000,
        saldo_inicial: 5000,
        activo: true,
      };

      await result.current.addMedioPago(input);

      expect(apiPost).toHaveBeenCalledWith('/medios_pago', input);
    });

    it('appends new medio to local state via addMedioPago', async () => {
      const existing = mockMedioPago({ id: 1 });
      const newMedio = mockMedioPago({ id: 2, nombre: 'Nueva Cuenta' });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPost).mockResolvedValue(newMedio);

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.mediosPago).toHaveLength(1));

      const input = {
        nombre: 'Nueva Cuenta',
        tipo: 'banco' as const,
        moneda: 'ARS' as const,
        saldo: 5000,
        saldo_inicial: 5000,
        activo: true,
      };

      await result.current.addMedioPago(input);

      await waitFor(() => {
        expect(result.current.mediosPago).toHaveLength(2);
      });
    });

    it('addAccount alias also adds medio', async () => {
      const newMedio = mockMedioPago({ id: 99 });
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockResolvedValue(newMedio);

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const input = {
        nombre: 'Cuenta Alias',
        tipo: 'efectivo' as const,
        moneda: 'ARS' as const,
        saldo: 1000,
        saldo_inicial: 1000,
        activo: true,
      };

      await result.current.addAccount(input);

      expect(apiPost).toHaveBeenCalledWith('/medios_pago', input);
    });
  });

  describe('updates medio de pago', () => {
    it('calls apiPatch with correct params', async () => {
      const existing = mockMedioPago({ id: 1 });
      const updated = { ...existing, saldo: 20000 };
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockResolvedValue([updated]);

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.mediosPago).toHaveLength(1));

      await result.current.updateMedioPago(1, { saldo: 20000 });

      expect(apiPatch).toHaveBeenCalledWith('/medios_pago', { id: 'eq.1' }, { saldo: 20000 });
    });

    it('replaces medio in local state via updateMedioPago', async () => {
      const existing = mockMedioPago({ id: 1, saldo: 10000 });
      const updated = { ...existing, saldo: 20000 };
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockResolvedValue([updated]);

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.mediosPago).toHaveLength(1));

      await result.current.updateMedioPago(1, { saldo: 20000 });

      await waitFor(() => {
        expect(result.current.mediosPago[0].saldo).toBe(20000);
      });
    });

    it('updateAccount alias also updates medio', async () => {
      const existing = mockMedioPago({ id: 1 });
      const updated = { ...existing, nombre: 'Renombrada' };
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockResolvedValue([updated]);

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.mediosPago).toHaveLength(1));

      await result.current.updateAccount(1, { nombre: 'Renombrada' });

      expect(apiPatch).toHaveBeenCalledWith('/medios_pago', { id: 'eq.1' }, { nombre: 'Renombrada' });
    });
  });

  describe('error handling', () => {
    it('sets error when API fails on fetch', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMediosPago());

      await waitFor(() => {
        expect(result.current.error).toBe('Error al cargar cuentas / medios de pago');
      });
    });

    it('sets loading false after fetch error', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMediosPago());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('throws error when addMedioPago fails', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockRejectedValue(new Error('Insert failed'));

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const input = {
        nombre: 'Nueva Cuenta',
        tipo: 'banco' as const,
        moneda: 'ARS' as const,
        saldo: 5000,
        saldo_inicial: 5000,
        activo: true,
      };

      await expect(result.current.addMedioPago(input)).rejects.toThrow('Insert failed');
    });

    it('throws error when updateMedioPago fails', async () => {
      const existing = mockMedioPago({ id: 1 });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.mediosPago).toHaveLength(1));

      await expect(result.current.updateMedioPago(1, { saldo: 999 })).rejects.toThrow('Update failed');
    });

    it('does not update local state when updateMedioPago fails', async () => {
      const existing = mockMedioPago({ id: 1, saldo: 10000 });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useMediosPago());
      await waitFor(() => expect(result.current.mediosPago).toHaveLength(1));

      try {
        await result.current.updateMedioPago(1, { saldo: 999 });
      } catch {
        // expected to throw
      }

      expect(result.current.mediosPago[0].saldo).toBe(10000);
    });
  });
});
