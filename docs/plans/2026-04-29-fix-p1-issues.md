# Fix P1 Issues Post-Supabase Audit

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolver los hallazgos P1 de la auditoría post-Supabase: deuda técnica de arquitectura, mejoras de auth, fixes de schema/FX, limpieza de residuos, y UX polish.

**Architecture:** Cambios focalizados por dominio: residuos primero (menor riesgo), luego auth, lógica de Dashboard, schema, y UX.

**Tech Stack:** React 19 + TypeScript + Vite + TailwindCSS + Supabase (PostgREST) + Vitest

**Status de P1s ya resueltos por trabajo P0:**
- ✅ P1-ARCH-8 (CardsView parseFloat) — fixeado en P0-9
- ✅ P1-ARCH-9 (TransactionForm as any) — fixeado en P0-7
- ✅ P1-SCH-2 (migration 002 BRL enum) — moot, tablas dropeadas
- ✅ P1-SCH-4 (composite index) — fixeado en migration 005
- ✅ P1-SCH-10 (BRASIL→DEBER) — fixeado en P0-7
- ✅ P1-FX-3 (markAsPaid parseFloat) — fixeado en P0-6
- ✅ P1-FX-4 (CardsView parseFloat) — fixeado en P0-9
- ✅ P1-TAX-1 (ServicesView dropdowns) — fixeado en P0-8

---

## Batch 1: Cleanup de Residuos

### Task 1: Eliminar configuración Firestore muerta

**Files:**
- Modify: `firebase.json`
- Delete: `firestore.rules`
- Delete: `firestore.indexes.json`

**Step 1: Limpiar `firebase.json`**

```json
{
    "hosting": {
        "site": "lince-finanzas-app",
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
                "source": "**",
                "destination": "/index.html"
            }
        ]
    }
}
```

**Step 2: Eliminar archivos Firestore**

```bash
rm firestore.rules firestore.indexes.json
git rm firestore.rules firestore.indexes.json
```

**Step 3: Commit**

```bash
git add firebase.json && git commit -m "chore(cleanup): remove dead Firestore config and files"
```

---

### Task 2: Mover `firebase` a devDependencies

**Files:**
- Modify: `package.json`

**Step 1: Mover `firebase` de `dependencies` a `devDependencies`**

```bash
npm uninstall firebase && npm install -D firebase
```

**Step 2: Verificar build y tests**

```bash
npm run test:run && npm run build
```

**Step 3: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore(deps): move firebase to devDependencies"
```

---

### Task 3: Decidir destino de `scripts/migrate-to-supabase.sh`

**Files:**
- Decide: `scripts/migrate-to-supabase.sh`

**Step 1: Evaluar si el script sigue siendo útil**

El script hace dump/restore VPS→Supabase. Dado que:
- La migración ya se ejecutó (2026-04-28)
- El VPS ya no es autoritativo
- El script contiene credenciales del VPS en la documentación

**Decisión:** Mover a `docs/runbooks/` como documentación histórica, o eliminar.

**Step 2: Ejecutar decisión**

Opción A (mantener como runbook):
```bash
mkdir -p docs/runbooks
mv scripts/migrate-to-supabase.sh docs/runbooks/
git add docs/runbooks/ && git rm scripts/migrate-to-supabase.sh
git commit -m "chore(docs): move migration script to runbooks archive"
```

Opción B (eliminar):
```bash
git rm scripts/migrate-to-supabase.sh
git commit -m "chore(cleanup): remove executed migration script"
```

---

## Batch 2: Arquitectura — Named Exports

### Task 4: Convertir `export default` a named exports

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/MovimientosView.tsx`
- Modify: `src/components/ServicesView.tsx`
- Modify: `src/components/CardsView.tsx`
- Modify: `src/components/CotizacionesView.tsx`
- Modify: `src/components/AnalisisView.tsx`
- Modify: `src/components/transactions/TransactionForm.tsx`
- Modify: `src/components/common/Modal.tsx`
- Modify: `src/App.tsx`
- Modify: `src/config/classificationMap.ts`

**Step 1: Cambiar cada archivo**

Ejemplo para `Dashboard.tsx`:
```tsx
// Cambiar:
export default Dashboard;
// Por:
export function Dashboard() { ... }
```

Y en `App.tsx`, actualizar el import:
```tsx
// Cambiar:
import Dashboard from './components/Dashboard';
// Por:
import { Dashboard } from './components/Dashboard';
```

**Step 2: Hacer lo mismo para todos los archivos listados**

**Step 3: TypeScript check + tests**

```bash
npx tsc --noEmit && npm run test:run
```

**Step 4: Commit**

```bash
git add src/ && git commit -m "refactor(architecture): convert default exports to named exports"
```

