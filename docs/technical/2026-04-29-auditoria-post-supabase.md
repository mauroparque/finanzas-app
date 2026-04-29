# Auditoría post-Supabase — 2026-04-29

> **Scope:** Repositorio finanzas-app tras merge de PR #6 (Supabase) y tres ciclos consecutivos de cambios (Phase 2 UI, Phase 3 Editorial Orgánico, migración Supabase).  
> **Method:** Cuatro auditorías especializadas en paralelo + inspección inline de residuos + consolidación.  
> **Status:** **P0 RESUELTOS** — 11 blockers fixeados en código (commits `f5d08e0`..`be1c64b`) y migrations ejecutadas en Supabase (004, 005, 006).

---

## Resumen ejecutivo

La migración a Supabase es estructuralmente sana: el cliente `api.ts` usa correctamente los helpers CRUD, auth con refresh token funciona, y no quedan imports de Firestore en `src/`. Sin embargo, la combinación de merges rápidos, branches paralelas y cherry-picks dejó **11 hallazgos de severidad P0** que deben resolverse antes de considerar el repo estable:

1. **Integridad del ledger** — `Dashboard.tsx` concatena strings de `saldo` en lugar de sumarlos, y fuerza un total multi-moneda a ARS.
2. **Bifurcación de schema** — Existen dos tablas de transacciones (`movimientos` y `transactions`) desconectadas; la 002 creó tablas huérfanas sin RLS.
3. **Taxonomía rota** — `categorias_maestras` no existe en la DB, el campo `macro` nunca se persiste, y los formularios defaultean a categorías que no existen en `classificationMap.ts`.
4. **Moneda inconsistente** — Check constraints de DB rechazan `USDT` y `BRL` en tablas distintas; `formatCurrency` asume ARS por defecto.
5. **Seguridad** — Clave anónima de Supabase commiteada en `.env.local` y `.env.production`; tablas de la migration 002 sin políticas RLS.

Las secciones siguientes detallan cada hallazgo con archivo, línea, descripción y remediación sugerida.

---

## P0 — Bloqueantes ✅ RESUELTOS

> **Fecha de resolución:** 2026-04-29  
> **Commits:** `f5d08e0`..`be1c64b`  
> **Migrations ejecutadas en Supabase:** `004_update_categorias_maestras.sql`, `005_add_macro_to_movimientos.sql`, `006_drop_orphan_tables.sql`

### P0-1 `Dashboard.tsx:19` — String concatenation en balance total ✅ FIXED

### P0-1 `Dashboard.tsx:19` — String concatenation en balance total
- **Archivo:** `src/components/Dashboard.tsx:19`
- **Issue:** `accounts.reduce((sum, acc) => sum + acc.saldo, 0)` concatena strings de Postgres `numeric` en lugar de sumar.
- **Remediación:** `sum + parseFloat(String(acc.saldo))`.

### P0-2 `Dashboard.tsx:99` — Total multi-moneda forzado a ARS
- **Archivo:** `src/components/Dashboard.tsx:98-99`
- **Issue:** Suma saldos de ARS, USD, USDT y BRL sin conversión y los muestra como ARS.
- **Remediación:** Agrupar por `acc.moneda` o convertir vía FX antes de sumar.

### P0-3 `formatCurrency` default ARS
- **Archivo:** `src/utils/formatters.ts:21`
- **Issue:** `currency: string = 'ARS'` asume moneda por defecto, violando la regla "Never assume ARS".
- **Remediación:** Hacer `currency` parámetro obligatorio (sin default).

### P0-4 Schema bifurcado: `movimientos` vs `transactions`
- **Archivo:** `supabase/migrations/001_finanzas_rearchitecture.sql`, `002_spec_v1_migration.sql`
- **Issue:** Migration 001 trabaja sobre `movimientos`; la 002 crea `transactions` con FKs desde `installment_plans`, `cuotas`, `monthly_income`, etc. El frontend lee/escribe `movimientos`, por lo que las tablas de la 002 quedan huérfanas.
- **Remediación:** Consolidar en una sola tabla (`movimientos` o `transactions`) y actualizar tipos/hooks.

