---
name: Estado de fases — Finanzas 2.0
description: Qué fases están completas, cuál está en progreso, worktree activo y stack confirmado
type: project
---

**Stack confirmado:** React hooks → api.ts → PostgREST → PostgreSQL. El proyecto NO usa Zustand. La migration es `001_finanzas_rearchitecture.sql` (no "002").

---

Phase 0 cerrada 2026-04-11. Entregables: `types/index.ts`, `classificationMap.ts`, `api.ts` (PostgREST), `001_finanzas_rearchitecture.sql` (173 líneas).

Phase 1 completada 2026-04-22:
- `feat/phase1-foundation` mergeada a `main` (`e087778`)
- Migration `001_finanzas_rearchitecture.sql` ejecutada en VPS
- Tailscale + PostgREST configurados; `VITE_API_URL` apunta al VPS
- `useServices.ts` y `useBudgets.ts` migrados de Firestore a PostgREST (`aa2064c`)
- Alias backward-compatible en clasificación (`e316d98`)

Phase 2 en progreso desde 2026-04-22:
- Rama: `feat/phase2-ui-redesign`
- Worktree: `.worktrees/feat-phase2-ui`
- Plan: `docs/plans/2026-04-22-phase2-ui-redesign.md`
- Objetivo: reemplazar estética dark/neon por tema "Editorial Orgánico"; construir app shell responsive
- 6 pasos: UI Primitives → Layout → App.tsx shell → Dashboard → CardsView+hooks → ServicesView
- Pasos 4, 5 y 6 son independientes — pueden ejecutarse en paralelo con subagentes

Pendiente para Phase 3: defaults "último usado" en TransactionForm (bloqueador regla 3 taps para Agos), widget FX en Dashboard, `useCotizaciones`.

**Why:** Phase 1 completó toda la migración de datos; Phase 2 es puramente UI sin cambios en hooks ni lógica de datos.

**How to apply:** Al evaluar estado del proyecto, Phase 1 está cerrada. El trabajo activo es Phase 2 en worktree `feat-phase2-ui`. No hay bloqueos conocidos para iniciar implementación.
