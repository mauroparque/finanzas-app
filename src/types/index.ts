// UI Types
export type Screen = 'inicio' | 'carga' | 'pasivos' | 'tarjetas' | 'horizonte' | 'analisis';

// Enums and Constants
export type Macro = 'VIVIR' | 'TRABAJAR' | 'DEBER' | 'DISFRUTAR';
export type Unit = 'HOGAR' | 'BRASIL' | 'PROFESIONAL';
export type Currency = 'ARS' | 'USD' | 'USDT';
export type PaymentMethod = 'Efectivo' | 'Mercado Pago' | 'Personal Pay' | 'BNA' | 'BBVA Visa' | 'BNA Mastercard' | 'BNA Visa' | 'Fiwind' | 'Brubank' | 'Débito BNA';
export type QuestionMark = 'Mauro' | 'Agos' | 'Compartido';
export type InstallmentType = 'prestamo' | 'cuota_bien' | 'deuda';
export type InstallmentStatus = 'activo' | 'cancelado' | 'pausado';
export type CuotaStatus = 'pendiente' | 'pagado' | 'vencido';
export type AlertType = 'vencimiento_servicio' | 'vencimiento_cuota' | 'saldo_bajo';
export type Source = 'app' | 'n8n' | 'migration';

// Core Domain Models

// Transaction — Gasto individual
export interface Transaction {
    id: number | string;

    // Clasificación (Macro → Categoría → Concepto → Detalle)
    macro: Macro;
    categoria: string;
    concepto: string;
    detalle: string;  // texto libre

    // Atributos de gasto
    monto: number;
    moneda: Currency;

    // Contexto
    unidad: Unit;
    quien: QuestionMark;
    medio_pago: PaymentMethod;

    // Cuota
    es_cuota?: boolean;
    cuota_id?: number | string;
    numero_cuota?: number;

    // Timeline
    fecha_operacion: Date | string;  // ISO string o Date

    // Metadata
    validado?: boolean;
    editado_por_ia?: boolean;
    source: Source;
    fecha_carga: Date | string;
    notas?: string;
}

// InstallmentPlan — Plan de cuotas o préstamo
export interface InstallmentPlan {
    id: number | string;
    nombre: string;
    tipo: InstallmentType;

    macro?: Macro;
    categoria?: string;
    concepto?: string;
    unidad: Unit;

    monto_total?: number;  // NULL para préstamos existentes
    total_cuotas: number;
    monto_cuota: number;
    moneda: Currency;

    medio_pago: PaymentMethod;
    fecha_inicio: Date | string;
    fecha_fin_est: Date | string;

    estado: InstallmentStatus;
    notas?: string;
    creado_en?: Date | string;
}

// Cuota — Cuota individual generada automáticamente
export interface Cuota {
    id: number | string;
    plan_id: number | string;
    numero: number;

    fecha_vencimiento: Date | string;
    monto: number;
    estado: CuotaStatus;

    transaction_id?: number | string;  // FK cuando está pagada
    pagado_en?: Date | string;
}

// MonthlyIncome — Ingreso mensual
export interface MonthlyIncome {
    id: number | string;
    mes: Date | string;  // primer día del mes (YYYY-MM-01)
    monto: number;
    moneda: Currency;
    notas?: string;
}

// Alert — Alerta generada automáticamente
export interface Alert {
    id: number | string;
    tipo: AlertType;
    referencia_id?: number | string;  // ID del servicio o cuota relacionado
    descripcion: string;
    fecha_alerta: Date | string;
    monto?: number;
    leida: boolean;
    creada_en?: Date | string;
}

// Legacy types (mantener para compatibilidad temporal)
export interface Account {
    id: string;
    name: string;
    type: 'bank' | 'virtual' | 'cash';
    isActive: boolean;
    currency: Currency;
    balance: number;
    initial_balance: number;
    color: string;
    icon: string;
}

export interface Service {
    id: string;
    name: string;
    amount: number;
    currency: Currency;
    unit: Unit;
    category: string;
    concept: string;
    detail: string;
    dueDate: number;
    status: 'PENDING' | 'RESERVED' | 'PAID';
    account_default?: string;
    isAutoPay: boolean;
    last_amount?: number;
    variation?: 'up' | 'down' | 'stable';
    description?: string;
    isActive: boolean;
}