### P0-5 Tabla `categorias_maestras` no existe
- **Archivo:** `supabase/migrations/003_enable_rls.sql:13`
- **Issue:** La tabla está referenciada en RLS pero nunca fue creada. `classificationMap.ts` es el único source of truth.
- **Remediación:** Crear y poblar `categorias_maestras` desde `classificationMap.ts`, o eliminarla de RLS si se mantiene solo en frontend.

### P0-6 `macro` no está en tipos ni payloads
- **Archivo:** `src/types/index.ts:40-63`, `src/components/transactions/TransactionForm.tsx`
- **Issue:** La jerarquía completa requiere `macro`, pero `Movimiento` no lo incluye y ningún insert lo envía.
- **Remediación:** Agregar `macro: Macro` a `Movimiento`, derivarlo de `UNIDAD_TO_MACRO` en el hook de insert.

### P0-7 Defaults inválidos en `TransactionForm.tsx`
- **Archivo:** `src/components/transactions/TransactionForm.tsx:26-27`
- **Issue:** `'Vivienda y Vida Diaria'` y `'Abastecimiento'` no existen en `classificationMap.ts`.
- **Remediación:** Usar `'Vivienda'` y `'Alquiler'` (o primer concepto válido).

### P0-8 Defaults inválidos en `ServicesView.tsx`
- **Archivo:** `src/components/ServicesView.tsx:26-27, 103-104`
- **Issue:** `'Vivienda y Vida Diaria'` y `'Servicios e Impuestos'` no existen en el mapa.
- **Remediación:** Reemplazar por valores válidos del mapa.

### P0-9 Sin validación de clasificación en `CardsView.tsx`
- **Archivo:** `src/components/CardsView.tsx`
- **Issue:** No hay formulario con dropdowns cascada para `CuotaTarjeta`; los valores se muestran sin validar.
- **Remediación:** Agregar formulario de carga/edición con dropdowns de `classificationMap.ts`.

### P0-10 Tablas de migration 002 sin RLS
- **Archivo:** `supabase/migrations/002_spec_v1_migration.sql`
- **Issue:** `transactions`, `installment_plans`, `cuotas`, `monthly_income`, `alerts` no tienen políticas RLS.
- **Remediación:** Agregar `ENABLE RLS` + `auth_all` (o eliminar tablas si son huérfanas).

### P0-11 Clave anónima de Supabase en git
- **Archivo:** `.env.local`, `.env.production`
- **Issue:** `VITE_SUPABASE_ANON_KEY` está commiteada; además `.env.local` contiene `VITE_API_URL` del VPS y variables Firebase muertas.
- **Remediación:** Rotar clave, agregar `.env.*` a `.gitignore`, limpiar variables obsoletas.

---

## P1 — Importante (siguiente milestone)

### Arquitectura & Convenciones
| ID | Archivo | Línea | Issue | Remediación |
|---|---|---|---|---|
| P1-ARCH-1 | `Dashboard.tsx`, `MovimientosView.tsx`, `ServicesView.tsx`, etc. | — | Uso de `export default` en lugar de named exports. | Convertir a `export function`. |
| P1-ARCH-2 | `Dashboard.tsx` | 28-38 | Lógica de negocio (`presupuestosConGasto`) en componente. | Extraer a `useBudgetStatus.ts`. |
| P1-ARCH-3 | `TransactionForm.tsx` | 25-33 | Estado de formulario usa `date_operation` (snake_case). | Usar `dateOperation` en estado; mapear al insert. |
| P1-ARCH-4 | `authStore.ts` | 74 | `JSON.parse(raw) as { session: ... }` sin validación. | Agregar type guard o Zod antes de hidratar. |
| P1-ARCH-5 | `uiStore.ts` | 46 | `window.innerWidth` evaluado al cargar módulo. | Agregar check `typeof window !== 'undefined'`. |
| P1-ARCH-6 | `Modal.tsx` | 31, 38 | Colores no token (`slate-*`) y radius arbitrario. | Reemplazar por `stone-*` y `rounded-3xl`. |
| P1-ARCH-7 | `api.ts` | 88 | `apiGetOne` captura **todos** los errores silenciosamente. | Solo capturar 404/empty-array; propagar 5xx. |
| P1-ARCH-8 | `CardsView.tsx` | 78 | `item.cuota_actual / item.total_cuotas` sin `parseFloat`. | Forzar `parseFloat(String(...))`. |
| P1-ARCH-9 | `TransactionForm.tsx` | 131 | `as any` en handler de currency. | Usar `as Moneda`. |

