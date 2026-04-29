-- Migration 006: Drop orphan tables from migration 002
-- These tables were never connected to the frontend and are security surface area.
-- movimientos remains the authoritative transaction table.

DROP VIEW IF EXISTS v_monthly_summary;
DROP VIEW IF EXISTS v_active_plans_next_cuota;
DROP TABLE IF EXISTS cuotas;
DROP TABLE IF EXISTS installment_plans;
DROP TABLE IF EXISTS monthly_income;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS transactions;
