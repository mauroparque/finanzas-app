import { Timestamp } from 'firebase/firestore';

// UI Types
export type Screen = 'dashboard' | 'cards' | 'services';

export enum ServiceStatus {
    PENDING = 'PENDING',
    RESERVED = 'RESERVED',
    PAID = 'PAID'
}

export interface ServiceItem {
    id: string;
    name: string;
    amount: number;
    status: ServiceStatus;
    variation?: 'up' | 'down' | 'stable';
    dueDate: number; // Day of month (1-31)
    currentDueDate?: Timestamp; // Calculated for current month
    createdAt: Timestamp;
    updatedAt: Timestamp;
    category?: string;
    description?: string;
}

export interface CreditCardItem {
    id: string;
    description: string;
    currentInstallment: number;
    totalInstallments: number;
    amount: number;
    category: string;
}

export interface BudgetCategory {
    name: string;
    limit: number;
    spent: number;
    icon: string;
}

// Domain Models

// Core Transaction Model
export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    currency: 'ARS' | 'USD' | 'USDT';
    category: string;
    subcategory?: string;
    description: string;
    date: Timestamp;
    account: string;
    paymentMethod?: string;
    tags?: string[];
    isRecurring?: boolean;
    recurringConfig?: RecurringConfig;
    source?: 'manual' | 'mercadopago' | 'telegram' | 'n8n';
    externalId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Account Model (Bank accounts, wallets, MP accounts)
export interface Account {
    id: string;
    name: string;
    type: 'bank' | 'wallet' | 'mercadopago' | 'cash';
    currency: 'ARS' | 'USD' | 'USDT';
    balance: number;
    color: string;
    icon: string;
    isActive: boolean;
}

// Budget Model (Enhanced)
export interface Budget {
    id: string;
    category: string;
    limit: number;
    period: 'monthly' | 'weekly';
    spent: number;
    alertThreshold: number;
}

// Recurring Config
export interface RecurringConfig {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    dayOfMonth?: number;
    nextOccurrence: Timestamp;
    endDate?: Timestamp;
}