### Schema & API
| ID | Archivo | Línea | Issue | Remediación |
|---|---|---|---|---|
| P1-SCH-1 | `001_finanzas_rearchitecture.sql` | 69 | `presupuestos_definicion` CHECK sin `USDT`. | Agregar `USDT` al enum. |
| P1-SCH-2 | `002_spec_v1_migration.sql` | 43, 82 | `installment_plans` y `monthly_income` CHECK sin `BRL`. | Agregar `BRL` al enum. |
| P1-SCH-3 | `001_finanzas_rearchitecture.sql` | 93 | `EstadoPrevisto` dual: `PAID` vs `PAGADO`. | Estandarizar en español: `PENDIENTE`, `RESERVADO`, `PAGADO`. |
| P1-SCH-4 | `001_finanzas_rearchitecture.sql` | — | Falta índice compuesto `(unidad, fecha_operacion DESC)`. | Crear `idx_movimientos_unidad_fecha`. |
| P1-SCH-5 | `001_finanzas_rearchitecture.sql` | — | Falta FK `movimientos.medio_pago → medios_pago.nombre`. | Agregar `ALTER TABLE ... ADD CONSTRAINT`. |
| P1-SCH-6 | `src/hooks/useTransactions.ts` | 36-39 | Filtro de mes usa `Z` (UTC) causando desfase timezone. | Usar comparación de fecha sin offset o ajustar timezone. |
| P1-SCH-7 | `src/config/supabase.ts` | 9-16 | Guard de producción solo en `DEV`. | Remover condición `DEV`; fallar siempre si falta env var. |
| P1-SCH-8 | `src/store/authStore.ts` | 70-84 | `hydrate()` descarta sesión expirada sin intentar refresh. | Intentar silent refresh con `refresh_token`. |
| P1-SCH-9 | `src/lib/supabaseAuth.ts` | 16-32 | Sin validación runtime de respuestas auth. | Agregar Zod o type guards. |
| P1-SCH-10 | `src/types/index.ts` | 30-34 | `BRASIL → 'DEBER'` pero `classificationMap.ts` pone BRASIL bajo `VIVIR`. | Corregir mapping o reestructurar mapa. |

### FX & Currency
| ID | Archivo | Línea | Issue | Remediación |
|---|---|---|---|---|
| P1-FX-1 | `Dashboard.tsx` | 149-150 | Budget arithmetic sin `parseFloat` en `p.limite`. | `parseFloat(String(p.limite))`. |
| P1-FX-2 | `Dashboard.tsx` | 28-39 | Budget spent suma transacciones de cualquier moneda sin conversión. | Filtrar por `t.moneda === p.moneda` o convertir. |
| P1-FX-3 | `src/hooks/useServicios.ts` | 86 | `markAsPaid` envía `monto` como string de Postgres. | `parseFloat(String(...))`. |
| P1-FX-4 | `CardsView.tsx` | 78, 106, 129, 130 | Múltiples operaciones aritméticas sin `parseFloat`. | Forzar `parseFloat(String(...))` en cada operando. |

