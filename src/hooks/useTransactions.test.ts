import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTransactions } from './useTransactions';
import type { Movimiento } from '../types';

vi.mock('../config/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from '../config/api';

const mockMovimiento = (overrides: Partial<Movimiento> = {}): Movimiento => ({
  id: 1,
  tipo: 'gasto',
  monto: 1000,
  moneda: 'ARS',
  macro: 'VIVIR',
  unidad: 'HOGAR',
  categoria: 'Vivienda',
  concepto: 'Alquiler',
  detalle: 'Supermercado',
  fecha_operacion: '2026-04-01T10:00:00Z',
  fecha_carga: '2026-04-01T10:00:00Z',
  medio_pago: 'MercadoPago',
  fuente: 'manual',
  ...overrides,
});

const defaultTransactionInput = {
  tipo: 'gasto' as const,
  monto: 1000,
  moneda: 'ARS' as const,
  unidad: 'HOGAR' as const,
  categoria: 'Vivienda',
  concepto: 'Alquiler',
  detalle: 'Supermercado',
  fecha_operacion: '2026-04-01T10:00:00Z',
  medio_pago: 'MercadoPago',
  fuente: 'manual' as const,
};

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetches transactions on mount', () => {
    it('calls apiGet with correct endpoint', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useTransactions());

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/movimientos', expect.any(Object));
      });
    });

    it('sets loading true initially and false after fetch', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result } = renderHook(() => useTransactions());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('returns transactions array', () => {
    it('returns empty array when no transactions exist', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.transactions).toEqual([]);
      });
    });

    it('returns transactions when API returns data', async () => {
      const transactions = [mockMovimiento({ id: 1 }), mockMovimiento({ id: 2 })];
      vi.mocked(apiGet).mockResolvedValue(transactions);
      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(2);
        expect(result.current.transactions).toEqual(transactions);
      });
    });
  });

  describe('applies unidad filter', () => {
    it('sends unidad filter to API when provided', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useTransactions({ unidad: 'HOGAR' }));

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/movimientos', expect.objectContaining({
          unidad: 'eq.HOGAR',
        }));
      });
    });

    it('does not include unidad param when not provided', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useTransactions());

      await waitFor(() => {
        const call = vi.mocked(apiGet).mock.calls[0];
        const params = call[1] as Record<string, string>;
        expect(params.unidad).toBeUndefined();
      });
    });
  });

  describe('applies categoria filter', () => {
    it('sends categoria filter to API when provided', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      renderHook(() => useTransactions({ categoria: 'Vivienda y Vida Diaria' }));

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/movimientos', expect.objectContaining({
          categoria: 'eq.Vivienda y Vida Diaria',
        }));
      });
    });
  });

  describe('applies month filter (date range)', () => {
    it('sends date range filter for month when provided', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const monthDate = new Date('2026-04-15');
      renderHook(() => useTransactions({ month: monthDate }));

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/movimientos', expect.objectContaining({
          and: expect.stringContaining('fecha_operacion.gte'),
        }));
        expect(apiGet).toHaveBeenCalledWith('/movimientos', expect.objectContaining({
          and: expect.stringContaining('fecha_operacion.lte'),
        }));
      });
    });

    it('generates correct first and last day of month', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      const monthDate = new Date('2026-04-15');
      renderHook(() => useTransactions({ month: monthDate }));

      await waitFor(() => {
        const call = vi.mocked(apiGet).mock.calls[0];
        const params = call[1] as Record<string, string>;
        expect(params.and).toContain('2026-04-01T00:00:00Z');
        expect(params.and).toContain('2026-04-30T23:59:59Z');
      });
    });
  });

  describe('adds a transaction and updates local state', () => {
    it('calls apiPost with correct payload', async () => {
      const newTransaction = mockMovimiento({ id: 99 });
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockResolvedValue(newTransaction);

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.addTransaction(defaultTransactionInput);

      expect(apiPost).toHaveBeenCalledWith('/movimientos', {
        ...defaultTransactionInput,
        macro: 'VIVIR',
      });
    });

    it('prepends new transaction to local state', async () => {
      const existing = mockMovimiento({ id: 1 });
      const newTx = mockMovimiento({ id: 2 });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPost).mockResolvedValue(newTx);

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.transactions).toHaveLength(1));

      await result.current.addTransaction(defaultTransactionInput);

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(2);
        expect(result.current.transactions[0].id).toBe(2);
      });
    });
  });

  describe('updates a transaction', () => {
    it('calls apiPatch with correct params', async () => {
      const existing = mockMovimiento({ id: 1 });
      const updated = { ...existing, monto: 2000 };
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockResolvedValue([updated]);

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.transactions).toHaveLength(1));

      await result.current.updateTransaction(1, { monto: 2000 });

      expect(apiPatch).toHaveBeenCalledWith('/movimientos', { id: 'eq.1' }, { monto: 2000 });
    });

    it('replaces transaction in local state', async () => {
      const existing = mockMovimiento({ id: 1, monto: 1000 });
      const updated = { ...existing, monto: 2000 };
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockResolvedValue([updated]);

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.transactions).toHaveLength(1));

      await result.current.updateTransaction(1, { monto: 2000 });

      await waitFor(() => {
        expect(result.current.transactions[0].monto).toBe(2000);
      });
    });
  });

  describe('deletes a transaction and updates local state', () => {
    it('calls apiDelete with correct params', async () => {
      const existing = mockMovimiento({ id: 1 });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiDelete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.transactions).toHaveLength(1));

      await result.current.deleteTransaction(1);

      expect(apiDelete).toHaveBeenCalledWith('/movimientos', { id: 'eq.1' });
    });

    it('removes transaction from local state', async () => {
      const existing = mockMovimiento({ id: 1 });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiDelete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.transactions).toHaveLength(1));

      await result.current.deleteTransaction(1);

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(0);
      });
    });
  });

  describe('handles error state', () => {
    it('sets error when API fails', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.error).toBe('Error al cargar movimientos');
      });
    });

    it('sets loading false after error', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('throws error when addTransaction fails', async () => {
      vi.mocked(apiGet).mockResolvedValue([]);
      vi.mocked(apiPost).mockRejectedValue(new Error('Insert failed'));

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.addTransaction(defaultTransactionInput)).rejects.toThrow('Insert failed');
    });

    it('throws error when deleteTransaction fails', async () => {
      const existing = mockMovimiento({ id: 1 });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiDelete).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.transactions).toHaveLength(1));

      await expect(result.current.deleteTransaction(1)).rejects.toThrow('Delete failed');
    });

    it('throws error when updateTransaction fails', async () => {
      const existing = mockMovimiento({ id: 1 });
      vi.mocked(apiGet).mockResolvedValue([existing]);
      vi.mocked(apiPatch).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useTransactions());
      await waitFor(() => expect(result.current.transactions).toHaveLength(1));

      await expect(result.current.updateTransaction(1, { monto: 2000 })).rejects.toThrow('Update failed');
    });
  });
});