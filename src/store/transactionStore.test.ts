import { describe, it, expect } from 'vitest';
import { useTransactionStore } from './transactionStore';

describe('useTransactionStore', () => {
  beforeEach(() => {
    useTransactionStore.setState({
      transactions: [],
      plans: [],
      cuotas: [],
      income: null,
      alerts: [],
      filters: { unidad: 'HOGAR' },
      loading: false,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useTransactionStore.getState();
    expect(state.transactions).toEqual([]);
    expect(state.plans).toEqual([]);
    expect(state.cuotas).toEqual([]);
    expect(state.income).toBeNull();
    expect(state.alerts).toEqual([]);
    expect(state.filters).toEqual({ unidad: 'HOGAR' });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  describe('transaction actions', () => {
    it('setTransactions replaces transactions', () => {
      useTransactionStore.getState().setTransactions([{ id: 1, monto: 100 } as never]);
      expect(useTransactionStore.getState().transactions).toHaveLength(1);
    });

    it('addTransaction appends to transactions', () => {
      useTransactionStore.getState().addTransaction({ id: 1, monto: 100 } as never);
      useTransactionStore.getState().addTransaction({ id: 2, monto: 200 } as never);
      expect(useTransactionStore.getState().transactions).toHaveLength(2);
    });

    it('updateTransaction modifies existing transaction', () => {
      useTransactionStore.getState().setTransactions([{ id: 1, monto: 100, nombre: 'A' } as never]);
      useTransactionStore.getState().updateTransaction(1, { monto: 200 } as never);
      expect(useTransactionStore.getState().transactions[0].monto).toBe(200);
    });

    it('updateTransaction does not modify non-matching id', () => {
      useTransactionStore.getState().setTransactions([{ id: 1, monto: 100 } as never]);
      useTransactionStore.getState().updateTransaction(99, { monto: 200 } as never);
      expect(useTransactionStore.getState().transactions[0].monto).toBe(100);
    });

    it('deleteTransaction removes transaction', () => {
      useTransactionStore.getState().setTransactions([{ id: 1 } as never, { id: 2 } as never]);
      useTransactionStore.getState().deleteTransaction(1);
      expect(useTransactionStore.getState().transactions).toHaveLength(1);
      expect(useTransactionStore.getState().transactions[0].id).toBe(2);
    });
  });

  describe('plan actions', () => {
    it('setPlans replaces plans', () => {
      useTransactionStore.getState().setPlans([{ id: 1 } as never]);
      expect(useTransactionStore.getState().plans).toHaveLength(1);
    });

    it('addPlan appends to plans', () => {
      useTransactionStore.getState().addPlan({ id: 1 } as never);
      useTransactionStore.getState().addPlan({ id: 2 } as never);
      expect(useTransactionStore.getState().plans).toHaveLength(2);
    });

    it('updatePlan modifies existing plan', () => {
      useTransactionStore.getState().setPlans([{ id: 1, nombre: 'A' } as never]);
      useTransactionStore.getState().updatePlan(1, { nombre: 'B' } as never);
      expect(useTransactionStore.getState().plans[0].nombre).toBe('B');
    });
  });

  describe('cuota actions', () => {
    it('setCuotas replaces cuotas', () => {
      useTransactionStore.getState().setCuotas([{ id: 1 } as never]);
      expect(useTransactionStore.getState().cuotas).toHaveLength(1);
    });

    it('markCuotaPaid updates estado and pagado_en', () => {
      useTransactionStore.getState().setCuotas([{ id: 1, estado: 'pendiente' } as never]);
      useTransactionStore.getState().markCuotaPaid(1);
      const cuota = useTransactionStore.getState().cuotas[0];
      expect(cuota.estado).toBe('pagado');
      expect(cuota.pagado_en).toBeDefined();
    });

    it('markCuotaPaid does not modify non-matching id', () => {
      useTransactionStore.getState().setCuotas([{ id: 1, estado: 'pendiente' } as never]);
      useTransactionStore.getState().markCuotaPaid(99);
      expect(useTransactionStore.getState().cuotas[0].estado).toBe('pendiente');
    });
  });

  describe('income and alerts', () => {
    it('setIncome updates income', () => {
      useTransactionStore.getState().setIncome({ monto: 5000 } as never);
      expect(useTransactionStore.getState().income).toEqual({ monto: 5000 });
    });

    it('setAlerts replaces alerts', () => {
      useTransactionStore.getState().setAlerts([{ id: 1 } as never]);
      expect(useTransactionStore.getState().alerts).toHaveLength(1);
    });

    it('markAlertRead sets leida to true', () => {
      useTransactionStore.getState().setAlerts([{ id: 1, leida: false } as never]);
      useTransactionStore.getState().markAlertRead(1);
      expect(useTransactionStore.getState().alerts[0].leida).toBe(true);
    });

    it('markAlertRead does not modify non-matching id', () => {
      useTransactionStore.getState().setAlerts([{ id: 1, leida: false } as never]);
      useTransactionStore.getState().markAlertRead(99);
      expect(useTransactionStore.getState().alerts[0].leida).toBe(false);
    });
  });

  describe('filter actions', () => {
    it('setFilter merges filters', () => {
      useTransactionStore.getState().setFilter({ mes: '2026-04' });
      expect(useTransactionStore.getState().filters).toEqual({ unidad: 'HOGAR', mes: '2026-04' });
    });

    it('clearFilters resets to initial', () => {
      useTransactionStore.getState().setFilter({ mes: '2026-04', macro: 'VIVIR' });
      useTransactionStore.getState().clearFilters();
      expect(useTransactionStore.getState().filters).toEqual({ unidad: 'HOGAR' });
    });
  });

  describe('UI actions', () => {
    it('setLoading updates loading', () => {
      useTransactionStore.getState().setLoading(true);
      expect(useTransactionStore.getState().loading).toBe(true);
    });

    it('setError updates error', () => {
      useTransactionStore.getState().setError('Error de red');
      expect(useTransactionStore.getState().error).toBe('Error de red');
    });
  });
});
