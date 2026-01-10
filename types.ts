
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
  variation: 'up' | 'down' | 'stable';
  dueDate: string;
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
