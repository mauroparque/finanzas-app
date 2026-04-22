import { describe, it, expect } from 'vitest';
import { useUIStore } from './uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState(useUIStore.getInitialState?.() ?? {
      activeScreen: 'inicio',
      isTransactionFormOpen: false,
      isNewPlanModalOpen: false,
      isMobile: false,
      selectedUnit: 'HOGAR',
      selectedMonth: '2026-04',
    });
  });

  it('has correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.activeScreen).toBe('inicio');
    expect(state.isTransactionFormOpen).toBe(false);
    expect(state.isNewPlanModalOpen).toBe(false);
    expect(state.selectedUnit).toBe('HOGAR');
  });

  it('setActiveScreen updates screen', () => {
    useUIStore.getState().setActiveScreen('movimientos');
    expect(useUIStore.getState().activeScreen).toBe('movimientos');
  });

  it('openTransactionForm sets isTransactionFormOpen to true', () => {
    useUIStore.getState().openTransactionForm();
    expect(useUIStore.getState().isTransactionFormOpen).toBe(true);
  });

  it('closeTransactionForm sets isTransactionFormOpen to false', () => {
    useUIStore.getState().openTransactionForm();
    useUIStore.getState().closeTransactionForm();
    expect(useUIStore.getState().isTransactionFormOpen).toBe(false);
  });

  it('openNewPlanModal sets isNewPlanModalOpen to true', () => {
    useUIStore.getState().openNewPlanModal();
    expect(useUIStore.getState().isNewPlanModalOpen).toBe(true);
  });

  it('closeNewPlanModal sets isNewPlanModalOpen to false', () => {
    useUIStore.getState().openNewPlanModal();
    useUIStore.getState().closeNewPlanModal();
    expect(useUIStore.getState().isNewPlanModalOpen).toBe(false);
  });

  it('setIsMobile updates isMobile', () => {
    useUIStore.getState().setIsMobile(true);
    expect(useUIStore.getState().isMobile).toBe(true);
  });

  it('setSelectedUnit updates selectedUnit', () => {
    useUIStore.getState().setSelectedUnit('PROFESIONAL');
    expect(useUIStore.getState().selectedUnit).toBe('PROFESIONAL');
  });

  it('setSelectedMonth updates selectedMonth', () => {
    useUIStore.getState().setSelectedMonth('2026-05');
    expect(useUIStore.getState().selectedMonth).toBe('2026-05');
  });
});
