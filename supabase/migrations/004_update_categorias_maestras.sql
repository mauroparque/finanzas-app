-- Migration 004: Evolve categorias_maestras to spec v1.0 taxonomy
-- Adds macro column, maps legacy data, seeds full taxonomy

-- 1. Add macro column (nullable first for compatibility)
ALTER TABLE categorias_maestras
  ADD COLUMN IF NOT EXISTS macro VARCHAR(20)
  CHECK (macro IN ('VIVIR','TRABAJAR','DEBER','DISFRUTAR'));

-- 2. Derive macro from unidad for existing legacy rows
UPDATE categorias_maestras
SET macro = CASE
  WHEN unidad = 'HOGAR' THEN 'VIVIR'
  WHEN unidad = 'PROFESIONAL' THEN 'TRABAJAR'
  WHEN unidad = 'BRASIL' THEN 'VIVIR'
  ELSE 'VIVIR'
END
WHERE macro IS NULL;

-- 3. Drop old unique constraint on (unidad, categoria, concepto)
ALTER TABLE categorias_maestras
  DROP CONSTRAINT IF EXISTS categorias_maestras_unidad_categoria_concepto_key;

-- 4. Add new unique constraint on (macro, categoria, concepto)
ALTER TABLE categorias_maestras
  ADD CONSTRAINT categorias_maestras_macro_categoria_concepto_key
  UNIQUE (macro, categoria, concepto);

-- 5. Make macro NOT NULL for future rows
ALTER TABLE categorias_maestras
  ALTER COLUMN macro SET NOT NULL;

-- 5b. Fix serial sequence after legacy data load (IDs were inserted explicitly)
SELECT setval(pg_get_serial_sequence('categorias_maestras', 'id'), coalesce((SELECT MAX(id) FROM categorias_maestras), 0) + 1, false);

-- 6. Seed spec v1.0 taxonomy (VIVIR)
INSERT INTO categorias_maestras (macro, unidad, categoria, concepto) VALUES
  ('VIVIR', 'HOGAR', 'Vivienda', 'Alquiler'),
  ('VIVIR', 'HOGAR', 'Vivienda', 'Mantenimiento hogar'),
  ('VIVIR', 'HOGAR', 'Vivienda', 'Honorarios inmobiliaria'),
  ('VIVIR', 'HOGAR', 'Alimentación', 'Supermercado'),
  ('VIVIR', 'HOGAR', 'Alimentación', 'Verdulería'),
  ('VIVIR', 'HOGAR', 'Alimentación', 'Carnicería'),
  ('VIVIR', 'HOGAR', 'Alimentación', 'Panadería'),
  ('VIVIR', 'HOGAR', 'Alimentación', 'Mayorista'),
  ('VIVIR', 'HOGAR', 'Alimentación', 'Agua'),
  ('VIVIR', 'HOGAR', 'Alimentación', 'Quesería / fiambrería'),
  ('VIVIR', 'HOGAR', 'Servicios', 'EPEC'),
  ('VIVIR', 'HOGAR', 'Servicios', 'Cooperativa'),
  ('VIVIR', 'HOGAR', 'Servicios', 'Personal'),
  ('VIVIR', 'HOGAR', 'Servicios', 'Nuevo Liniers'),
  ('VIVIR', 'HOGAR', 'Servicios', 'BancoRoela'),
  ('VIVIR', 'BRASIL', 'Servicios', 'Condominio'),
  ('VIVIR', 'BRASIL', 'Servicios', 'Celesc'),
  ('VIVIR', 'BRASIL', 'Servicios', 'Ambiental'),
  ('VIVIR', 'BRASIL', 'Servicios', 'Cable CCS'),
  ('VIVIR', 'BRASIL', 'Servicios', 'IPTU'),
  ('VIVIR', 'HOGAR', 'Animales', 'Bocantino'),
  ('VIVIR', 'HOGAR', 'Animales', 'Veterinaria'),
  ('VIVIR', 'HOGAR', 'Animales', 'Guardería'),
  ('VIVIR', 'HOGAR', 'Animales', 'Vacunas y antiparasitarios'),
  ('VIVIR', 'HOGAR', 'Salud', 'Médico / consulta'),
  ('VIVIR', 'HOGAR', 'Salud', 'Medicamentos'),
  ('VIVIR', 'HOGAR', 'Salud', 'Odontólogo'),
  ('VIVIR', 'HOGAR', 'Salud', 'Obra social / prepaga'),
  ('VIVIR', 'HOGAR', 'Movilidad', 'Nafta'),
  ('VIVIR', 'HOGAR', 'Movilidad', 'Peajes'),
  ('VIVIR', 'HOGAR', 'Movilidad', 'Seguro auto'),
  ('VIVIR', 'HOGAR', 'Movilidad', 'Mantenimiento auto'),
  ('VIVIR', 'HOGAR', 'Movilidad', 'Uber / remis'),
  ('VIVIR', 'HOGAR', 'Formación', 'Matrícula / arancel'),
  ('VIVIR', 'HOGAR', 'Formación', 'Materiales de estudio'),
  ('VIVIR', 'HOGAR', 'Formación', 'Librería (académica)'),
  ('VIVIR', 'HOGAR', 'Formación', 'Cursos / certificaciones')