---

## Batch 3: Auth & Stores

### Task 5: Validar `authStore.hydrate()` con type guard

**Files:**
- Modify: `src/store/authStore.ts`

**Step 1: Agregar type guard antes de hidratar**

```ts
function isValidSession(obj: unknown): obj is { session: SupabaseSession } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (!o.session || typeof o.session !== 'object') return false;
  const s = o.session as Record<string, unknown>;
  return (
    typeof s.access_token === 'string' &&
    typeof s.refresh_token === 'string' &&
    typeof s.expires_at === 'number' &&
    typeof s.token_type === 'string'
  );
}
```

**Step 2: Usar en `hydrate()`**

```ts
hydrate: () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!isValidSession(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    if (parsed.session.expires_at > now) {
      set({ session: parsed.session, status: 'authenticated' });
    } else {
      // P1-SCH-8: Attempt silent refresh
      get().refresh().then(fresh => {
        if (!fresh) localStorage.removeItem(STORAGE_KEY);
      });
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
},
```

**Step 3: Commit**

```bash
git add src/store/authStore.ts && git commit -m "fix(auth): validate session on hydrate and attempt silent refresh"
```

---

### Task 6: Fix `uiStore` SSR safety

**Files:**
- Modify: `src/store/uiStore.ts`

**Step 1: Agregar check de `typeof window`**

```ts
isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
```

**Step 2: Commit**

```bash
git add src/store/uiStore.ts && git commit -m "fix(ui): guard window.innerWidth for SSR/test safety"
```

---

### Task 7: Remover guard `DEV` en `supabase.ts`

**Files:**
- Modify: `src/config/supabase.ts`

**Step 1: Remover condición `if (import.meta.env.DEV)`**

```ts
if (!SUPABASE_URL) {
  console.warn('[supabase] VITE_SUPABASE_URL is not set');
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  console.warn('[supabase] VITE_SUPABASE_PUBLISHABLE_KEY is not set');
}
```

**Step 2: Commit**

```bash
git add src/config/supabase.ts && git commit -m "fix(config): warn on missing env vars in all environments"
```

---

### Task 8: Validación runtime en `supabaseAuth.ts`

**Files:**
- Modify: `src/lib/supabaseAuth.ts`

**Step 1: Agregar validación básica de respuesta**

```ts
function validateAuthResponse(json: unknown): SupabaseSession {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid auth response: not an object');
  }
  const o = json as Record<string, unknown>;
  if (
    typeof o.access_token !== 'string' ||
    typeof o.refresh_token !== 'string' ||
    typeof o.expires_in !== 'number' ||
    typeof o.token_type !== 'string' ||
    !o.user || typeof o.user !== 'object'
  ) {
    throw new Error('Invalid auth response: missing required fields');
  }
  return {
    access_token: o.access_token,
    refresh_token: o.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + o.expires_in,
    token_type: o.token_type as 'bearer',
    user: o.user as { id: string; email: string },
  };
}
```

**Step 2: Usar en `signIn` y `refreshSession`**

**Step 3: Commit**

```bash
git add src/lib/supabaseAuth.ts && git commit -m "fix(auth): add runtime validation to auth responses"
```

---

## Batch 4: Dashboard Logic & FX

### Task 9: Extraer `presupuestosConGasto` a hook `useBudgetStatus`

**Files:**
- Create: `src/hooks/useBudgetStatus.ts`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Crear el hook**

```ts
import { useMemo } from 'react';
import type { Movimiento, PresupuestoDefinicion } from '../types';

export function useBudgetStatus(
  presupuestos: PresupuestoDefinicion[],
  transactions: Movimiento[]
) {
  return useMemo(() => {
    return presupuestos.map(p => {
      const spent = transactions
        .filter(t => {
          const campo = p.tipo_objetivo === 'categoria' ? t.categoria : t.concepto;
          return campo === p.nombre_objetivo && t.tipo === 'gasto' && t.moneda === p.moneda;
        })
        .reduce((sum, t) => sum + parseFloat(String(t.monto)), 0);
      return { ...p, spent };
    });
  }, [presupuestos, transactions]);
}
```

**Step 2: Usar en Dashboard**

```tsx
import { useBudgetStatus } from '../hooks/useBudgetStatus';
// ...
const presupuestosConGasto = useBudgetStatus(presupuestos, transactions);
```

**Step 3: Commit**

```bash
git add src/hooks/useBudgetStatus.ts src/components/Dashboard.tsx && git commit -m "refactor(dashboard): extract budget logic to useBudgetStatus hook"
```

---

### Task 10: Fix parseFloat en budget arithmetic (P1-FX-1)

