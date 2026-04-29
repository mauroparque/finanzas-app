# Fix P0 Blockers Post-Supabase Audit

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolver los 11 hallazgos P0 de la auditoría post-Supabase para estabilizar el ledger, la taxonomía, el schema y la seguridad antes de cualquier feature work.

**Architecture:** Cambios frontend focalizados en parseo de moneda y taxonomía (Batch 1–2), seguidos de consolidación del schema bajo `movimientos` como tabla maestra (Batch 3) y sincronización con DB (Batch 4).

**Tech Stack:** React 19 + TypeScript + Vite + TailwindCSS + Supabase (PostgREST) + Vitest

**Decisiones tomadas:**
- **D1 (Tabla maestra):** Opción A — `movimientos` es autoritativa. Se eliminarán `transactions` y tablas huérfanas de migration 002.
- **D2 (`categorias_maestras`):** Se mantiene `classificationMap.ts` como source of truth en frontend. Se removerá la referencia huérfana en RLS.

---

## Batch 1: Seguridad y Ledger Integrity

### Task 1: Limpiar archivos de entorno y rotar clave anónima de Supabase (P0-11)

**Files:**
- Modify: `.gitignore`
- Modify: `.env.local`
- Delete: `.env.production`

**Step 1: Proteger env files en `.gitignore`**

Añadir al final de `.gitignore`:
```
# Environment files with secrets
.env.local
.env.production
```

**Step 2: Limpiar `.env.local`**

Eliminar todas las variables muertas. El archivo debe quedar así:
```
VITE_SUPABASE_URL=https://efzpetzrfhpiyojwkchc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Nota: la clave **ya está expuesta en git history**. El siguiente step es rotarla.

**Step 3: Rotar clave anónima (manual, panel de Supabase)**

1. Ir a Supabase Dashboard → Project Settings → API.
2. Click "Regenerate" (o "Rotate API Keys" según UI).
3. Copiar nueva `anon` key.
4. Pegarla en `.env.local` reemplazando la vieja.
5. **Nunca commitear el archivo actualizado.**

**Step 4: Eliminar `.env.production` del repo**

```bash
rm .env.production
git rm .env.production
```

**Step 5: Commit**

```bash
git add .gitignore .env.local
# .env.production ya fue rm'd
git commit -m "security(env): remove committed secrets and clean dead env vars"
```

---

### Task 2: Eliminar default ARS de `formatCurrency` (P0-3)

**Files:**
- Modify: `src/utils/formatters.ts:21`
- Verify: `src/utils/formatters.test.ts`

**Step 1: Quitar default parameter**

```ts
// src/utils/formatters.ts:21
export function formatCurrency(amount: number, currency: string): string {
```

**Step 2: Verificar que todos los call sites ya pasan currency explícita**

Run:
```bash
npx tsc --noEmit
```
Expected: **0 errores** (todos los call sites en `src/` ya pasan segundo argumento).

**Step 3: Correr tests de formatters**

```bash
npm run test:run -- src/utils/formatters.test.ts
```
Expected: PASS

**Step 4: Commit**

```bash
git add src/utils/formatters.ts
git commit -m "fix(currency): remove hardcoded ARS default from formatCurrency"
```

---

### Task 3: Fix string concatenation en `Dashboard.tsx` balance reducer (P0-1)

**Files:**
- Modify: `src/components/Dashboard.tsx:19`

**Step 1: Agregar `parseFloat` explícito**

```tsx
// src/components/Dashboard.tsx:19
const totalBalance = accounts.reduce(
  (sum, acc) => sum + parseFloat(String(acc.saldo)),
  0
);
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errores

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): parseFloat saldo before arithmetic to prevent string concat"
```

---

### Task 4: Dashboard multi-moneda — eliminar total ARS forzado (P0-2)

**Files:**
- Modify: `src/components/Dashboard.tsx:92-131`

**Step 1: Calcular subtotales por moneda**

Reemplazar `totalBalance` simple por grouped balances. Insertar después de la línea 19:

```tsx
const balancesByCurrency = useMemo(() => {
  const map: Record<string, number> = {};
  accounts.forEach(acc => {
    const moneda = acc.moneda;
    map[moneda] = (map[moneda] || 0) + parseFloat(String(acc.saldo));
  });
  return map;
}, [accounts]);
```

**Step 2: Reemplazar el Hero Balance Card para mostrar subtotales**

Reemplazar el bloque del header del card (líneas 91-101 aprox) por:

```tsx
<Card padding="lg" shadow="card" className="bg-stone-50">
  <div className="flex justify-between items-start mb-6">
    <div>
      <p className="text-stone-500 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
        <Wallet size={14} /> Saldos por Moneda
      </p>
      <div className="space-y-1">
        {Object.entries(balancesByCurrency).map(([moneda, saldo]) => (
          <h3 key={moneda} className="text-2xl font-serif font-bold text-stone-800 tracking-tighter">
            {formatCurrency(saldo, moneda)}
          </h3>
        ))}
        {accounts.length === 0 && (
          <h3 className="text-2xl font-serif font-bold text-stone-400 tracking-tighter">
            Sin cuentas activas
          </h3>
        )}
      </div>
    </div>
  </div>
  {/* ... resto del card sin cambios ... */}