ON CONFLICT (macro, categoria, concepto) DO NOTHING;

-- 7. Seed spec v1.0 taxonomy (TRABAJAR)
INSERT INTO categorias_maestras (macro, unidad, categoria, concepto) VALUES
  ('TRABAJAR', 'PROFESIONAL', 'Obligaciones fiscales', 'Monotributo Mauro'),
  ('TRABAJAR', 'PROFESIONAL', 'Obligaciones fiscales', 'Monotributo Agos'),
  ('TRABAJAR', 'PROFESIONAL', 'Obligaciones fiscales', 'Honorarios contador'),
  ('TRABAJAR', 'PROFESIONAL', 'Seguros y servicios profesionales', 'Mala Práxis Mauro'),
  ('TRABAJAR', 'PROFESIONAL', 'Seguros y servicios profesionales', 'Mala Práxis Agos'),
  ('TRABAJAR', 'PROFESIONAL', 'Seguros y servicios profesionales', 'RESMA'),
  ('TRABAJAR', 'PROFESIONAL', 'Infraestructura digital', 'Google Workspace'),
  ('TRABAJAR', 'PROFESIONAL', 'Infraestructura digital', 'Dominio Lumen'),
  ('TRABAJAR', 'PROFESIONAL', 'Infraestructura digital', 'Google Cloud / Hetzner'),
  ('TRABAJAR', 'PROFESIONAL', 'Equipamiento profesional', 'Insumos consultorio'),
  ('TRABAJAR', 'PROFESIONAL', 'Equipamiento profesional', 'Tecnología laboral'),
  ('TRABAJAR', 'PROFESIONAL', 'Equipamiento profesional', 'Librería (laboral)')
ON CONFLICT (macro, categoria, concepto) DO NOTHING;

-- 8. Seed spec v1.0 taxonomy (DEBER)
INSERT INTO categorias_maestras (macro, unidad, categoria, concepto) VALUES
  ('DEBER', 'HOGAR', 'Préstamos', 'Préstamo BNA'),
  ('DEBER', 'HOGAR', 'Préstamos', 'Préstamo ANSES'),
  ('DEBER', 'HOGAR', 'Préstamos', 'Préstamo personal'),
  ('DEBER', 'HOGAR', 'Préstamos', 'Préstamo BBVA'),
  ('DEBER', 'HOGAR', 'Deudas', 'Deuda AGIP'),
  ('DEBER', 'HOGAR', 'Deudas', 'Multas / infracciones')
ON CONFLICT (macro, categoria, concepto) DO NOTHING;

-- 9. Seed spec v1.0 taxonomy (DISFRUTAR)
INSERT INTO categorias_maestras (macro, unidad, categoria, concepto) VALUES
  ('DISFRUTAR', 'HOGAR', 'Ocio y salidas', 'Empanadas'),
  ('DISFRUTAR', 'HOGAR', 'Ocio y salidas', 'Hamburguesas'),
  ('DISFRUTAR', 'HOGAR', 'Ocio y salidas', 'Cervezas / gaseosas'),
  ('DISFRUTAR', 'HOGAR', 'Ocio y salidas', 'Asado'),
  ('DISFRUTAR', 'HOGAR', 'Ocio y salidas', 'Heladería / café'),
  ('DISFRUTAR', 'HOGAR', 'Ocio y salidas', 'Restaurantes / otros'),
  ('DISFRUTAR', 'HOGAR', 'Compras personales', 'Regalos'),
  ('DISFRUTAR', 'HOGAR', 'Compras personales', 'Peluquería / estética'),
  ('DISFRUTAR', 'HOGAR', 'Compras personales', 'Ropa y calzado'),
  ('DISFRUTAR', 'HOGAR', 'Compras personales', 'Librería (personal)'),
  ('DISFRUTAR', 'HOGAR', 'Compras personales', 'Consumibles varios'),
  ('DISFRUTAR', 'HOGAR', 'Suscripciones', 'Spotify'),
  ('DISFRUTAR', 'HOGAR', 'Suscripciones', 'Streaming'),
  ('DISFRUTAR', 'HOGAR', 'Suscripciones', 'Otras apps personales')
ON CONFLICT (macro, categoria, concepto) DO NOTHING;
