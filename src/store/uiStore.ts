import { create } from 'zustand';
import type { Screen } from '../types';

interface UIStore {
    // Navigation
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;

    // Modals
    isTransactionFormOpen: boolean;
    openTransactionForm: () => void;
    closeTransactionForm: () => void;

    isNewPlanModalOpen: boolean;
    openNewPlanModal: () => void;
    closeNewPlanModal: () => void;

    // Responsive
    isMobile: boolean;
    setIsMobile: (isMobile: boolean) => void;

    // Unit selector
    selectedUnit: 'HOGAR' | 'BRASIL' | 'PROFESIONAL';
    setSelectedUnit: (unit: 'HOGAR' | 'BRASIL' | 'PROFESIONAL') => void;

    // Month selector
    selectedMonth: string;  // YYYY-MM format
    setSelectedMonth: (month: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    // Navigation
    activeScreen: 'dashboard',
    setActiveScreen: (screen) => set({ activeScreen: screen }),

    // Modals
    isTransactionFormOpen: false,
    openTransactionForm: () => set({ isTransactionFormOpen: true }),
    closeTransactionForm: () => set({ isTransactionFormOpen: false }),

    isNewPlanModalOpen: false,
    openNewPlanModal: () => set({ isNewPlanModalOpen: true }),
    closeNewPlanModal: () => set({ isNewPlanModalOpen: false }),

    // Responsive
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    setIsMobile: (isMobile) => set({ isMobile }),

    // Unit selector
    selectedUnit: 'HOGAR',
    setSelectedUnit: (unit) => set({ selectedUnit: unit }),

    // Month selector
    selectedMonth: new Date().toISOString().slice(0, 7),  // YYYY-MM
    setSelectedMonth: (month) => set({ selectedMonth: month }),
}));