**Files:**
- Modify: `src/hooks/useBudgetStatus.ts` (ya aplicado en Task 9)
- Modify: `src/components/Dashboard.tsx`

En el hook ya usamos `parseFloat(String(t.monto))`. Verificar que `p.limite` también se parsea en el render:

```tsx
// En Dashboard.tsx donde se usa p.limite:
const limite = parseFloat(String(p.limite));
const percentage = Math.min((p.spent / limite) * 100, 100);
const isOver = p.spent > limite;
```

---

### Task 11: Filtrar budget por moneda (P1-FX-2)

**Files:**
- Already fixed in Task 9 hook (added `t.moneda === p.moneda` filter)

El hook `useBudgetStatus` ya filtra transacciones por la misma moneda del presupuesto.

---

## Batch 5: Schema & API Fixes

### Task 12: Fix `apiGetOne` error swallowing (P1-ARCH-7)

**Files:**
- Modify: `src/config/api.ts`

**Step 1: Solo capturar 404/empty-array; propagar 5xx**

```ts
export async function apiGetOne<T>(
  path: string,
  params?: Record<string, string>
): Promise<T | null> {
  try {
    const results = await request<T[]>('GET', path, {
      params,
      headers: { Accept: 'application/vnd.pgrst.object+json' },
    });
    return results[0] ?? null;
  } catch (err) {
    // Only swallow 404 and empty results; propagate 5xx
    if (err instanceof Error && err.message.includes('404')) {
      return null;
    }
    throw err;
  }
}
```

**Step 2: Commit**

```bash
git add src/config/api.ts && git commit -m "fix(api): only catch 404 in apiGetOne, propagate 5xx errors"
```

---

### Task 13: Fix timezone bug en `useTransactions` month filter (P1-SCH-6)

**Files:**
- Modify: `src/hooks/useTransactions.ts`

**Step 1: Usar comparación de fecha sin offset UTC**

```ts
if (filters?.month) {
  const year = filters.month.getFullYear();
  const month = (filters.month.getMonth() + 1).toString().padStart(2, '0');
  const lastDayDate = new Date(year, filters.month.getMonth() + 1, 0);
  
  // Use date-only strings for comparison (PostgREST interprets as local/DB midnight)
  params['fecha_operacion'] = `gte.${year}-${month}-01`;
  params['fecha_operacion'] = `lte.${year}-${month}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
}
```

**Step 2: Commit**

```bash
git add src/hooks/useTransactions.ts && git commit -m "fix(transactions): use date-only filter to avoid timezone desync"
```

---

### Task 14: Migration — Fix enums y agregar FK

**Files:**
- Create: `supabase/migrations/007_fix_enums_and_fk.sql`

**Step 1: Crear migration**

```sql
-- Fix moneda enum in presupuestos_definicion (P1-SCH-1)
ALTER TABLE presupuestos_definicion
  DROP CONSTRAINT IF EXISTS presupuestos_definicion_moneda_check,
  ADD CONSTRAINT presupuestos_definicion_moneda_check
  CHECK (moneda IN ('ARS', 'USD', 'USDT', 'BRL'));

-- Standardize EstadoPrevisto (P1-SCH-3)
-- First, map PAID → PAGADO in existing data
UPDATE movimientos_previstos_mes
SET estado = 'PAGADO'
WHERE estado = 'PAID';

-- Then update the check constraint
ALTER TABLE movimientos_previstos_mes
  DROP CONSTRAINT IF EXISTS movimientos_previstos_mes_estado_check,
  ADD CONSTRAINT movimientos_previstos_mes_estado_check
  CHECK (estado IN ('PENDIENTE', 'RESERVADO', 'PAGADO'));

-- Add FK on movimientos.medio_pago (P1-SCH-5)
ALTER TABLE movimientos
  ADD CONSTRAINT fk_movimientos_medio_pago
  FOREIGN KEY (medio_pago) REFERENCES medios_pago(nombre);
```

**Step 2: Actualizar TypeScript type**

```ts
// src/types/index.ts
export type EstadoPrevisto = 'PENDIENTE' | 'RESERVADO' | 'PAGADO';
```

**Step 3: Buscar y reemplar `'PAID'` y `'PAGADO'` dual en código**

```bash
grep -rn "'PAID'\|'PAGADO'" src/
```

Actualizar todos los usos a `'PAGADO'` únicamente.

**Step 4: Commit**

```bash
git add src/types/index.ts src/hooks/useServicios.ts src/components/ServicesView.tsx supabase/migrations/007_fix_enums_and_fk.sql && git commit -m "fix(schema): standardize EstadoPrevisto, fix moneda enum, add medio_pago FK"
```

---

## Batch 6: UX Polish

### Task 15: Implementar 3-tap rule — persistir "último usado" (P1-TAX-2)

**Files:**
- Modify: `src/components/transactions/TransactionForm.tsx`

**Step 1: Agregar helpers de localStorage**

```ts
const LAST_USED_KEY = 'finanzas-last-used';

