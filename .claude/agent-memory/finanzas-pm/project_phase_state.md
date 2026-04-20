---
name: Estado de fases — Finanzas 2.0
description: Estado actualizado de fases, worktree activo y deuda técnica resuelta (2026-04-20)
type: project
---

Phase 0 cerrada (2026-04-11). Entregables reales: `types/index.ts`, `classificationMap.ts`, `api.ts` (PostgREST), `001_finanzas_rearchitecture.sql` (173 líneas). El proyecto NO usa Zustand — los stores `transactionStore.ts` / `uiStore.ts` que Phase 0 mencionaba fueron eliminados en `feat/phase1-foundation`. La migration registrada originalmente como "002" es en realidad `001_finanzas_rearchitecture.sql`.

**Why:** El commit de refactor Phase 0 en main (f2f7d32) mencionaba Zustand y migration 002, pero el worktree lo corrigió.

**How to apply:** No mencionar Zustand como parte del stack. La arquitectura es React hooks → api.ts → PostgREST → PostgreSQL.

---

Worktree activo: `feat/phase1-foundation` (`.worktrees/feat-phase1-foundation`, HEAD `e80beef`). Contiene 3 commits no mergeados a main:

1. `4d1f38d` — Tailwind v3 + tokens Editorial Orgánico (`tailwind.config.js`, `postcss.config.js`, `src/index.css`)
2. `3c1a3ea` — PostgREST client (`api.ts`) + tipos snake_case + migration SQL
3. `e80beef` — Hooks migrados: `useTransactions.ts` a PostgREST, `useMediosPago.ts` nuevo (reemplaza `useAccounts.ts`), `TransactionForm.tsx` y `Dashboard.tsx` actualizados

**Deuda técnica resuelta en worktree (ya NO pendiente):**
- `useTransactions.ts` importaba Firebase — resuelto en `e80beef`
- `useAccounts.ts` no migrado — reemplazado por `useMediosPago.ts` en `e80beef`

**Próximos desbloqueadores críticos (al 2026-04-20):**
1. Mergear `feat/phase1-foundation` a `main`
2. Ejecutar `001_finanzas_rearchitecture.sql` en VPS
3. Configurar `VITE_API_URL` en `.env.local`
4. Alinear `App.tsx`: Screen type + quitar dark/neon + aplicar Editorial Orgánico
5. Implementar defaults "último usado" en TransactionForm (regla 3 taps para Agos)
