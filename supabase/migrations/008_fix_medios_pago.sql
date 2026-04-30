-- ============================================================================
-- Migration 008: Fix medios_pago currencies and add credit cards
-- ============================================================================

-- 1. Ensure moneda CHECK constraint includes USDT on medios_pago
-- (The table predates migration 001, so its constraint may differ)
DO $$
BEGIN
  -- Drop existing moneda check if it exists and doesn't include USDT
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'medios_pago' AND column_name = 'moneda'
  ) THEN
    ALTER TABLE medios_pago
      DROP CONSTRAINT IF EXISTS medios_pago_moneda_check;
  END IF;

  ALTER TABLE medios_pago
    ADD CONSTRAINT medios_pago_moneda_check
    CHECK (moneda IN ('ARS', 'USD', 'USDT', 'BRL'));
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint medios_pago_moneda_check already exists with correct values';
END $$;

-- 2. Fix currencies for exchange/wallet accounts
UPDATE medios_pago SET moneda = 'USDT' WHERE nombre = 'Fiwind';
UPDATE medios_pago SET moneda = 'USD' WHERE nombre IN ('DolarApp', 'Prex', 'Brubank');

-- 3. Remove generic "Tarjeta de crédito"
DELETE FROM medios_pago WHERE nombre = 'Tarjeta de crédito';

-- 4. Add individual credit cards
-- NOTE: tipo = 'Crédito', moneda = 'ARS'
-- The saldo represents DEBT (positive = you owe money).
-- When you pay the statement, you reduce this saldo.
-- This is consistent with the business rule: "pago de tarjeta ≠ gasto".
INSERT INTO medios_pago (nombre, tipo, moneda, saldo, saldo_inicial, activo)
SELECT * FROM (VALUES
  ('Visa BNA',       'Crédito', 'ARS', 0, 0, true),
  ('Mastercard BNA', 'Crédito', 'ARS', 0, 0, true),
  ('Visa BBVA',      'Crédito', 'ARS', 0, 0, true)
) AS v(nombre, tipo, moneda, saldo, saldo_inicial, activo)
WHERE NOT EXISTS (
  SELECT 1 FROM medios_pago mp WHERE mp.nombre = v.nombre
);
