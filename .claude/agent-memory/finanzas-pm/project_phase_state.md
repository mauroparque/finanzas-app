---
name: Estado de fases — Finanzas 2.0
description: Fases completadas, rama activa, decisiones de diseño tomadas, y gaps pendientes para handoff a Agos (actualizado 2026-04-28 v2)
type: project
---

**Stack confirmado (actualizado 2026-04-28):** React hooks → api.ts → Supabase (PostgreSQL + GoTrue Auth + PostgREST). Zustand para `authStore` (sesión + refresh) y `uiStore` (navegación). Sin SDK `@supabase/supabase-js` — se usa fetch crudo con helpers propios. Firebase es exclusivamente hosting estático.

**Why:** Phase 4 migró el backend de PostgreSQL+PostgREST en VPS con Tailscale a Supabase cloud. El motivo principal fue resolver D1 (certificado self-signed que bloqueaba acceso de Agos desde móvil). La decisión de no usar el SDK fue intencional para mantener control total sobre el cliente HTTP.

**How to apply:** Mencionar Zustand como parte del stack (authStore + uiStore). El VPS ya no es autoritativo. n8n y bot Telegram están discontinuados — no son parte del stack ni del plan futuro.

---

Phase 0 cerrada (2026-04-11) — tipos, taxonomía, API client, migration 001.
Phase 1 cerrada (2026-04-22) — hooks migrados a PostgREST, Firebase removido del código fuente.
Phase 2 cerrada (2026-04-27) — UI Editorial Orgánico, navegación responsiva.
Phase 3 cerrada (2026-04-27) — tasks 3.0→3.10, merge a main en commit 6d113d8.
Phase 4 cerrada (2026-04-28) — migración a Supabase: auth real + RLS + cliente API reescrito, 12 commits en feat/supabase-migration.

---

**Corte de datos 2026-04-28:** scripts/migrate-to-supabase.sh fue ejecutado. Supabase cloud tiene los datos reales. PostgreSQL del VPS deja de ser autoritativo.

**n8n / bot Telegram discontinuados (2026-04-28):** La carga de movimientos es exclusivamente vía app web.

**Decisión de diseño DA-1 — RLS auth_all:** Acceso total a cualquier usuario autenticado. Correcto para uso familiar exclusivo (Mauro + Agos). No requiere endurecimiento.

---

**Estado actual (2026-04-28):**
- Review integral pre-merge con finanzas-reviewer: EN CURSO sobre feat/supabase-migration.
- Pendiente: merge a main, luego Phase 5 (G1 + G2 como P1).

**Backlog técnico nuevo:**
- BT-1: Generación mensual de movimientos_previstos_mes — con n8n discontinuado, sin workflow automático. Opciones: pg_cron, Edge Function de Supabase, o trigger client-side al primer login.
- ~~BT-2: Actualizar CLAUDE.md para remover referencias a n8n como canal de carga.~~ → Resuelto 2026-04-29.

**Gaps pendientes para handoff a Agos:**
- G1: Dashboard sin agregación por Macro (VIVIR/TRABAJAR/DEBER/DISFRUTAR) — pregunta central del producto.
- G2: TransactionForm con defaults hardcodeados — regla de 3 taps no desbloqueada.
- G4: useCotizaciones sin fetch a CriptoYa — widget FX muestra vacío sin datos precargados.
- G5: AnalisisView es stub vacío.
- G6: saldo en medios_pago = 0.
