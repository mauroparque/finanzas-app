/**
 * src/types/index.ts — Domain types for Finanzas 2.0
 *
 * All fields use PostgreSQL column names (snake_case) so they map
 * directly to PostgREST responses without any transformation layer.
 */

// ────────────────────────────────────────────────────────────────────────────
// UI / Navigation
// ────────────────────────────────────────────────────────────────────────────

export type Screen =
  | 'dashboard'
  | 'movimientos'
  | 'tarjetas'
  | 'servicios'
  | 'analisis'
  | 'cotizaciones';

// ────────────────────────────────────────────────────────────────────────────
// Shared vocabularies
// ────────────────────────────────────────────────────────────────────────────

export type Moneda = 'ARS' | 'USD' | 'USDT' | 'BRL';
export type Unidad = 'HOGAR' | 'PROFESIONAL' | 'BRASIL';
export type Macro = 'VIVIR' | 'TRABAJAR' | 'DEBER' | 'DISFRUTAR';
export type TipoMovimiento = 'gasto' | 'ingreso';
export type EstadoPrevisto = 'PENDIENTE' | 'RESERVADO' | 'PAGADO';

export const UNIDAD_TO_MACRO: Record<Unidad, Macro> = {
  HOGAR: 'VIVIR',
  PROFESIONAL: 'TRABAJAR',
  BRASIL: 'VIVIR',
};

// ────────────────────────────────────────────────────────────────────────────
// movimientos — core financial transactions
// ────────────────────────────────────────────────────────────────────────────

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  monto: number;                     // numeric → use parseFloat() before arithmetic
  moneda: Moneda;

  // Classification hierarchy
  macro: Macro;
  unidad: Unidad;
  categoria: string;                 // e.g. "Vivienda"
  concepto: string;                  // e.g. "Alquiler"
  detalle: string;                   // e.g. "Supermercado Coto"

  // Timeline
  fecha_operacion: string;           // ISO 8601, timestamp with time zone
  fecha_carga: string;               // auto-set on insert

  // Relations
  medio_pago: string;                // FK → medios_pago.nombre

  // Source tracking
  fuente: 'manual' | 'telegram' | 'n8n' | 'importacion';
  external_id?: string;
  notas?: string;
}

export type MovimientoInput = Omit<Movimiento, 'id' | 'fecha_carga' | 'macro'> & { macro?: Macro };

// ────────────────────────────────────────────────────────────────────────────
// medios_pago — payment accounts/methods
// ────────────────────────────────────────────────────────────────────────────

export type TipoMedioPago =
  | 'Billetera Virtual'
  | 'Exchange'
  | 'Crédito'
  | 'Cash'
  | 'Banco';

export interface MedioPago {
  id: number;
  nombre: string;                    // "Mercado Pago Mau", "Efectivo ARS"
  tipo: TipoMedioPago;
  moneda: Moneda;
  saldo: number;
  saldo_inicial: number;
  activo: boolean;
  // Legacy column from initial schema — present in DB, not used in frontend
  moneda_default?: string;
  color?: string;
  icono?: string;
}

export type MedioPagoInput = Omit<MedioPago, 'id'>;

// ────────────────────────────────────────────────────────────────────────────
// servicios_definicion — recurring service templates
// ────────────────────────────────────────────────────────────────────────────

export interface ServicioDefinicion {
  id: number;
  nombre: string;                    // "EPEC", "Netflix", "Alquiler Brasil"
  monto_estimado?: number;
  moneda: Moneda;
  unidad: Unidad;
  categoria: string;
  concepto: string;
  detalle: string;
  dia_vencimiento: number;           // 1–31
  medio_pago_default?: string;
  es_debito_automatico: boolean;
  activo: boolean;
  descripcion?: string;
}

export type ServicioDefinicionInput = Omit<ServicioDefinicion, 'id'>;

// ────────────────────────────────────────────────────────────────────────────
// ingresos_definicion — recurring income templates
// ────────────────────────────────────────────────────────────────────────────

export interface IngresoDefinicion {
  id: number;
  nombre: string;                    // "Honorarios", "Alquiler cobrado"
  monto_estimado?: number;
  moneda: Moneda;
  unidad: Unidad;
  categoria: string;
  concepto: string;
  detalle: string;
  dia_esperado: number;              // Expected day of income in the month
  medio_pago_default?: string;
  activo: boolean;
}

export type IngresoDefinicionInput = Omit<IngresoDefinicion, 'id'>;

// ────────────────────────────────────────────────────────────────────────────
// movimientos_previstos_mes — monthly execution of recurring definitions
// ────────────────────────────────────────────────────────────────────────────

export interface MovimientoPrevisto {
  id: number;
  periodo: string;                   // "2026-03" (YYYY-MM)
  tipo: TipoMovimiento;
  referencia_id: number;             // FK → servicios_definicion.id or ingresos_definicion.id
  referencia_tipo: 'servicio' | 'ingreso';
  nombre: string;
  monto_estimado?: number;
  monto_real?: number;
  moneda: Moneda;
  estado: EstadoPrevisto;
  fecha_pago?: string;
  movimiento_id?: number;            // FK → movimientos.id (set when PAID)
  notas?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// presupuestos_definicion — budget templates per category/concept
// ────────────────────────────────────────────────────────────────────────────

export interface PresupuestoDefinicion {
  id: number;
  tipo_objetivo: 'categoria' | 'concepto';
  nombre_objetivo: string;
  limite: number;
  moneda: Moneda;
  unidad?: Unidad;
  porcentaje_alerta: number;         // e.g. 80 → alert at 80% spent
  activo: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// cuotas_tarjeta — credit card installment purchases
// ────────────────────────────────────────────────────────────────────────────

export interface CuotaTarjeta {
  id: number;
  descripcion: string;
  tarjeta: string;                   // Card name / account
  monto_cuota: number;
  moneda: Moneda;
  cuota_actual: number;
  total_cuotas: number;
  fecha_inicio: string;
  unidad: Unidad;
  categoria: string;
  concepto: string;
  detalle: string;
  activo: boolean;
}

export type CuotaTarjetaInput = Omit<CuotaTarjeta, 'id'>;

// ────────────────────────────────────────────────────────────────────────────
// prestamos — bank loans
// ────────────────────────────────────────────────────────────────────────────

export interface Prestamo {
  id: number;
  descripcion: string;
  entidad: string;                   // Bank / lender name
  monto_original: number;
  monto_cuota: number;
  moneda: Moneda;
  cuota_actual: number;
  total_cuotas: number;
  fecha_inicio: string;
  tasa_anual?: number;
  activo: boolean;
}

export type PrestamoInput = Omit<Prestamo, 'id'>;

// ────────────────────────────────────────────────────────────────────────────
// cotizaciones_fx — cached FX rates from CriptoYa
// ────────────────────────────────────────────────────────────────────────────

export interface CotizacionFX {
  id?: number;                       // Optional for freshly fetched rates before DB write
  par: string;                       // "USD_ARS", "BRL_ARS"
  tipo: string;                      // "blue", "oficial", "ccl", "mep", etc.
  compra: number;
  venta: number;
  timestamp: string;                 // ISO 8601
}

// ─── Utility: FX display pair ─────────────────────────────────────────────────

export interface CotizacionDisplay {
  label: string;
  compra: number;
  venta: number;
  tipo: string;
  variacion?: 'up' | 'down' | 'stable';
}


