-- Fix moneda enum in presupuestos_definicion (P1-SCH-1)
ALTER TABLE presupuestos_definicion
  DROP CONSTRAINT IF EXISTS presupuestos_definicion_moneda_check,
  ADD CONSTRAINT presupuestos_definicion_moneda_check
  CHECK (moneda IN ('ARS', 'USD', 'USDT', 'BRL'));

-- Standardize EstadoPrevisto (P1-SCH-3)
-- Map legacy English values to Spanish before tightening the constraint
UPDATE movimientos_previstos_mes
SET estado = 'PAGADO'
WHERE estado = 'PAID';

UPDATE movimientos_previstos_mes
SET estado = 'PENDIENTE'
WHERE estado = 'PENDING';

UPDATE movimientos_previstos_mes
SET estado = 'RESERVADO'
WHERE estado = 'RESERVED';

-- Then update the check constraint
ALTER TABLE movimientos_previstos_mes
  DROP CONSTRAINT IF EXISTS movimientos_previstos_mes_estado_check,
  ADD CONSTRAINT movimientos_previstos_mes_estado_check
  CHECK (estado IN ('PENDIENTE', 'RESERVADO', 'PAGADO'));

-- Update the column default to match the new valid values
ALTER TABLE movimientos_previstos_mes
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE';

-- Add FK on movimientos.medio_pago (P1-SCH-5)
ALTER TABLE movimientos
  ADD CONSTRAINT fk_movimientos_medio_pago
  FOREIGN KEY (medio_pago) REFERENCES medios_pago(nombre);
