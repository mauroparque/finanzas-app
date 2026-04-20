---
name: Estado de fases — Finanzas 2.0
description: Resumen del estado de las fases del proyecto al cierre de Phase 0 (2026-04-20)
type: project
---

Phase 0 cerrada el 2026-04-11 (commit f2f7d32). Entregó: tipos de dominio, classificationMap con Macro taxonomy, Zustand stores, cliente Hono api.ts, migration SQL 002.

Phase 1 pendiente: migrar hooks de Firebase a Hono, conectar TransactionForm, flujo 3 taps para Agos.

**Why:** La migration SQL (001 y 002) no se ejecutó aún en VPS — es el primer desbloqueador real de Phase 1.

**How to apply:** Al retomar trabajo, recordar que los hooks (useTransactions, useAccounts) aún importan Firebase y que App.tsx tiene desalineación del tipo Screen respecto a types/index.ts. Verificar VPS antes de arrancar cualquier tarea de Phase 1.

Stack aclarado: Hono corre en VPS (no PostgREST puro). CLAUDE.md tiene referencias a ambos — la fuente de verdad es el commit y el código.