</Card>
```

**Step 3: TypeScript + build check**

```bash
npx tsc --noEmit
```
Expected: 0 errores

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): show balances grouped by currency instead of forced ARS total"
```

---

## Batch 2: Taxonomía Frontend

### Task 5: Fix defaults inválidos y cast unsafe en `TransactionForm.tsx` (P0-7)

**Files:**
- Modify: `src/types/index.ts:30-34`
- Modify: `src/components/transactions/TransactionForm.tsx:25-27, 131`

**Step 1: Corregir `UNIDAD_TO_MACRO` para BRASIL**

```ts
// src/types/index.ts:30-34
export const UNIDAD_TO_MACRO: Record<Unidad, Macro> = {
  HOGAR: 'VIVIR',
  PROFESIONAL: 'TRABAJAR',
  BRASIL: 'VIVIR',
};
```

**Step 2: Corregir defaults en TransactionForm**

```tsx
// src/components/transactions/TransactionForm.tsx:25-27
const [formData, setFormData] = useState({
  amount: '',
  unit: 'HOGAR' as 'HOGAR' | 'PROFESIONAL' | 'BRASIL',
  category: 'Vivienda',
  concept: 'Alquiler',
  detail: '',
  // ... resto sin cambios
});
```

**Step 3: Reemplazar `as any` por `as Moneda`**

```tsx
// src/components/transactions/TransactionForm.tsx:131
onChange={e => setFormData({ ...formData, currency: e.target.value as Moneda })}
```

Asegurarse de importar `Moneda` si no está importado:
```tsx
import type { Moneda } from '../../types';
```

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errores

**Step 5: Commit**

```bash
git add src/types/index.ts src/components/transactions/TransactionForm.tsx
git commit -m "fix(taxonomy): correct BRASIL macro mapping and TransactionForm defaults"
```

---

### Task 6: Fix defaults y agregar cascading dropdowns en `ServicesView.tsx` (P0-8)

**Files:**
- Modify: `src/components/ServicesView.tsx`

**Step 1: Corregir defaults de `newServicio`**

```tsx
// src/components/ServicesView.tsx:21-31
const [newServicio, setNewServicio] = useState({
  nombre: '',
  monto_estimado: '',
  moneda: 'ARS' as Moneda,
  unidad: 'HOGAR' as Unidad,
  categoria: 'Vivienda',
  concepto: 'Alquiler',
  detalle: '',
  dia_vencimiento: '',
  es_debito_automatico: false,
});
```

**Step 2: Importar helpers de clasificación**

```tsx
import { getCategoriesForUnit, getConceptsForCategory } from '../config/classificationMap';
```

**Step 3: Agregar selects de Categoría y Concepto con cascada**

Después del select de Unidad (línea ~310-318), agregar dos bloques similares:

```tsx
<div>
  <label className="text-sm font-medium text-stone-700 mb-1 block">Categoría</label>
  <select
    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 appearance-none"
    value={newServicio.categoria}
    onChange={e => {
      const categoria = e.target.value;
      const concepts = getConceptsForCategory(newServicio.unidad, categoria);
      const firstConcept = concepts[0]?.name || '';
      setNewServicio({ ...newServicio, categoria, concepto: firstConcept });
    }}
  >
    {getCategoriesForUnit(newServicio.unidad).map(c => (
      <option key={c.name} value={c.name}>{c.name}</option>
    ))}
  </select>
</div>

<div>
  <label className="text-sm font-medium text-stone-700 mb-1 block">Concepto</label>
  <select
    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 appearance-none"
    value={newServicio.concepto}
    onChange={e => setNewServicio({ ...newServicio, concepto: e.target.value })}
  >
    {getConceptsForCategory(newServicio.unidad, newServicio.categoria).map(c => (
      <option key={c.name} value={c.name}>{c.name}</option>
    ))}
  </select>
</div>
```

**Step 4: Agregar reset en cambio de Unidad**

Modificar el `onChange` del select de Unidad:

```tsx
onChange={e => {
  const unidad = e.target.value as Unidad;
  const categories = getCategoriesForUnit(unidad);
  const firstCategory = categories[0]?.name || '';
  const concepts = getConceptsForCategory(unidad, firstCategory);
  const firstConcept = concepts[0]?.name || '';
  setNewServicio({
    ...newServicio,
    unidad,
    categoria: firstCategory,
    concepto: firstConcept,
  });
}}
```

**Step 5: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errores

**Step 6: Commit**

```bash
git add src/components/ServicesView.tsx
git commit -m "fix(taxonomy): add classification dropdowns and fix defaults in ServicesView"
```

---

### Task 7: Agregar validación de clasificación en `CardsView.tsx` (P0-9)

**Files:**
- Modify: `src/components/CardsView.tsx`
- Modify: `src/hooks/useCuotasTarjeta.ts`

**Contexto:** `CardsView` solo lee cuotas. No hay formulario de carga. El fix mínimo para P0 es: (a) validar que la clasificación renderizada exista en el mapa, y (b) permitir editar la clasificación de una cuota existente vía `updateCuota`.

**Step 1: Agregar `addCuota` al hook**

```ts
// src/hooks/useCuotasTarjeta.ts
import { apiPost } from '../config/api';
import type { CuotaTarjetaInput } from '../types';

// dentro del hook, después de updateCuota:
const addCuota = async (cuota: CuotaTarjetaInput) => {
  try {
    const nuevo = await apiPost<CuotaTarjetaInput, CuotaTarjeta>('/cuotas_tarjeta', cuota);
    setCuotas(prev => [nuevo, ...prev]);
    return nuevo;
  } catch (err) {
    console.error('Error adding cuota:', err);
    throw err;
  }
};
```

Y exportar `addCuota` en el return:
```ts
return { cuotas, loading, error, updateCuota, addCuota, refresh: fetchCuotas };
```

**Step 2: Agregar helpers de clasificación en CardsView**

```tsx
import { getCategoriesForUnit, getConceptsForCategory } from '../config/classificationMap';
import type { Unidad } from '../types';
```

**Step 3: Agregar estado local para edición de clasificación**

```tsx
const [editingCuotaId, setEditingCuotaId] = useState<number | null>(null);
const [editForm, setEditForm] = useState<{
  unidad: Unidad;
  categoria: string;
  concepto: string;
}>({ unidad: 'HOGAR', categoria: '', concepto: '' });
```

**Step 4: Renderizar warning si clasificación no existe en mapa**

Dentro del `items.map((item) => ...)` (línea ~77), agregar antes del return:

```tsx
const validCategories = getCategoriesForUnit(item.unidad);
const isCategoryValid = validCategories.some(c => c.name === item.categoria);
```

Y renderizar un indicador visual si es inválido:

