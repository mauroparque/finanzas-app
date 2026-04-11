import { create } from 'zustand';
import type { Transaction, InstallmentPlan, Cuota, MonthlyIncome, Alert } from '../types';

interface TransactionFilter {
    mes?: string;  // YYYY-MM
    unidad?: 'HOGAR' | 'BRASIL' | 'PROFESIONAL';
    macro?: 'VIVIR' | 'TRABAJAR' | 'DEBER' | 'DISFRUTAR';
}

interface TransactionStore {
    // Data
    transactions: Transaction[];
    plans: InstallmentPlan[];
    cuotas: Cuota[];
    income: MonthlyIncome | null;
    alerts: Alert[];

    // UI state
    filters: TransactionFilter;
    loading: boolean;
    error: string | null;

    // Actions
    setTransactions: (transactions: Transaction[]) => void;
    addTransaction: (transaction: Transaction) => void;
    updateTransaction: (id: string | number, transaction: Partial<Transaction>) => void;
    deleteTransaction: (id: string | number) => void;

    setPlans: (plans: InstallmentPlan[]) => void;
    addPlan: (plan: InstallmentPlan) => void;
    updatePlan: (id: string | number, plan: Partial<InstallmentPlan>) => void;

    setCuotas: (cuotas: Cuota[]) => void;
    markCuotaPaid: (id: string | number) => void;

    setIncome: (income: MonthlyIncome) => void;
    setAlerts: (alerts: Alert[]) => void;
    markAlertRead: (id: string | number) => void;

    setFilter: (filter: Partial<TransactionFilter>) => void;
    clearFilters: () => void;

    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

const initialFilters: TransactionFilter = {
    unidad: 'HOGAR',
};

export const useTransactionStore = create<TransactionStore>((set) => ({
    // Initial state
    transactions: [],
    plans: [],
    cuotas: [],
    income: null,
    alerts: [],
    filters: initialFilters,
    loading: false,
    error: null,

    // Transaction actions
    setTransactions: (transactions) => set({ transactions }),
    addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, transaction],
    })),
    updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
        ),
    })),
    deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
    })),

    // Plan actions
    setPlans: (plans) => set({ plans }),
    addPlan: (plan) => set((state) => ({
        plans: [...state.plans, plan],
    })),
    updatePlan: (id, updates) => set((state) => ({
        plans: state.plans.map((p) =>
            p.id === id ? { ...p, ...updates } : p
        ),
    })),

    // Cuota actions
    setCuotas: (cuotas) => set({ cuotas }),
    markCuotaPaid: (id) => set((state) => ({
        cuotas: state.cuotas.map((c) =>
            c.id === id ? { ...c, estado: 'pagado', pagado_en: new Date().toISOString() } : c
        ),
    })),

    // Income actions
    setIncome: (income) => set({ income }),

    // Alert actions
    setAlerts: (alerts) => set({ alerts }),
    markAlertRead: (id) => set((state) => ({
        alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, leida: true } : a
        ),
    })),

    // Filter actions
    setFilter: (filter) => set((state) => ({
        filters: { ...state.filters, ...filter },
    })),
    clearFilters: () => set({ filters: initialFilters }),

    // UI actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
}));
