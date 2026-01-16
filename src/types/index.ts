import { Timestamp } from 'firebase/firestore';

// UI Types
export type Screen = 'dashboard' | 'cards' | 'services';

export enum ServiceStatus {
    PENDING = 'PENDING',
    RESERVED = 'RESERVED',
    PAID = 'PAID'
}

// Domain Models

// Core Transaction Model
export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    currency: 'ARS' | 'USD' | 'USDT' | 'BRL';

    // Jerarquía de clasificación
    unit: 'HOGAR' | 'PROFESIONAL' | 'BRASIL';
    category: string;  // Ej: "Vivienda y Vida Diaria"
    concept: string;   // Ej: "Abastecimiento"
    detail: string;    // Ej: "Supermercado Coto"

    // Línea de tiempo (Timeline)
    date_operation: Timestamp;  // La fecha del ticket/comprobante (REPORTES)
    date_validation: Timestamp; // Cuando confirmaste que el dato es correcto

    // Relaciones y Métodos
    account: string;
    paymentMethod?: string;
    isRecurring: boolean;
    recurringConfig?: RecurringConfig;

    // Auditoría
    source: 'manual' | 'mercadopago' | 'telegram' | 'n8n';
    externalId?: string;
    createdAt: Timestamp; // Fecha de carga automática
    updatedAt: Timestamp;
}

// Account Model (Bank accounts, wallets, MP accounts)
export interface Account {
    id: string;
    name: string; // Ej: "Mercadopago Mauro", "Mercado Pago Agos", "Efectivo ARS"

    type: 'bank' | 'virtual' | 'cash'; // Solo 3 opciones claras
    isActive: boolean;

    currency: 'ARS' | 'USD' | 'USDT' | 'BRL';
    balance: number;
    initial_balance: number;

    color: string;
    icon: string;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Service / Recurring Transaction Model
export interface Service {
    id: string; // ID autogenerado
    name: string; // Ej: "EPEC (Luz)", "Netflix", "Alquiler Brasil"

    // Datos monetarios
    amount: number; // Monto estimado o último monto pagado
    currency: 'ARS' | 'USD' | 'USDT' | 'BRL';

    // Clasificación (Espejo de Transactions para automatización total)
    unit: 'HOGAR' | 'PROFESIONAL' | 'BRASIL';
    category: string; // Ej: "Vivienda y Vida Diaria"
    concept: string;  // Ej: "Servicios e Impuestos"
    detail: string;   // Ej: "Internet Fibra" o "Netflix"

    // Lógica de Vencimiento
    dueDate: number; // Día del mes (1 al 31) en que vence habitualmente
    status: ServiceStatus;

    // Automatización y Control
    account_default?: string; // ID de la cuenta de donde suele debitarse (opcional)
    isAutoPay: boolean; // ¿Es débito automático o manual?

    // Historial y Variación
    last_amount?: number; // Para comparar con el mes anterior
    variation?: 'up' | 'down' | 'stable'; // Calculado automáticamente

    // Metadatos
    description?: string;
    isActive: boolean; // Para servicios que das de baja
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ServiceItem legacy alias for compatibility until all components are updated
export type ServiceItem = Service;

// Budget Model
export interface Budget {
    id: string;

    // El presupuesto puede ser por Categoría o por Concepto
    target_type: 'category' | 'concept';
    target_name: string; // El nombre de la categoría o concepto (ej: "Salud")

    // Límites
    limit: number;
    currency: 'ARS' | 'USD' | 'BRL'; // Presupuestos en la moneda que prefieras

    // Control de Unidad (Opcional: puedes tener un presupuesto solo para BRASIL)
    unit?: 'HOGAR' | 'PROFESIONAL' | 'BRASIL' | 'GLOBAL';

    // Estado actual (Calculado por n8n o Firebase Functions)
    spent: number;
    alertThreshold: number; // % (ej: 80) para que n8n te mande un Telegram de aviso

    period: 'monthly'; // Por ahora mensual es lo más sólido
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Temporary UI legacy interfaces if needed
export interface CreditCardItem {
    id: string;
    description: string;
    currentInstallment: number;
    totalInstallments: number;
    amount: number;
    category: string;
}

// Recurring Config
export interface RecurringConfig {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    dayOfMonth?: number;
    nextOccurrence: Timestamp;
    endDate?: Timestamp;
}

export interface BudgetCategory {
    name: string;
    limit: number;
    spent: number;
    icon: string;
}