```tsx
{!isCategoryValid && (
  <p className="text-[10px] text-terracotta-600 font-bold uppercase">Clasificación no válida</p>
)}
```

**Step 5: Permitir edición inline de clasificación**

Agregar un botón de "Editar" en cada card que abra un mini-formulario con los 3 selects (unidad → categoría → concepto) y al guardar llame a `updateCuota`.

Detalle de implementación (inline en el mismo card):

```tsx
{editingCuotaId === item.id ? (
  <div className="space-y-2 mt-2">
    <select
      className="..."
      value={editForm.unidad}
      onChange={e => {
        const u = e.target.value as Unidad;
        const cats = getCategoriesForUnit(u);
        setEditForm({ unidad: u, categoria: cats[0]?.name || '', concepto: '' });
      }}
    >
      {(['HOGAR','PROFESIONAL','BRASIL'] as const).map(u => <option key={u} value={u}>{u}</option>)}
    </select>
    {/* selects de categoria y concepto similares a ServicesView */}
    <button
      onClick={() => {
        updateCuota(item.id, {
          unidad: editForm.unidad,
          categoria: editForm.categoria,
          concepto: editForm.concepto,
        });
        setEditingCuotaId(null);
      }}
    >
      Guardar
    </button>
  </div>
) : (
  <button onClick={() => {
    setEditingCuotaId(item.id);
    setEditForm({ unidad: item.unidad, categoria: item.categoria, concepto: item.concepto });
  }}>
    Editar clasificación
  </button>
)}
```

**Step 6: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errores

**Step 7: Commit**

```bash
git add src/components/CardsView.tsx src/hooks/useCuotasTarjeta.ts
git commit -m "fix(cards): add classification validation and inline editing for cuotas"
```

---

## Batch 3: Schema Consolidation (Opción A: `movimientos` autoritativa)

### Task 8: Eliminar tabla `transactions` y tablas huérfanas de migration 002 (P0-4)

**Files:**
- Create: `supabase/migrations/004_drop_orphan_tables.sql`

**Step 1: Crear migration de limpieza**

```sql
-- 004_drop_orphan_tables.sql
-- Limpia tablas de la migration 002 que nunca fueron conectadas al frontend.
-- Ejecutar manualmente en Supabase SQL Editor después de verificar que no hay datos importantes.

DROP VIEW IF EXISTS v_monthly_summary;
DROP VIEW IF EXISTS v_active_plans_next_cuota;
DROP TABLE IF EXISTS cuotas;
DROP TABLE IF EXISTS installment_plans;
DROP TABLE IF EXISTS monthly_income;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS transactions;
```

**Step 2: Documentar en `docs/technical/2026-04-29-auditoria-post-supabase.md`**

Agregar nota: "Se ejecutó Opción A: `movimientos` es la tabla maestra. Migration 004 elimina tablas huérfanas."

**Step 3: Commit (solo el archivo de migration)**

```bash
git add supabase/migrations/004_drop_orphan_tables.sql
git commit -m "chore(schema): drop orphan tables from migration 002 (transactions, installment_plans, etc.)"
```

---

### Task 9: Agregar `macro` a tipos, hooks y DB (P0-6)

**Files:**
- Modify: `src/types/index.ts:40-63`
- Modify: `src/hooks/useTransactions.ts:59-78`
- Modify: `src/hooks/useServicios.ts:84-95` (markAsPaid payload)
- Modify: `src/components/transactions/TransactionForm.tsx:61-72`
- Create: `supabase/migrations/005_add_macro_to_movimientos.sql`

**Step 1: Agregar `macro` a `Movimiento` interface**

```ts
export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  monto: number;
  moneda: Moneda;
  macro: Macro;                    // ← nuevo
  unidad: Unidad;
  categoria: string;
  concepto: string;
  detalle: string;
  // ... resto sin cambios
}
```

**Step 2: Derivar `macro` en `addTransaction` y `markAsPaid`**

