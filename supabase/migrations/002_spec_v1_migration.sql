-- Finanzas App v1.0 Schema Migration
-- Migrates from Firebase model to PostgreSQL spec-driven model
-- Date: 2026-04-11
-- Execution: Manual via CloudBeaver/SSH on VPS

-- ============================================================================
-- 1. ALTER EXISTING transactions TABLE
-- ============================================================================

-- Add new columns to transactions (if they don't exist)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS macro VARCHAR(20) CHECK (macro IN ('VIVIR','TRABAJAR','DEBER','DISFRUTAR')),
ADD COLUMN IF NOT EXISTS quien VARCHAR(20) DEFAULT 'Compartido' CHECK (quien IN ('Mauro','Agos','Compartido')),
ADD COLUMN IF NOT EXISTS es_cuota BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cuota_id BIGINT,
ADD COLUMN IF NOT EXISTS numero_cuota INTEGER;

-- Rename columns to match spec (if using old names)
-- ALTER TABLE transactions RENAME COLUMN amount TO monto;
-- ALTER TABLE transactions RENAME COLUMN currency TO moneda;
-- ALTER TABLE transactions RENAME COLUMN date_operation TO fecha_operacion;
-- ALTER TABLE transactions RENAME COLUMN date_validation TO fecha_validacion;
-- ALTER TABLE transactions RENAME COLUMN createdAt TO fecha_carga;

-- ============================================================================
-- 2. CREATE NEW TABLES
-- ============================================================================

-- installment_plans table
CREATE TABLE IF NOT EXISTS installment_plans (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('prestamo','cuota_bien','deuda')),

    macro VARCHAR(20) CHECK (macro IN ('VIVIR','TRABAJAR','DEBER','DISFRUTAR')),
    categoria TEXT,
    concepto TEXT,
    unidad VARCHAR(20) NOT NULL CHECK (unidad IN ('HOGAR','BRASIL','PROFESIONAL')),

    monto_total NUMERIC(14,2),
    total_cuotas INTEGER NOT NULL,
    monto_cuota NUMERIC(14,2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'ARS' CHECK (moneda IN ('ARS','USD','USDT')),

    medio_pago TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin_est DATE NOT NULL,

    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo','cancelado','pausado')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installment_plans_estado ON installment_plans(estado);
CREATE INDEX IF NOT EXISTS idx_installment_plans_unidad ON installment_plans(unidad);

-- cuotas table (individual installments generated from plans)
CREATE TABLE IF NOT EXISTS cuotas (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,

    fecha_vencimiento DATE NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','vencido')),

    transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL,
    pagado_en DATE,

    CONSTRAINT unique_cuota_numero UNIQUE (plan_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_cuotas_plan_id ON cuotas(plan_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON cuotas(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_fecha_vencimiento ON cuotas(fecha_vencimiento);

-- monthly_income table
CREATE TABLE IF NOT EXISTS monthly_income (
    id BIGSERIAL PRIMARY KEY,
    mes DATE NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'ARS' CHECK (moneda IN ('ARS','USD','USDT')),
    notas TEXT,

    CONSTRAINT unique_monthly_income UNIQUE (mes)
);

-- alerts table (generated automatically from cuotas and services)
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('vencimiento_servicio','vencimiento_cuota','saldo_bajo')),
    referencia_id BIGINT,
    descripcion TEXT NOT NULL,
    fecha_alerta DATE NOT NULL,
    monto NUMERIC(14,2),
    leida BOOLEAN DEFAULT FALSE,
    creada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_leida ON alerts(leida);
CREATE INDEX IF NOT EXISTS idx_alerts_fecha_alerta ON alerts(fecha_alerta);

-- ============================================================================
-- 3. ADD FOREIGN KEY TO transactions
-- ============================================================================

ALTER TABLE transactions
ADD CONSTRAINT IF NOT EXISTS fk_transactions_cuota_id
FOREIGN KEY (cuota_id) REFERENCES installment_plans(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. MIGRATION STRATEGY FOR EXISTING DATA
-- ============================================================================

-- NOTE: The application (frontend) will need to:
-- 1. Map existing categories to the new macro/categoría structure
-- 2. Use the IA to suggest macros for unmapped transactions
-- 3. Manually confirm data migration from Firebase

-- Example: If you have historical data in transactions with old category names,
-- you can create a view or temporary table to map them. The IA endpoint
-- should handle this mapping during the migration phase.

-- ============================================================================
-- 5. VIEWS FOR CONVENIENCE (OPTIONAL)
-- ============================================================================

-- View: Active plans with next cuota
CREATE OR REPLACE VIEW v_active_plans_next_cuota AS
SELECT
    ip.id,
    ip.nombre,
    ip.tipo,
    ip.estado,
    ip.unidad,
    ip.monto_cuota,
    ip.total_cuotas,
    COUNT(CASE WHEN c.estado = 'pendiente' THEN 1 END) as cuotas_pendientes,
    COUNT(CASE WHEN c.estado = 'pagado' THEN 1 END) as cuotas_pagadas,
    MIN(CASE WHEN c.estado = 'pendiente' THEN c.fecha_vencimiento END) as proxima_cuota_fecha
FROM installment_plans ip
LEFT JOIN cuotas c ON ip.id = c.plan_id
WHERE ip.estado = 'activo'
GROUP BY ip.id, ip.nombre, ip.tipo, ip.estado, ip.unidad, ip.monto_cuota, ip.total_cuotas;

-- View: Monthly summary
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
    DATE_TRUNC('month', t.fecha_operacion)::DATE as mes,
    t.unidad,
    t.macro,
    COUNT(*) as cantidad_transacciones,
    SUM(t.monto) as total_monto
FROM transactions t
WHERE t.es_cuota = FALSE
GROUP BY DATE_TRUNC('month', t.fecha_operacion), t.unidad, t.macro;

-- ============================================================================
-- 6. MIGRATION COMPLETE
-- ============================================================================

-- Verify schema was created:
-- SELECT * FROM information_schema.tables WHERE table_name LIKE 'installment%' OR table_name LIKE 'cuotas' OR table_name LIKE 'monthly%' OR table_name LIKE 'alerts';