### Taxonomía
| ID | Archivo | Línea | Issue | Remediación |
|---|---|---|---|---|
| P1-TAX-1 | `ServicesView.tsx` | 280-347 | Formulario de servicio sin dropdowns cascada de categoría/concepto. | Agregar selects con `getCategoriesForUnit` / `getConceptsForCategory`. |
| P1-TAX-2 | `TransactionForm.tsx` | 23-34 | No persiste "último usado" — viola 3-tap rule. | Guardar/recuperar de `localStorage` los últimos valores. |
| P1-TAX-3 | `*.test.ts` (varios) | — | Fixtures usan `"Vivienda y Vida Diaria"` y `"Abastecimiento"`. | Actualizar a valores válidos del mapa. |

### Residuos
| ID | Archivo | Línea | Issue | Remediación |
|---|---|---|---|---|
| P1-RES-1 | `firebase.json` | 17-20 | Sección `firestore` apunta a archivos muertos. | Eliminar bloque `firestore`. |
| P1-RES-2 | `firestore.rules`, `firestore.indexes.json` | — | Archivos de Firestore sin uso. | Eliminar. |
| P1-RES-3 | `package.json` | 14 | `firebase` aún en `dependencies`. | Mover a `devDependencies` o eliminar si no se usa. |
| P1-RES-4 | `scripts/migrate-to-supabase.sh` | — | Script histórico de dump VPS→Supabase. | Commitear como runbook/documentación o eliminar si ya no aplica. |

---

## P2 — Nice to have (backlog)

### Arquitectura & UI
- Uso de `rounded-xl`/`rounded-lg` en lugar de `rounded-2xl`/`rounded-3xl` en múltiples componentes.
- `Badge.tsx` usa `amber`/`emerald` fuera del palette Editorial Orgánico.
- `Dashboard.tsx` usa `emerald`/`amber`/`rose` para estados de presupuesto.
- `LoginScreen.tsx` usa `text-red-600` en lugar de `text-terracotta-600`.
- `Input.tsx` usa `border-red-400`/`focus:ring-red-200` en estado error.
- `CotizacionWidget.tsx` usa `bg-rose-50`/`border-rose-200` para tarjeta de error.
- `Modal.tsx` tiene `setTimeout` sin cleanup y usa template literals en lugar de `cn()`.
- `components/common/ui/index.ts` es un barrel file (convención: no barrel files).
- `TransactionForm.tsx`, `ServicesView.tsx`, `LoginScreen.tsx` usan elementos HTML raw en lugar de primitivas `Input`/`Button`.
- `CotizacionesView.tsx` usa `as 'ARS' | 'USD' | 'BRL'` sin type guard.

### Schema & Seguridad
- `auth_all` es excesivamente permisivo (`USING (true)`). Considerar `user_id = auth.uid()` si se requiere trazabilidad individual.
- Confirmar que `movimientos.id` sea `BIGINT`/`bigserial` (no visible en migrations).
- Agregar validación runtime a respuestas de `supabaseAuth.ts`.

### FX & Currency
- `CotizacionWidget.tsx:97,103` hardcoded `'ARS'`; debería derivar de `rate.par.split('_')[1]`.
- `useCotizaciones.ts` lee últimas 20 filas sin garantizar `blue` + `oficial` por par. Usar `DISTINCT ON` o aumentar límite.
- `src/utils/fx.ts:27` multiplica `amount * rate.venta` sin `parseFloat` explícito.

### Taxonomía
- Comentarios en `src/types/index.ts` muestran ejemplos obsoletos (`"Vivienda y Vida Diaria"`).
- `TransactionForm.tsx:81` usa array hardcoded de monedas en lugar de derivar del tipo `Moneda`.

---

## Por sección

### Arquitectura (Task 1 — finanzas-reviewer)