En `useTransactions.ts`:
```ts
import { UNIDAD_TO_MACRO } from '../types';

const addTransaction = async (transaction: MovimientoInput) => {
  const enriched = {
    ...transaction,
    macro: UNIDAD_TO_MACRO[transaction.unidad],
  };
  const newTx = await apiPost<MovimientoInput, Movimiento>('/movimientos', enriched);
  // ...
};
```

En `useServicios.ts` (markAsPaid):
```ts
import { UNIDAD_TO_MACRO } from '../types';

const movimientoBody: MovimientoInput = {
  // ... existing fields ...
  macro: UNIDAD_TO_MACRO[servicioDef.unidad],
};
```

**Step 3: Agregar `macro` al payload de `TransactionForm.tsx`**

```tsx
import { UNIDAD_TO_MACRO } from '../../types';

await addTransaction({
  // ... existing fields ...
  macro: UNIDAD_TO_MACRO[formData.unit],
});
```

**Step 4: Crear migration para agregar columna en DB**

```sql
-- supabase/migrations/005_add_macro_to_movimientos.sql
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS macro VARCHAR(20)
  CHECK (macro IN ('VIVIR','TRABAJAR','DEBER','DISFRUTAR'));
```

**Step 5: Ejecutar migration en Supabase SQL Editor**

**Step 6: TypeScript check + tests**

```bash
npx tsc --noEmit
npm run test:run
```
Expected: PASS

**Step 7: Commit**

```bash
git add src/types/index.ts src/hooks/useTransactions.ts src/hooks/useServicios.ts src/components/transactions/TransactionForm.tsx supabase/migrations/005_add_macro_to_movimientos.sql
git commit -m "feat(schema): add macro field to Movimiento and all insert paths"
```

---

### Task 10: Remover `categorias_maestras` huérfana de RLS (P0-5)

**Files:**
- Create: `supabase/migrations/006_disable_rls_categorias_maestras.sql`

**Step 1: Crear migration de limpieza**

```sql
-- 006_disable_rls_categorias_maestras.sql
-- La tabla categorias_maestras nunca fue creada, pero aparece en 003_enable_rls.sql.
-- Si en el futuro se crea, se debe ejecutar ENABLE RLS + policy manualmente.

-- No-op seguro: si la tabla no existe, no falla.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categorias_maestras') THEN
    EXECUTE 'ALTER TABLE public.categorias_maestras DISABLE ROW LEVEL SECURITY';
  END IF;
END$$;
```

**Step 2: También actualizar `003_enable_rls.sql`** para comentar o eliminar `'categorias_maestras'` del array, de forma que futuras ejecuciones no intenten habilitar RLS sobre una tabla inexistente.

```ts
// En 003_enable_rls.sql, cambiar el array:
tables TEXT[] := ARRAY[
  'movimientos',
  'medios_pago',
  -- 'categorias_maestras',  -- removido: tabla no existe aún
  'servicios_definicion',
  // ... resto
];
```

**Step 3: Commit**

```bash
git add supabase/migrations/003_enable_rls.sql supabase/migrations/006_disable_rls_categorias_maestras.sql
git commit -m "fix(schema): remove categorias_maestras from RLS until table is created"
```

---

### Task 11: RLS para tablas migration 002 ya resuelto (P0-10)

**Status:** Resuelto implícitamente por Task 8. Las tablas huérfanas fueron eliminadas; no requieren RLS.

---

## Verificación Final

Después de completar todos los batches relevantes:

```bash
npm run test:run
npx tsc --noEmit
npm run build
```

Expected:
- Tests: 144/144 PASS (o más si se agregaron tests nuevos)
- TypeScript: 0 errores
- Build: exit 0

---

## Recomendación de ejecución

1. **Ejecutar Batch 1 inmediatamente** (Tasks 1–4). Son seguros, no dependen del schema, y arreglan el ledger visible al usuario.
2. **Ejecutar Batch 2** (Tasks 5–7). Arreglan la taxonomía frontend.
3. **Ejecutar Batch 3** (Tasks 8–10). Consolidación del schema bajo `movimientos`.

**¿Ejecutamos Batch 1 ahora?**
