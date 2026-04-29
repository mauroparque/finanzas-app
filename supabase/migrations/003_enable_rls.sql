-- supabase/migrations/003_enable_rls.sql
-- Habilita RLS y crea policies "compartido total" para usuarios autenticados.
-- Tablas operativas (bot_sessions, chat_histories) quedan accesibles solo
-- vía service_role (sin policy = denegado a authenticated).

-- ── Tablas operativas (frontend) ───────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'movimientos',
    'medios_pago',
    'categorias_maestras',
    'servicios_definicion',
    'ingresos_definicion',
    'presupuestos_definicion',
    'movimientos_previstos_mes',
    'cuotas_tarjeta',
    'prestamos',
    'cotizaciones_fx'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'DROP POLICY IF EXISTS auth_all ON public.%I; '
      'CREATE POLICY auth_all ON public.%I '
      'FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END$$;

-- ── Tablas internas (solo service_role, sin policy para authenticated) ─────
ALTER TABLE public.bot_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_histories ENABLE ROW LEVEL SECURITY;
