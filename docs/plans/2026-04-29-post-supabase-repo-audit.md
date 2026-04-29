# Auditoría integral del repositorio — Post-migración Supabase

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:dispatching-parallel-agents` para lanzar las cuatro auditorías específicas en paralelo, luego consolidar resultados.

**Goal:** Producir un punch list priorizado de inconsistencias, residuos y deudas técnicas que quedaron en el repo tras tres ciclos de cambios consecutivos (Phase 2 UI, Phase 3 Editorial Orgánico, migración a Supabase).

**Context:** El repo pasó por un período intenso entre 2026-04-22 y 2026-04-29. La merge de PR #6 (Supabase) fue la última de tres mergeos grandes. Durante ese período hubo branches paralelas, cherry-picks cruzados, código deployado a prod sin pasar por PR, y resolución manual de un merge complejo. Es plausible que hayan quedado: residuos de Firestore, referencias obsoletas a PostgREST/VPS Coolify, dependencias muertas, docs desactualizadas, asimetrías entre `classificationMap.ts` y la DB de Supabase, y violaciones a las reglas del dominio (3-tap rule, "pago de tarjeta ≠ gasto", etc.).

**Method:** Cuatro auditorías especializadas en paralelo (un agente por dominio) + una pasada final de consolidación. Los agentes son **read-only** — esta auditoría no modifica código.

**Deliverable:** `docs/technical/2026-04-29-auditoria-post-supabase.md` con el punch list priorizado por severidad (P0/P1/P2) y tasks accionables. Cada hallazgo incluye archivo, línea, descripción y remediación sugerida.

---

## Archivos producidos

| Archivo | Qué contiene |
|---------|--------------|
| `docs/technical/2026-04-29-auditoria-post-supabase.md` | Reporte consolidado de auditoría con punch list P0/P1/P2 |

---

## Task 1: Auditoría de arquitectura y convenciones del proyecto

**Contexto:** Verificar que el código de Supabase, auth y los componentes de Phase 3 se adhieren a las convenciones documentadas en `CLAUDE.md` (types en `src/types/`, API vía `src/config/api.ts`, hooks por entidad, design tokens Editorial Orgánico, naming conventions).

**Files (read):**
- `src/**/*.{ts,tsx}`
- `CLAUDE.md`
- `tailwind.config.js`

- [ ] **Step 1:** Dispatch del agente `finanzas-reviewer` con scope: "auditoría integral post-merge de PR #6. Cubrir: (1) convenciones de naming en archivos nuevos de auth/, store/, lib/; (2) uso correcto de `apiGet/apiPost/apiPatch/apiDelete` en hooks; (3) adhesión al theme Editorial Orgánico en LoginScreen y cualquier componente nuevo; (4) tipado estricto sin `any`; (5) extracción de lógica a hooks. NO modificar código — sólo reportar."

- [ ] **Step 2:** El agente devuelve su informe; consolidar hallazgos en sección "Arquitectura" del reporte.

---

## Task 2: Auditoría de schema y contrato API

**Contexto:** Tras la migración a Supabase, el cliente API (`src/config/api.ts`) se reescribió, los headers cambiaron, RLS está activo, y se agregó la migration `003_enable_rls.sql`. Hay que verificar que el contrato frontend ↔ Supabase está alineado: tipos TypeScript ↔ columnas, enums ↔ check constraints, FKs ↔ relaciones esperadas, y que no quedan referencias a PostgREST/VPS.

**Files (read):**
- `src/config/api.ts`
- `src/config/supabase.ts`
- `src/types/index.ts`
- `src/lib/supabaseAuth.ts`
- `src/store/authStore.ts`
- `src/hooks/use*.ts`
- `supabase/migrations/*.sql`

- [ ] **Step 1:** Dispatch del agente `db-schema-auditor` con scope: "auditoría post-migración Supabase. Cubrir: (1) sincronía entre tipos en `src/types/index.ts` y el schema actual en migrations; (2) uso correcto de query params PostgREST en hooks (filtros, eq., select); (3) headers de auth y refresh token en `api.ts`; (4) RLS policies en `003_enable_rls.sql` — ¿son suficientes para los flujos del frontend?; (5) referencias huérfanas a PostgREST genérico, VPS, Coolify, o Firestore. NO ejecutar nada contra la DB — sólo análisis estático."

- [ ] **Step 2:** Consolidar en sección "Schema & API" del reporte.

---

## Task 3: Auditoría de moneda y aritmética financiera

**Contexto:** La regla "pago de tarjeta ≠ gasto" y el manejo correcto de monedas (parseFloat antes de aritmética, Intl.NumberFormat para display, soporte ARS/USD/USDT/BRL, cache `cotizaciones_fx`) son críticas. Cualquier error acá corrompe el ledger. Hay que verificar que los componentes de Phase 3 (Dashboard, CardsView, ServicesView, MovimientosView) y el flujo `markAsPaid` post-fix no rompan estas reglas.

**Files (read):**
- `src/utils/fx.ts`
- `src/utils/formatters.ts`
- `src/hooks/useCotizaciones.ts`
- `src/hooks/useServicios.ts`
- `src/hooks/useCuotasTarjeta.ts`
- `src/hooks/usePrestamos.ts`
- `src/components/Dashboard.tsx`
- `src/components/CardsView.tsx`
- `src/components/ServicesView.tsx`
- `src/components/MovimientosView.tsx`
- `src/components/transactions/TransactionForm.tsx`
- `src/components/common/CotizacionWidget.tsx`

- [ ] **Step 1:** Dispatch del agente `fx-currency-auditor` con scope: "auditoría post-Phase 3 + Supabase. Cubrir: (1) regla 'pago de tarjeta ≠ gasto' en `useServicios.markAsPaid` y CardsView; (2) `parseFloat` antes de toda aritmética sobre `numeric` strings; (3) `Intl.NumberFormat` para display, sin asumir ARS por defecto; (4) campo `moneda` chequeado en cada movimiento; (5) llamadas a CriptoYa cacheadas en `cotizaciones_fx`; (6) display de blue + oficial para ARS/USD."

- [ ] **Step 2:** Consolidar en sección "FX & Currency" del reporte.

---

## Task 4: Auditoría de la jerarquía de clasificación

**Contexto:** La taxonomía `Macro → Categoría → Concepto → Detalle` es source of truth del dominio. `src/config/classificationMap.ts` debe estar sincronizado con la tabla `categorias_maestras` en la DB. Los formularios de carga deben tener cascading dropdowns con reset de hijos al cambiar el padre. La 3-tap rule debe respetarse.

**Files (read):**
- `src/config/classificationMap.ts`
- `src/components/transactions/TransactionForm.tsx`
- `src/components/ServicesView.tsx`
- `src/components/CardsView.tsx`
- `supabase/migrations/*.sql`

- [ ] **Step 1:** Dispatch del agente `taxonomia-guardian` con scope: "auditoría post-Supabase de la jerarquía de clasificación. Cubrir: (1) sincronía `classificationMap.ts` ↔ `categorias_maestras` en migrations; (2) presencia de la jerarquía completa en formularios de carga (movimientos, servicios, cuotas); (3) reset correcto de campos hijos al cambiar el padre; (4) cumplimiento de la 3-tap rule en TransactionForm; (5) helpers `getCategoriesForUnit`, `getConceptsForCategory` usados consistentemente."

- [ ] **Step 2:** Consolidar en sección "Taxonomía" del reporte.

---

## Task 5: Inspección de residuos y limpieza general

**Contexto:** Durante la transición Firebase → Supabase pueden haber quedado: archivos `firestore.rules` y `firestore.indexes.json` no usados, sección `firestore` en `firebase.json`, dependencias muertas en `package.json`, configs de `.opencode/` duplicadas con `.claude/agents/`, scripts en `scripts/` sin usar, docs desactualizadas (`README.md`, `CLAUDE.md`, `docs/PROJECT_TRACKING.md`).

**Files (read):**
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- `package.json`, `package-lock.json`
- `.opencode/agent/*.md`
- `.claude/agents/*.md`
- `scripts/*`
- `README.md`, `CLAUDE.md`
- `docs/PROJECT_TRACKING.md`, `docs/README.md`

- [ ] **Step 1:** Inline (sin agente). Buscar:
  - `grep -rn "firestore\|firebase/firestore" src/` → ¿quedan imports de Firestore?
  - `grep -rn "PostgREST\|Coolify\|VPS" src/ docs/ CLAUDE.md` → referencias obsoletas
  - `npx depcheck` (si está instalado) o inspección manual de `package.json` → deps no usadas
  - Diff entre `.opencode/agent/*.md` y `.claude/agents/*.md` → duplicación
  - `scripts/migrate-to-supabase.sh` — ¿sigue siendo relevante o queda como histórico?

- [ ] **Step 2:** Consolidar en sección "Residuos" del reporte.

---

## Task 6: Refresh de PROJECT_TRACKING + consolidación

**Contexto:** Producir el documento final y actualizar el tracking del PM con el estado post-auditoría.

- [ ] **Step 1:** Crear `docs/technical/2026-04-29-auditoria-post-supabase.md` con la estructura:
  ```
  # Auditoría post-Supabase — 2026-04-29

  ## Resumen ejecutivo
  ## P0 — Bloqueantes (debe arreglarse antes de seguir)
  ## P1 — Importante (siguiente milestone)
  ## P2 — Nice to have (backlog)
  ## Por sección
    - Arquitectura (Task 1)
    - Schema & API (Task 2)
    - FX & Currency (Task 3)
    - Taxonomía (Task 4)
    - Residuos (Task 5)
  ## Recomendaciones
  ```

- [ ] **Step 2:** Dispatch del agente `finanzas-pm` para actualizar `docs/PROJECT_TRACKING.md` con el estado post-auditoría y referenciar el reporte nuevo.

- [ ] **Step 3:** Commit:
  ```bash
  git add docs/technical/2026-04-29-auditoria-post-supabase.md docs/PROJECT_TRACKING.md
  git commit -m "docs(technical): add post-Supabase repository audit report"
  ```

---

## Self-review

### Cobertura

- ✅ Arquitectura/convenciones (`finanzas-reviewer`)
- ✅ Schema y API (`db-schema-auditor`)
- ✅ Moneda y aritmética (`fx-currency-auditor`)
- ✅ Taxonomía (`taxonomia-guardian`)
- ✅ Residuos generales (inline grep + inspección)
- ✅ Tracking actualizado (`finanzas-pm`)

### Lo que NO incluye esta auditoría

- Auditoría de seguridad de Supabase (claves expuestas, RLS bypass) — fuera de scope, requiere `security-scanning:security-auditor`.
- Performance / bundle size analysis — usar Lighthouse + `vite-bundle-visualizer` aparte si se requiere.
- Cobertura de tests por archivo — Vitest ya reporta 144/144 passing; análisis de cobertura es un task independiente.

### Paralelización

Las Tasks 1-4 son independientes (cada agente toca un dominio distinto, son read-only). Dispatchearlos en paralelo con un solo mensaje. Task 5 también es paralela. Task 6 es secuencial al final.
