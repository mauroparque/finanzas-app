-- ============================================================================
-- Seed: Saldos Reales de Medios de Pago
-- ============================================================================
-- Ejecutar en Supabase SQL Editor después de correr migration 008.
-- Instrucciones:
-- 1. Reemplazar los valores de ejemplo (150000.00, etc.) con los saldos reales.
-- 2. Para tarjetas de crédito: el saldo representa DEUDA (positivo = debés plata).
--    Ejemplo: si el resumen de Visa BNA es $85000, poner saldo = 85000.
-- 3. Ejecutar todo el bloque de una vez.
--
-- Nota sobre tarjetas:
-- El pago del resumen de tarjeta es una "compensación de saldos", NO un gasto.
-- Cuando pagás el resumen, actualizás el saldo de la tarjeta a 0 (o lo reducís
-- si pagás parcial). El gasto real ya fue registrado cuando usaste la tarjeta
-- en la compra (como movimiento tipo 'gasto' con medio_pago = 'Visa BNA').
-- ============================================================================

-- ─── Billeteras Virtuales ───
UPDATE medios_pago SET saldo = 45000.00  WHERE nombre = 'Personal Pay Mau';
UPDATE medios_pago SET saldo = 120000.00 WHERE nombre = 'Mercado Pago Mau';
UPDATE medios_pago SET saldo = 35000.00  WHERE nombre = 'Mercado Pago Agos';
UPDATE medios_pago SET saldo = 28000.00  WHERE nombre = 'Personal Pay Agos';

-- ─── Exchanges (USD/USDT) ───
-- Prex: USD
UPDATE medios_pago SET saldo = 500.00    WHERE nombre = 'Prex';
-- DolarApp: USD
UPDATE medios_pago SET saldo = 1200.00   WHERE nombre = 'DolarApp';
-- Brubank: USD
UPDATE medios_pago SET saldo = 800.00    WHERE nombre = 'Brubank';
-- Fiwind: USDT
UPDATE medios_pago SET saldo = 1500.00   WHERE nombre = 'Fiwind';

-- ─── Bancos ───
UPDATE medios_pago SET saldo = 250000.00 WHERE nombre = 'BNA';
UPDATE medios_pago SET saldo = 180000.00 WHERE nombre = 'BBVA';

-- ─── Efectivo ───
UPDATE medios_pago SET saldo = 50000.00  WHERE nombre = 'Efectivo';

-- ─── Tarjetas de Crédito (saldo = DEUDA) ───
-- Ejemplo: resumen actual de cada tarjeta
UPDATE medios_pago SET saldo = 85000.00  WHERE nombre = 'Visa BNA';
UPDATE medios_pago SET saldo = 42000.00  WHERE nombre = 'Mastercard BNA';
UPDATE medios_pago SET saldo = 65000.00  WHERE nombre = 'Visa BBVA';
