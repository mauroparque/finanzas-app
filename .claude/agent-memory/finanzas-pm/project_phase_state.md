---
name: Estado de fases — Finanzas 2.0
description: Qué fases están completas, cuál está en progreso, worktree activo y stack confirmado
type: project
---

**Stack confirmado:** React hooks → api.ts → PostgREST → PostgreSQL. El proyecto NO usa Zustand. Firebase es exclusivamente hosting estático. La migration es `001_finanzas_rearchitecture.sql` (no "002").

**Why:** El commit de refactor Phase 0 en main mencionaba Zustand y migration 002, pero el worktree lo corrigió. Phase 1 completó la migración total de Firestore a PostgREST.

**How to apply:** No mencionar Zustand como parte del stack. No mencionar Firebase como backend.

---

Phase 0 cerrada (2026-04-11). Entregables: `types/index.ts`, `classificationMap.ts`, `api.ts` (PostgREST), `001_finanzas_rearchitecture.sql` (173 líneas).

Phase 1 completada (2026-04-22):
- `feat/phase1-foundation` mergeada a `main` (`e087778`)
- Tailscale instalado en VPS, hostname `n8n.tail089052.ts.net`
- PostgREST desplegado en Coolify (Docker, red `coolify`, Traefik TLS terminator)
- `PGRST_DB_URI` corregido → apunta a `finanzas_app`; rol `web_anon` creado con GRANTs
- `VITE_API_URL` configurado y funcional
- `useServicios.ts` y `usePresupuestos.ts` creados (reemplazan hooks de Firestore)
- `useServices.ts`, `useBudgets.ts`, `config/firebase.ts` eliminados
- Migrations adicionales ejecutadas: `RENAME fecha_operation → fecha_operacion`; columnas `saldo`, `moneda`, `saldo_inicial` en `medios_pago`
- App en producción con cero errores de consola

Phase 2 completada (2026-04-22):
- Rama: `feat/phase2-ui-redesign` — PR #4 mergeado a `main`
- Tema "Editorial Orgánico" aplicado: stone-50, terracotta, sage, navy
- App shell responsive: BottomNav (mobile) + Sidebar (desktop)
- UI Primitives: Card, Button, Badge, Input, cn utility
- Dashboard rediseñado: saldo por moneda, Macros grid, presupuestos con filtro moneda/unidad, vencimientos
- CardsView con useCuotasTarjeta + usePrestamos (datos reales + empty states)
- ServicesView: flujo PENDING→PAGADO con modal, compensating delete, fetch-by-ID fallback para defs inactivas
- @types/react@19 + @types/react-dom@19 instalados (faltaban como dev deps)

Deuda técnica activa post-Phase 2:
1. Certificado TLS self-signed — browsers requieren excepción manual. Bloquea onboarding de Agos.
2. `saldo` en `medios_pago` = 0 — necesitan datos reales.
3. Clasificación macro por keywords en Dashboard — `Movimiento` no tiene campo `macro`; Phase 3.

Pendiente para Phase 3: defaults "último usado" en TransactionForm (bloqueador regla 3 taps), widget FX en Dashboard, `useCotizaciones`, `CotizacionesView`, `AnalisisView`.
