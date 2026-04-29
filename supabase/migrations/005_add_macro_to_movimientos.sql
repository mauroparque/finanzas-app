-- Migration 005: Add macro to movimientos and map legacy categories to spec v1.0

-- 1. Add macro column
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS macro VARCHAR(20)
  CHECK (macro IN ('VIVIR','TRABAJAR','DEBER','DISFRUTAR'));

-- 2. Map legacy categories to spec v1.0 taxonomy
-- Auto → VIVIR / Movilidad
UPDATE movimientos SET macro = 'VIVIR', categoria = 'Movilidad', concepto = 'Mantenimiento auto'
WHERE categoria = 'Auto' AND concepto = 'Mantenimiento';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Movilidad', concepto = 'Nafta'
WHERE categoria = 'Auto' AND concepto = 'Movilidad';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Movilidad', concepto = 'Seguro auto'
WHERE categoria = 'Auto' AND concepto = 'Seguro y cargas';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Movilidad', concepto = 'Uber / remis'
WHERE categoria = 'Auto' AND concepto = 'Transporte';

-- Cargas Profesionales → TRABAJAR / Obligaciones fiscales
UPDATE movimientos SET macro = 'TRABAJAR', categoria = 'Obligaciones fiscales', concepto = 'Monotributo Mauro'
WHERE categoria = 'Cargas Profesionales' AND concepto = 'Cargas profesionales';

-- Gestión de Inmueble → VIVIR / Servicios
UPDATE movimientos SET macro = 'VIVIR', categoria = 'Servicios', concepto = 'Condominio'
WHERE categoria = 'Gestión de Inmueble' AND concepto = 'Operativo';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Servicios', concepto = 'IPTU'
WHERE categoria = 'Gestión de Inmueble' AND concepto = 'Tributario';

-- Infraestructura y Difusión → TRABAJAR
UPDATE movimientos SET macro = 'TRABAJAR', categoria = 'Infraestructura digital', concepto = 'Google Cloud / Hetzner'
WHERE categoria = 'Infraestructura y Difusión' AND concepto = 'Digital';

UPDATE movimientos SET macro = 'TRABAJAR', categoria = 'Equipamiento profesional', concepto = 'Insumos consultorio'
WHERE categoria = 'Infraestructura y Difusión' AND concepto = 'Marketing';

-- Pasivos → DEBER
UPDATE movimientos SET macro = 'DEBER', categoria = 'Préstamos', concepto = 'Préstamo personal'
WHERE categoria = 'Pasivos' AND concepto = 'Cuota Préstamo';

UPDATE movimientos SET macro = 'DEBER', categoria = 'Deudas', concepto = 'Deuda AGIP'
WHERE categoria = 'Pasivos' AND concepto = 'Deuda';

-- Pago Tarjeta: special case — map to Deudas as catch-all
-- NOTE: "pago de tarjeta ≠ gasto" per business rules. Legacy data may need manual review.
UPDATE movimientos SET macro = 'DEBER', categoria = 'Deudas', concepto = 'Multas / infracciones'
WHERE categoria = 'Pasivos' AND concepto = 'Pago Tarjeta';

-- Personal → DISFRUTAR
UPDATE movimientos SET macro = 'DISFRUTAR', categoria = 'Compras personales', concepto = 'Regalos'
WHERE categoria = 'Personal' AND concepto = 'Compras personales';

UPDATE movimientos SET macro = 'DISFRUTAR', categoria = 'Compras personales', concepto = 'Peluquería / estética'
WHERE categoria = 'Personal' AND concepto = 'Cuidado y Salud';

UPDATE movimientos SET macro = 'DISFRUTAR', categoria = 'Ocio y salidas', concepto = 'Restaurantes / otros'
WHERE categoria = 'Personal' AND concepto = 'Social y Salidas';

-- Vivienda y Vida Diaria → VIVIR
UPDATE movimientos SET macro = 'VIVIR', categoria = 'Alimentación', concepto = 'Supermercado'
WHERE categoria = 'Vivienda y Vida Diaria' AND concepto = 'Abastecimiento';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Vivienda', concepto = 'Alquiler'
WHERE categoria = 'Vivienda y Vida Diaria' AND concepto = 'Alquiler';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Vivienda', concepto = 'Mantenimiento hogar'
WHERE categoria = 'Vivienda y Vida Diaria' AND concepto = 'Equipamiento';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Servicios', concepto = 'IPTU'
WHERE categoria = 'Vivienda y Vida Diaria' AND concepto = 'Impuestos';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Animales', concepto = 'Bocantino'
WHERE categoria = 'Vivienda y Vida Diaria' AND concepto = 'Mascotas';

UPDATE movimientos SET macro = 'VIVIR', categoria = 'Servicios', concepto = 'EPEC'
WHERE categoria = 'Vivienda y Vida Diaria' AND concepto = 'Servicios';

-- 3. Make macro NOT NULL after all rows have been mapped
ALTER TABLE movimientos
  ALTER COLUMN macro SET NOT NULL;

-- 4. Add composite index for common query pattern (unidad + fecha)
CREATE INDEX IF NOT EXISTS idx_movimientos_unidad_fecha
  ON movimientos (unidad, fecha_operacion DESC);