El código nuevo de auth y stores respeta la separación Zustand. Todos los hooks usan `api.ts` correctamente. Los P0 más críticos son los asumptions de moneda (`formatCurrency` default ARS) y el `as any` en `TransactionForm`. Los P1 de default exports y lógica en componentes son deuda técnica acumulada que dificulta el mantenimiento. Destacable: no quedan imports de Firebase en `src/`.

### Schema & API (Task 2 — db-schema-auditor)

El contrato frontend↔DB presenta **bifurcación de schema** como el problema más grave: la migration 002 creó un ecosistema de tablas (`transactions`, `installment_plans`, `cuotas`, `monthly_income`, `alerts`) completamente desconectado del frontend. Esto implica que o bien esas tablas deben eliminarse, o bien el frontend debe migrar a usar `transactions` en lugar de `movimientos`. La ausencia de `categorias_maestras` en la DB rompe el invariante de sincronía. Los enums de moneda y estado tienen drift que provocará errores 400 de PostgREST. La clave anónima expuesta en git es un riesgo de seguridad inmediato.

### FX & Currency (Task 3 — fx-currency-auditor)

La regla "parseFloat antes de aritmética" se viola en el lugar más visible: `Dashboard.tsx`. El `reduce` de balances es un **bug de concatenación de strings** que corrompe la cifra mostrada al usuario. El total multi-moneda forzado a ARS es conceptualmente incorrecto. El resto de las violaciones (`CardsView`, `useServicios`) son coerciones implícitas que, si bien funcionan hoy, son frágiles ante cambios de formato. La regla "pago de tarjeta ≠ gasto" **no se viola** en el código auditado: no existe lógica de pago de resumen de tarjeta en `useServicios` ni `CardsView`.

### Taxonomía (Task 4 — taxonomia-guardian)

La taxonomía está **rota en tres ejes**: (1) la tabla `categorias_maestras` no existe; (2) el campo `macro` nunca se persiste; (3) los formularios defaultean a strings inexistentes en `classificationMap.ts`. Además, `ServicesView` no tiene dropdowns de categoría/concepto, violando la jerarquía completa. La 3-tap rule no se cumple porque no hay persistencia de "último usado". Los tests usan fixtures con strings inválidos, por lo que pasan contra datos ficticios que no representan el dominio real.

### Residuos (Task 5 — inline)

No quedan imports activos de Firestore en `src/`. Los residuos son configuraciones y archivos muertos: `firestore.rules`, `firestore.indexes.json`, sección `firestore` en `firebase.json`, y la dependencia `firebase` en `package.json`. El script `scripts/migrate-to-supabase.sh` es un runbook histórico que puede conservarse como documentación o eliminarse. Las referencias a VPS/Coolify/n8n en `docs/` y `docs/plans/` son contexto histórico válido. El único residuo activo en código/config es `.env.local` con `VITE_API_URL` y variables Firebase.

---

## Recomendaciones

1. **Frenar cualquier feature nueva** hasta resolver los 11 P0. En particular, el bug de concatenación en `Dashboard.tsx` produce datos financieros incorrectos para el usuario final.
2. **Decidir autoridad de tabla:** ¿`movimientos` o `transactions`? Una vez definido, eliminar o renombrar la tabla huérfana, actualizar tipos, hooks y tests.
3. **Crear `categorias_maestras`** y sincronizar con `classificationMap.ts`. Si se decide mantener el mapa solo en frontend, eliminar la referencia en RLS para evitar errores runtime.
4. **Estandarizar vocabularios:** `EstadoPrevisto` debe ser monolingüe (`PENDIENTE`, `RESERVADO`, `PAGADO`). Los check constraints de `moneda` deben incluir las 4 monedas en todas las tablas.
5. **Rotar clave anónima de Supabase inmediatamente** y agregar `.env.*` a `.gitignore`.
6. **Post-fix:** ejecutar `npx depcheck` (si se instala) para confirmar dependencias muertas, y aplicar un pase de lint de colores Tailwind para forzar tokens Editorial Orgánico.