interface LastUsed {
  unit: string;
  category: string;
  concept: string;
}

function getLastUsed(): LastUsed | null {
  const raw = localStorage.getItem(LAST_USED_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LastUsed;
  } catch {
    return null;
  }
}

function setLastUsed(values: LastUsed) {
  localStorage.setItem(LAST_USED_KEY, JSON.stringify(values));
}
```

**Step 2: Usar en el formulario**

```tsx
const lastUsed = getLastUsed();
const [formData, setFormData] = useState({
  unit: (lastUsed?.unit || 'HOGAR') as Unidad,
  category: lastUsed?.category || 'Vivienda',
  concept: lastUsed?.concept || 'Alquiler',
  // ... resto
});
```

**Step 3: Guardar al submit exitoso**

```ts
setLastUsed({
  unit: formData.unit,
  category: formData.category,
  concept: formData.concept,
});
```

**Step 4: Commit**

```bash
git add src/components/transactions/TransactionForm.tsx && git commit -m "feat(ux): persist last-used unit/category/concept for 3-tap rule"
```

---

### Task 16: Actualizar test fixtures con taxonomía válida (P1-TAX-3)

**Files:**
- Modify: `src/hooks/useTransactions.test.ts`
- Modify: `src/hooks/useServicios.test.ts`
- Modify: `src/hooks/useCuotasTarjeta.test.ts`
- Modify: `src/hooks/usePresupuestos.test.ts`

**Step 1: Reemplazar strings legacy en todos los test files**

Buscar `"Vivienda y Vida Diaria"` y `"Abastecimiento"` y reemplazar por `"Vivienda"` y `"Alquiler"` (o conceptos válidos del mapa).

**Step 2: Commit**

```bash
git add src/hooks/*.test.ts && git commit -m "test: update fixtures to use valid taxonomy strings"
```

---

### Task 17: Fix Modal.tsx colores no token (P1-ARCH-6)

**Files:**
- Modify: `src/components/common/Modal.tsx`

**Step 1: Reemplazar `slate-*` por `stone-*`**

```tsx
// Cambiar:
bg-slate-900, bg-slate-800, text-slate-400
// Por:
bg-stone-900, bg-stone-800, text-stone-400
```

**Step 2: Reemplazar `rounded-t-[2rem]` por `rounded-t-3xl`**

**Step 3: Agregar cleanup de `setTimeout`**

```tsx
useEffect(() => {
  if (isOpen) {
    const timer = setTimeout(() => setShowContent(true), 10);
    return () => clearTimeout(timer);
  } else {
    setShowContent(false);
  }
}, [isOpen]);
```

**Step 4: Commit**

```bash
git add src/components/common/Modal.tsx && git commit -m "style(modal): use Editorial Organico tokens and fix setTimeout leak"
```

---

## Batch 7: TransactionForm snake_case → camelCase (P1-ARCH-3)

### Task 18: Renombrar estado de formulario a camelCase

**Files:**
- Modify: `src/components/transactions/TransactionForm.tsx`

**Step 1: Renombrar campos en estado**

```tsx
// Cambiar:
date_operation: new Date().toISOString().split('T')[0],
// Por:
dateOperation: new Date().toISOString().split('T')[0],
```

**Step 2: Mapear al insert**

```tsx
await addTransaction({
  // ...
  fecha_operacion: new Date(formData.dateOperation).toISOString(),
  // ...
});
```

**Step 3: Actualizar todos los `onChange` referencias**

**Step 4: Commit**

```bash
git add src/components/transactions/TransactionForm.tsx && git commit -m "refactor(form): use camelCase for form state, map to snake_case on submit"
```

---

## Verificación Final

```bash
npm run test:run
npx tsc --noEmit
npm run build
```

Expected:
- Tests: 144+ PASS
- TypeScript: 0 errores
- Build: exit 0

---

## Recomendación de ejecución

1. **Batch 1** (Tasks 1-3): Cleanup de residuos — seguro y rápido
2. **Batch 2** (Task 4): Named exports — mecánico, toca muchos archivos
3. **Batch 3** (Tasks 5-8): Auth & stores — mejoras de robustez
4. **Batch 4** (Tasks 9-11): Dashboard logic + FX — extracción a hook
5. **Batch 5** (Tasks 12-14): Schema & API — fixes de contrato
6. **Batch 6-7** (Tasks 15-18): UX polish y code quality

**¿Ejecutamos Batch 1?**
