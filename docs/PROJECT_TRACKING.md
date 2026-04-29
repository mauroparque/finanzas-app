# Finanzas 2.0 — Seguimiento del Proyecto

**Propietarios:** Mauro & Agos  
**Creado:** 2026-04-20  
**Última actualización:** 2026-04-29 (v5.1 — Phase 5 en progreso, G1 resuelto)  
**Estado general:** ✅ **11 P0 blockers resueltos** (2026-04-29). Ledger integrity restaurada, schema consolidado bajo `movimientos`, taxonomía corregida, auth reforzado, y código limpio (named exports, SSR guards, test fixtures). **P0-11 resuelto:** clave anónica rotada a Publishable Key; variables de entorno limpias. **Phase 5 activa:** feature work desbloqueado. **G1 resuelto:** Dashboard ahora muestra agregación por Macro (VIVIR/TRABAJAR/DEBER/DISFRUTAR).

> **Branch activa:** `feat/supabase-migration`. Ultimo commit: `b087130`. Backend migrado a Supabase (PostgreSQL + GoTrue Auth). **Supabase cloud es la fuente de verdad de datos** desde 2026-04-28; el PostgreSQL del VPS deja de ser autoritativo. n8n y bot Telegram se discontinúan; la carga de movimientos es exclusivamente vía app web. Deuda D1 (certificado self-signed PostgREST) resuelta implícitamente por la migración.
>
> ⚠️ **Auditoría post-Supabase (2026-04-29):** Se identificaron 11 P0 blockers, 30+ P1 issues y 20+ P2 items. Ver sección "Hallazgos de la Auditoría Post-Supabase" para el detalle y la referencia al informe completo.

---

## Visión General

Finanzas 2.0 es una PWA de gestión financiera familiar para Mauro y Agos. Reemplaza el bot de Telegram y la planilla Excel como canales primarios de registro, y unifica la vista transaccional (base caja, PostgreSQL VPS) con proyecciones devengadas. El norte inamovible: responder **"¿Cuánto gastamos en vivir, en deber y en disfrutar?"** en menos de 3 segundos al abrir la app.

Usuarios: Mauro (carga ~85% de los gastos, usuario técnico) y Agos (usuaria no técnica, necesita cargar un gasto en 3 taps o menos).

---

## Estado Actual

**Phase 4 (Migración Supabase) cerrada en rama `feat/supabase-migration`.** La app tiene auth real (email + password vía GoTrue), gating de App detrás de `LoginScreen`, `api.ts` reescrito con headers `apikey + Authorization: Bearer <JWT>` + interceptor 401-refresh, y RLS habilitado con policies compartidas para usuarios autenticados. El bloqueo histórico D1 (certificado self-signed) queda resuelto implícitamente al migrar a Supabase cloud.

**🟢 Auditoría post-Supabase resuelta (2026-04-29):** Todos los 11 P0 blockers y la mayoría de los P1 issues fueron fixeados y mergeados a `main` (PR #8). El repositorio está listo para feature work. Ver informe completo: `docs/technical/2026-04-29-auditoria-post-supabase.md`.

**Infraestructura operativa:** Supabase (PostgreSQL + GoTrue + PostgREST) — fuente de verdad desde 2026-04-28. Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Firebase Hosting para deploy estático. VPS ya no es autoritativo; n8n y bot Telegram discontinuados.

**Bloqueos resueltos (post-auditoría P0):**
1. ✅ **P0-1/2 — Dashboard muestra balances correctos** — `parseFloat` antes de sumar + saldos agrupados por moneda (`formatCurrency(saldo, moneda)`). Commits `15df019`.
2. ✅ **P0-4 — Schema consolidado** — Eliminadas tablas huérfanas (`transactions`, `installment_plans`, `cuotas`, `monthly_income`, `alerts`) vía migration `006`. `movimientos` es la tabla maestra.
3. ✅ **P0-5 — `categorias_maestras` evolucionada** — Migration `004` agrega columna `macro`, actualiza constraint unique, y seedea taxonomía spec v1.0 completa.
4. ✅ **P0-6 — Campo `macro` persistido** — Agregado a `Movimiento` interface, derivado automáticamente de `UNIDAD_TO_MACRO[unidad]` en `useTransactions.addTransaction` y `useServicios.markAsPaid`. Migration `005` agrega columna a DB.
5. ✅ **P0-7/8 — Defaults de taxonomía corregidos** — `TransactionForm` defaultea a `Vivienda / Alquiler`; `ServicesView` tiene dropdowns cascada de categoría/concepto.
6. ✅ **P0-9 — Validación en CardsView** — Indicador visual cuando clasificación no existe en mapa + edición inline con selects cascada.
7. ✅ **P0-11 — Archivos de entorno limpiados + clave rotada** — Eliminadas variables muertas de Firebase/n8n; `.env.production` removido del repo. Clave anónima rotada a Publishable Key en Supabase Dashboard y en `.env.local`.
8. ✅ **P1 fixes mergeados** — Named exports, auth validation (hydrate + runtime), SSR guards, budget hook con parseFloat, 3-tap rule, test fixtures, Modal tokens Editorial Orgánico, timezone fix, apiGetOne 5xx propagation, camelCase form state. Todo en PR #8.

**Merge:** `feat/supabase-migration` y `fix/p1-issues` mergeadas a `main`.

**Deuda cerrada en Phase 4 (Supabase):**
- ✅ D1 — Certificado self-signed → migración a Supabase cloud resuelve el problema de raíz
- ✅ Auth inexistente → auth real email+password con JWT, refresh automático, y persistencia en `localStorage`
- ✅ API sin autenticación → todos los requests ahora llevan `apikey + Authorization: Bearer`
- ✅ RLS desactivado → `003_enable_rls.sql` activa RLS en todas las tablas operativas con policies `auth_all`
- ✅ Bucle de fetch infinito en filtro de fecha → `fix(transactions): stabilize Date filter`

---

## Fases del Proyecto

### Phase 0 — Fundación y migración a Spec v1.0 [✅ Completada — 2026-04-11]

**Objetivo:** Alinear el modelo de datos, la taxonomía y la configuración de infraestructura con la spec v1.0 antes de tocar UI.

**Entregables completados:**

- `src/types/index.ts` reescrito con `Macro`, `Unit`, `Currency`, `QuestionMark`, `InstallmentPlan`, `Cuota`, `MonthlyIncome`, `Alert` — tipos en snake_case alineados con esquema PostgreSQL
- `src/config/classificationMap.ts` migrado de Unit→Category a Macro→Category→Concept (VIVIR 7 cats, TRABAJAR 4, DEBER 2, DISFRUTAR 3)
- `src/config/api.ts` — cliente PostgREST con `apiGet`, `apiPost`, `apiPatch`, `apiDelete` (header `Prefer: return=representation` en writes)
- `supabase/migrations/001_finanzas_rearchitecture.sql` — migration ejecutada en VPS

---

### Phase 1 — Módulo Carga de Gasto + Migración de Hooks [✅ Completada — 2026-04-22]

**Objetivo:** Hacer funcionar el flujo completo de carga de un gasto desde la app, consumiendo el backend real.

**Entregables completados:**

- [x] Migrar `useTransactions.ts` de Firebase a `api.ts` (POST/GET `/movimientos`)
- [x] Crear `useMediosPago.ts`, `useServicios.ts`, `usePresupuestos.ts`
- [x] Actualizar `TransactionForm.tsx` y `Dashboard.tsx` al nuevo esquema PostgREST
- [x] Mergear `feat/phase1-foundation` a `main` — `e087778`
- [x] Firebase completamente removido del código fuente (solo queda como hosting)
- [x] App con cero errores de consola en producción

**Pendiente trasladado:**
- [ ] Implementar lógica "último usado" para defaults de Macro/Categoría/Concepto/Medio de pago
- [ ] Motor de sugerencia IA (spec §9) — fuera de alcance v1

---

### Phase 2 — Rediseño UI + App Shell [✅ Completada — 2026-04-27]

**Objetivo:** Reemplazar la estética dark/neon por el tema "Editorial Orgánico" y alinear la navegación con la spec. Ejecutado dentro de la branch `feat/phase3-editorial-organico`.

**Entregables completados:**

- [x] Tailwind v3 instalado con paleta Editorial Orgánico (terracotta/sage/navy)
- [x] `src/index.css` con directivas Tailwind + tema base stone-50
- [x] `App.tsx`: tema Organizado aplicado — `bg-stone-50`, FAB terracotta, uiStore navigation
- [x] `App.tsx`: tipo `Screen` alineado (`dashboard`, `movimientos`, `tarjetas`, `servicios`, `cotizaciones`, `analisis`)
- [x] BottomNav (mobile) + Sidebar (desktop) — navegación responsiva
- [x] Componentes UI primitivos: `Button`, `Card`, `Badge`, `Input` en `src/components/common/ui/`
- [x] `uiStore` corregido — `activeScreen` default a `'dashboard'`

---

### Phase 3 — Editorial Orgánico UI & Módulos Nuevos [✅ Completada — 2026-04-27]

**Objetivo:** Transformar la app al design system Editorial Orgánico, fix critical bugs, y conectar los tres módulos restantes (Tarjetas, Servicios, Cotizaciones).

**Plan:** `docs/plans/2026-04-22-phase3-editorial-organico.md`

| Task | Entregable | Commit | Estado |
|------|-----------|--------|--------|
| 3.0 | Utils: `cn`, `formatters`, `fx` | `f7ee8de` | ✅ |
| 3.1 | Fix classification: `UNIDAD_TO_MACRO` mapping | `b6c1d3c` | ✅ |
| 3.2 | UI primitives: `Button`, `Card`, `Badge`, `Input` | `8ec6da1` | ✅ |
| 3.3 | Layout: `BottomNav`, `Sidebar`, App Shell refactor | `a591744` | ✅ |
| 3.4 | `TransactionForm` tema Editorial Orgánico | `b28836f` | ✅ |
| 3.5 | Dashboard + `CotizacionWidget` | `49a5aeb` | ✅ |
| 3.6 | Hooks `useCuotasTarjeta` + `usePrestamos` | `9f9ff0c` | ✅ |
| 3.7 | `CardsView` con datos reales (sin mock) | `0952cb8` | ✅ |
| 3.8 | `ServicesView` dual-write PAID | `ab30358` | ✅ |
| 3.9 | Stubs: `MovimientosView`, `AnalisisView`, `CotizacionesView` | `6e1cbf4` | ✅ |
| 3.10 | Cleanup: deprecated types + orphaned store | `e8d7a8a` | ✅ |

**Bugfixes adicionales:**
- `fix(uiStore)`: default `activeScreen` alineado a tipo `Screen` válido — `5f2c52a`
- `fix(api)`: lazy-eval `BASE_URL` para resolver tests con `VITE_API_URL` undefined — `2b0db76`

---

### Phase 4 — Migración a Supabase [✅ Cerrada — 2026-04-28]

**Objetivo:** Migrar backend desde PostgreSQL+PostgREST en VPS con Tailscale a Supabase (cloud), agregando auth real y RLS, resolviendo el bloqueo de acceso de Agos desde su móvil.

**Plan:** `docs/plans/2026-04-27-supabase-migration.md`

| Entregable | Commit | Estado |
|-----------|--------|--------|
| `src/config/supabase.ts` — URL + anon key | `cc7b5fc` | ✅ |
| `src/lib/supabaseAuth.ts` — signIn/refresh/signOut | `aa51dc0` | ✅ |
| `src/store/authStore.ts` — Zustand store con localStorage | `f9be2e9` | ✅ |
| `src/config/api.ts` — headers apikey + Bearer + 401 refresh | `2fcbe5b` | ✅ |
| `src/components/auth/LoginScreen.tsx` | `fc87619` | ✅ |
| `App.tsx` gating + botón logout | `0e6be1d` | ✅ |
| `supabase/migrations/003_enable_rls.sql` | `8117269` | ✅ |
| fix: bucle infinito en filtro de fecha de transactions | `b087130` | ✅ |
| `scripts/migrate-to-supabase.sh` — runbook dump/restore VPS → Supabase | sin commitear | ✅ Ejecutado |

**Corte de datos 2026-04-28:** `scripts/migrate-to-supabase.sh` fue ejecutado. Supabase cloud tiene los datos reales de producción. El script puede commitearse como documentación del runbook o descartarse.

---

### Phase 5 — Verificación, Deploy y Handoff a Agos [🔄 En progreso — Auditoría cerrada, feature work activo]

**Objetivo:** App lista para que Agos la use sin fricción. Cerrar gaps críticos, deploy, testing manual.

**Entregables esperados:**

- [x] Datos migrados a Supabase cloud (`scripts/migrate-to-supabase.sh` ejecutado 2026-04-28)
- [x] Auditoría integral post-Supabase completada (2026-04-29) → informe en `docs/technical/2026-04-29-auditoria-post-supabase.md`
- [x] Resolver 11 P0 blockers identificados en la auditoría (todos fixeados y mergeados)
- [x] Review integral pre-merge con `finanzas-reviewer` — completado como parte de la auditoría
- [x] Merge `feat/supabase-migration` → `main` — completado
- [x] Agregación por Macro en Dashboard (VIVIR/TRABAJAR/DEBER/DISFRUTAR en tiempo real) — **G1** — commit `318d7c7`
- [x] Defaults "último usado" en TransactionForm (desbloquea regla 3 taps) — commit `3696f08`
- [x] `useCotizaciones` con fetch a CriptoYa y write-back a `cotizaciones_fx` — **G4** — commit `becec49`
- [ ] `AnalisisView` con Recharts (tendencias por Macro, comparativas mensuales) — **G5**
- [ ] Seed de `medios_pago` con saldos reales — **G6**
- [ ] Testing manual completo (spec + implementation plan)
- [ ] Deploy a Firebase Hosting (`firebase deploy --only hosting`)
- [ ] Verificación del flujo Agos: 3 taps desde FAB hasta gasto guardado

---

## Hallazgos de la Auditoría Post-Supabase (2026-04-29)

> **Informe completo:** `docs/technical/2026-04-29-auditoria-post-supabase.md`
> **Metodología:** 4 auditorías especializadas en paralelo (arquitectura, schema/API, FX/moneda, taxonomía) + inspección de residuos + consolidación.
> **Estado:** ✅ **RESUELTA** — 11 P0 blockers y ~25 P1 issues fixeados y mergeados a `main` (PR #8). Restan ~5 P1 y 20+ P2 en backlog.

### P0 — Bloqueantes (resolver antes de cualquier feature nueva)

| ID | Hallazgo | Archivo | Detalle |
|----|----------|---------|---------|
| P0-1 | **String concatenation en balance total** | `Dashboard.tsx:19` | `accounts.reduce` concatena strings de `saldo` (Postgres `numeric`) en lugar de sumar. Produce cifras financieras incorrectas. |
| P0-2 | **Total multi-moneda forzado a ARS** | `Dashboard.tsx:98-99` | Suma saldos ARS+USD+USDT+BRL sin conversión y muestra como ARS. |
| P0-3 | **`formatCurrency` default ARS** | `formatters.ts:21` | `currency: string = 'ARS'` viola la regla "Never assume ARS". |
| P0-4 | **Schema bifurcado: `movimientos` vs `transactions`** | Migrations 001/002 | La 002 creó tablas huérfanas (`transactions`, `installment_plans`, etc.) sin RLS ni uso en el frontend. |
| P0-5 | **Tabla `categorias_maestras` no existe** | `003_enable_rls.sql:13` | Referenciada en RLS pero nunca creada. `classificationMap.ts` es el único source of truth. |
| P0-6 | **Campo `macro` no se persiste** | `types/index.ts:40-63` | `Movimiento` no incluye `macro`; ningún insert lo envía a la DB. |
| P0-7 | **Defaults inválidos en TransactionForm** | `TransactionForm.tsx:26-27` | `'Vivienda y Vida Diaria'` y `'Abastecimiento'` no existen en `classificationMap.ts`. |
| P0-8 | **Defaults inválidos en ServicesView** | `ServicesView.tsx:26-27` | Strings de categoría inexistentes en el mapa. |
| P0-9 | **Sin validación de clasificación en CardsView** | `CardsView.tsx` | No hay formulario con dropdowns cascada para `CuotaTarjeta`. |
| P0-10 | **Tablas de migration 002 sin RLS** | `002_spec_v1_migration.sql` | `transactions`, `installment_plans`, `cuotas`, `monthly_income`, `alerts` sin políticas de seguridad. |
| P0-11 | **Clave anónima de Supabase en git** | `.env.local`, `.env.production` | `VITE_SUPABASE_ANON_KEY` commiteada; además `.env.local` contiene `VITE_API_URL` del VPS y variables Firebase muertas. |

### P1 — Importantes (siguiente milestone, resumidos)

**Arquitectura (9 items):** Default exports en lugar de named, lógica de presupuestos en componente, `authStore` sin type guard en hydrate, `uiStore` con `window.innerWidth` sin SSR check, colores no tokenizados, `apiGetOne` captura errores silenciosamente, `as any` en handler de moneda, `parseFloat` faltante en varios archivos.

**Schema/API (10 items):** CHECK constraints sin `USDT`/`BRL`, `EstadoPrevisto` dual (`PAID` vs `PAGADO`), falta índice compuesto, filtro de mes con desfase timezone, guard de producción solo en `DEV`, sesión expirada descartada sin refresh, respuestas auth sin validación runtime, `BRASIL → 'DEBER'` vs `classificationMap` inconsistente.

**FX/Currency (4 items):** Budget arithmetic sin `parseFloat`, budget spent sin filtro de moneda, `markAsPaid` envía monto como string, `CardsView` con operaciones sin `parseFloat`.

**Taxonomía (3 items):** ServicesView sin dropdowns cascada, TransactionForm sin persistir "último usado" (3-tap rule), fixtures de tests con strings inválidos.

**Residuos (4 items):** Sección `firestore` en `firebase.json`, archivos `firestore.rules`/`firestore.indexes.json` muertos, `firebase` en `dependencies`, script `migrate-to-supabase.sh` sin decidir destino.

### P2 — Nice to have (backlog)

20+ items de consistencia de UI (tokens de color, radius, barrel files, HTML raw en lugar de primitivas), seguridad (`auth_all` permisivo, validación runtime), FX (`parseFloat` faltante, hardcoded `'ARS'`, `DISTINCT ON`), y taxonomía (comentarios obsoletos, array hardcoded de monedas). Ver informe completo para detalle.

### Recomendaciones de la auditoría

1. **Frenar feature work** hasta resolver los 11 P0. El bug de concatenación en `Dashboard.tsx` produce datos financieros incorrectos.
2. **Decidir autoridad de tabla:** ¿`movimientos` o `transactions`? Eliminar o renombrar la huérfana.
3. **Crear `categorias_maestras`** y sincronizar con `classificationMap.ts`, o eliminar la referencia en RLS.
4. **Estandarizar vocabularios:** `EstadoPrevisto` monolingüe; CHECK constraints con 4 monedas en todas las tablas.
5. **Rotar clave anónima** de Supabase y agregar `.env.*` a `.gitignore`.
6. **Post-fix:** depcheck para dependencias muertas, lint de colores Tailwind para tokens Editorial Orgánico.

---

## Gaps Funcionales (Post-Phase 3)

### 🔴 Alto impacto (bloquean la visión central o la experiencia de Agos)

| ID | Gap | Módulo | Detalle |
|----|-----|--------|---------|
| ~~G1~~ | ~~**Sin resumen por Macro en Dashboard**~~ | ~~Dashboard~~ | ✅ **Resuelto** (2026-04-29) — Sección "¿En qué gastamos?" agregada con cards de 2x2 (VIVIR sage, TRABAJAR navy, DEBER amber, DISFRUTAR terracotta). Agrega `transactions` filtradas por mes donde `tipo === 'gasto'` usando campo `macro`. Commit `318d7c7`. |
| G2 | **TransactionForm sin defaults "último usado"** | Movimientos | Los defaults son hardcodeados (`HOGAR`, `Vivienda y Vida Diaria`, `Abastecimiento`). La Regla de 3 Taps NO está desbloqueada para Agos. Se necesita persistir último movimiento usado (localStorage o `/movimientos?order=fecha_carga.desc&limit=1`). |
| G3 | **Certificado TLS self-signed en PostgREST** | Infra | `ERR_CERT_AUTHORITY_INVALID` en browsers. Agos no puede usar la app desde su teléfono sin aceptar excepción manual por dispositivo. |

### 🟡 Medio impacto (funcionalidad parcial o degradada)

| ID | Gap | Módulo | Detalle |
|----|-----|--------|---------|
| ~~G4~~ | ~~**`useCotizaciones` solo lee cache PostgREST**~~ | ~~Cotizaciones FX~~ | ✅ **Resuelto** (2026-04-29) — `useCotizaciones` ahora hace fetch paralelo a `https://criptoya.com/api/dolar` y `/api/brl`, parsea `ask`/`bid`/`time` a `CotizacionFX`, hace write-back fire-and-forget a `cotizaciones_fx` vía `apiPost`, y mergea + deduplica por `par`+`tipo`. Commit `becec49`. |
| G5 | **`AnalisisView` es stub vacío** | Análisis | Muestra *"Vista de análisis — próximamente"*. Sin Recharts, sin lazy loading, sin tendencias. Era esperado como stub, pero es deuda significativa para la visión de BI desktop-first. |
| G6 | **`saldo` en `medios_pago` = 0 en la DB** | Datos | Las columnas existen pero los valores son 0. El Dashboard muestra balance $0.00 hasta que se carguen saldos iniciales. |

### 🟢 Bajo impacto (para iteraciones futuras)

| ID | Gap | Módulo | Detalle |
|----|-----|--------|---------|
| G7 | **Motor de sugerencia IA** (spec §9) | Movimientos | No implementado. Fuera de alcance v1, registrado como deuda. |
| G8 | **CotizacionesView sin escritura en cache** | Cotizaciones FX | Lee de PostgREST pero no escribe. La semilla de `cotizaciones_fx` tendría que venir de n8n o botón manual. |

---

## Checklist por Módulo

### Movimientos (carga de gastos)

- [x] Tipos de dominio definidos (`Movimiento`, `Macro`, `Unit`, `Currency`, `QuestionMark`)
- [x] Taxonomía completa en `classificationMap.ts` con `UNIDAD_TO_MACRO` mapping
- [x] Cliente API (`api.ts`) — PostgREST con `apiGet/apiPost/apiPatch/apiDelete`
- [x] Hook `useTransactions.ts` migrado a PostgREST con filtro por mes
- [x] `TransactionForm.tsx` con tema Editorial Orgánico
- [x] Cascading dropdowns funcionando (fix classification mapping)
- [ ] **Regla 3 taps implementada** (defaults al último usado) — **G2**
- [ ] Motor sugerencia IA — **G7** (fuera de alcance v1)

### Tarjetas y Préstamos

- [x] Tipos definidos (`CuotaTarjeta`, `Prestamo`, `InstallmentType`, `CuotaStatus`)
- [x] Migration SQL para tablas `cuotas_tarjeta` y `prestamos` (001)
- [x] `useCuotasTarjeta.ts` con PostgREST + tests
- [x] `usePrestamos.ts` con PostgREST + tests
- [x] `CardsView.tsx` conectado a datos reales, tema Editorial Orgánico, sin mock data

### Servicios (checklist mensual)

- [x] Tablas `servicios_definicion` y `movimientos_previstos_mes` ejecutadas en VPS
- [x] `useServicios.ts` creado y conectado a PostgREST
- [x] `ServicesView.tsx` mostrando servicios del mes desde PostgreSQL
- [x] **Flujo PENDING → PAGADO (dual-write)**: actualiza `movimientos_previstos_mes` + crea `movimiento`

### Dashboard

- [x] Balance de medios de pago desde PostgreSQL (`useMediosPago`)
- [x] Presupuestos con cálculo client-side de `spent` desde PostgreSQL (con filtro de mes)
- [x] Vencimientos de servicios del mes desde PostgreSQL
- [x] Widget FX (Cotizaciones) integrado en Dashboard
- [x] Diseño "Editorial Orgánico" aplicado
- [x] **Resumen por Macro en tiempo real** — **G1** — commit `318d7c7`

### Cotizaciones FX

- [x] `useCotizaciones.ts` creado (lee de PostgREST cache)
- [x] `CotizacionesView.tsx` mostrando rates desde datos cache
- [x] `CotizacionWidget.tsx` en Dashboard
- [x] **Fetch a CriptoYa API** (`/api/dolar`, `/api/brl`) — **G4** — commit `becec49`
- [ ] **Write-back a `cotizaciones_fx`** — **G8**

### Análisis

- [ ] `AnalisisView.tsx` con Recharts — **G5**
- [ ] Lazy loading implementado (`React.lazy`)
- [ ] Al menos una vista de tendencias por Macro

### UI / Design System

- [x] Tailwind v3 con paleta Editorial Orgánico (terracotta/sage/navy)
- [x] Componentes primitivos: `Button`, `Card`, `Badge`, `Input`
- [x] Layout: `BottomNav` (mobile) + `Sidebar` (desktop)
- [x] App Shell refactorizado: `uiStore` navigation, `bg-stone-50`, FAB terracotta

### Utilidades

- [x] `src/utils/cn.ts` — composición de clases
- [x] `src/utils/formatters.ts` — `formatCurrency`, `formatDate`, `formatNumber`
- [x] `src/utils/fx.ts` — `convertAmount`, `getLatestRate`, `cotizacionesToDisplay`

---

## Deuda Técnica Conocida

| ID | Item | Severidad | Estado | Detalle |
|----|------|-----------|--------|---------|
| ~~D1~~ | ~~Certificado self-signed en PostgREST~~ | 🔴 Alta | ✅ Resuelto | Migración a Supabase cloud elimina el problema de raíz. |
| ~~D2~~ | ~~Defaults "último usado" en TransactionForm~~ | ~~🔴 Alta~~ | ✅ **Resuelto** | `3696f08` — persistencia en `localStorage` con `LAST_USED_KEY`. Defaults de unidad/categoría/concepto pre-poblados desde último gasto guardado. |
| D3 | Dashboard sin agregación por Macro | 🔴 Alta | Pendiente | La pregunta central ("¿Cuánto gastamos en VIVIR, DEBER, DISFRUTAR?") no se puede responder al abrir la app. Agrávado por P0-1/P0-2 (balances incorrectos). |
| D4 | `useCotizaciones` sin fetch a CriptoYa | 🟡 Media | Pendiente | Solo lee de cache PostgREST. Si no hay datos precargados, el widget y la vista muestran vacío. |
| D5 | `AnalisisView` es stub vacío | 🟡 Media | Pendiente | Sin Recharts, sin lazy loading. Deuda significativa para la visión de BI desktop-first. |
| D6 | `saldo` en `medios_pago` = 0 | 🟡 Media | Pendiente | Las columnas existen pero los valores son 0. Balance en Dashboard muestra $0.00. |
| D7 | Motor IA (spec §9) | 🟢 Baja | Futuro | Fuera de alcance v1. Requiere diseño de approach (LLM externo, regex local, híbrido). |
| D8 | Worktree git roto | 🟢 Baja | Contorneable | `.git` del worktree apunta a path inexistente. Operar git desde repo principal. No afecta código. |
| D9 | **P0-1: String concatenation en balances** | ✅ Resuelto | `15df019` | `parseFloat(String(acc.saldo))` antes de sumar. |
| D10 | **P0-2: Total multi-moneda sin conversión** | ✅ Resuelto | `15df019` | Saldos agrupados por moneda en Dashboard. |
| D11 | **P0-3: `formatCurrency` default ARS** | ✅ Resuelto | `42b449d` | Default eliminado; currency es parámetro obligatorio. |
| D12 | **P0-4: Schema bifurcado** | ✅ Resuelto | `be1c64b` | Tablas huérfanas eliminadas (migration `006`). `movimientos` es autoritativa. |
| D13 | **P0-5: `categorias_maestras` inexistente** | ✅ Resuelto | `be1c64b` | Migration `004` evoluciona tabla con macro + seed spec v1.0. |
| D14 | **P0-6: `macro` no se persiste** | ✅ Resuelto | `be1c64b` | Campo agregado a tipo, hooks y DB (migration `005`). |
| D15 | **P0-7/8: Defaults de taxonomía inválidos** | ✅ Resuelto | `abb615d`, `a440c22` | Defaults corregidos + dropdowns cascada en ServicesView. |
| D16 | **P0-9: CardsView sin validación de clasificación** | ✅ Resuelto | `2135c80` | Validación visual + edición inline con selects cascada. |
| D17 | **P0-10: Tablas migration 002 sin RLS** | ✅ Resuelto | `be1c64b` | Tablas eliminadas (migration `006`). Surface area cerrada. |
| ~~D18~~ | ~~**P0-11: Clave anónima de Supabase en git**~~ | ~~🔴 Alta~~ | ✅ **Resuelto** | `f5d08e0` + rotación manual. Clave anónima rotada a Publishable Key en Supabase Dashboard; `.env.local` actualizado. `.env.production` eliminado del repo. |

**Deuda cerrada en Phase 3:**
- ~~`App.tsx` desalineado con spec~~ → corregido (Screen type alineado, uiStore conectado)
- ~~Estética dark/neon~~ → tema Editorial Orgánico aplicado
- ~~Classification mapping bug~~ → `UNIDAD_TO_MACRO` fix con tests
- ~~`spent` en presupuestos sin filtro de mes~~ → `useTransactions({ month })` ya filtra
- ~~Flujo PENDING → PAGADO~~ → dual-write implementado (`markAsPaid`)
- ~~Tailwind JIT dynamic classes~~ → mapeo estático `bgMap/textMap/barMap`

**Deuda cerrada en Phase 4 (Supabase):**
- ~~D1 — Certificado self-signed~~ → migración a Supabase cloud resuelve de raíz
- ~~Auth inexistente~~ → auth real email+password, JWT con refresh automático
- ~~API sin autenticación~~ → todos los requests llevan `apikey + Authorization`
- ~~RLS desactivado~~ → `003_enable_rls.sql` con policies `auth_all` en tablas operativas
- ~~Bucle de fetch infinito en filtro fecha~~ → fix estabilizando la instancia Date

---

## Decisiones Tomadas (antes Pendientes)

| # | Decisión | Resolución |
|---|----------|-----------|
| DP-1 | **Migración de datos VPS → Supabase** | Resuelta. Script ejecutado el 2026-04-28. Supabase cloud es la fuente de verdad. El script puede commitearse como runbook o descartarse. |
| DP-2 | **n8n y bot Telegram** | Resuelto por descarte. Se discontinúan. La carga de movimientos será exclusivamente vía app web. Ver Backlog Técnico para el ítem de generación mensual de `movimientos_previstos_mes`. |
| DP-3 | **Merge `feat/supabase-migration`** | ⚠️ En curso. Review integral completado como parte de auditoría post-Supabase (2026-04-29). Se identificaron 11 P0 blockers. Decision pendiente: resolver P0 antes o después de merge. |

---

## Próximos Pasos (accionables, priorizados)

### Prioridad P0 — Resolver blockers de la auditoría (ANTES de feature work)

1. **P0-1/P0-2: Fix balances en Dashboard** — `parseFloat(String(acc.saldo))` en reduce; agrupar por moneda o convertir vía FX antes de sumar. *~30min.*
2. **P0-3: Hacer `currency` obligatorio en `formatCurrency`** — Eliminar default `'ARS'`. Ajustar callers. *~30min.*
3. **P0-4: Consolidar schema bifurcado** — Decidir si `movimientos` o `transactions` es la tabla autoritativa. Eliminar o renombrar la huérfana, actualizar tipos/hooks. *~2h.*
4. **P0-5: Resolver `categorias_maestras`** — Crear y poblar desde `classificationMap.ts`, o eliminar referencia en RLS. *~1h.*
5. **P0-6: Agregar campo `macro` a `Movimiento`** — Agregar `macro: Macro` al tipo, derivar de `UNIDAD_TO_MACRO` en el hook de insert. *~1h.*
6. **P0-7/8: Corregir defaults de taxonomía** — Reemplazar strings inexistentes por valores válidos del mapa en TransactionForm y ServicesView. *~30min.*
7. **P0-9: Agregar formulario con dropdowns cascada en CardsView** — O, si no es prioritario, documentar como deuda conocida. *~2h.*
8. **P0-10: Agregar RLS a tablas de migration 002** — O eliminar tablas si se decide que `movimientos` es la única autoritativa (ver P0-4). *~30min.*
9. **P0-11: Rotar clave anónima + `.gitignore`** — Rotar `VITE_SUPABASE_ANON_KEY`, agregar `.env.*` a `.gitignore`, limpiar variables obsoletas. *~30min.*

### Prioridad P1 — Post-P0, antes de merge

10. **Decidir estrategia de merge** — Resolver P0 en `feat/supabase-migration` antes de merge, o mergear primero con P0 debt e iterar en `main`.
11. **Merge `feat/supabase-migration` → `main`** — Post-resolución de P0 (o con plan de mitigación).

### Prioridad P1 — Desbloqueo Agos (frontend)

12. **Implementar agregación por Macro en Dashboard** — Sumar gastos del mes por VIVIR/TRABAJAR/DEBER/DISFRUTAR con color y tendencia. Depende de P0-1/P0-2/P0-6. *Frontend ~2h.*
13. **Implementar defaults "último usado" en TransactionForm** — Persistir último movimiento en localStorage y pre-popular. Depende de P0-7. *Frontend ~3h.*

### Prioridad P2 — Funcionalidad completa

14. **Fetch a CriptoYa en `useCotizaciones`** + write-back a `cotizaciones_fx`. *Frontend ~2h.*
15. **`AnalisisView` con Recharts** — tendencias por Macro, comparativas mensuales, lazy loading. *Frontend ~4h.*

### Prioridad P3 — Datos y automatización

16. **Cargar saldos iniciales** en `medios_pago` — SQL manual o UI de edición. *Mauro ~1h.*
17. **n8n workflow** para generación mensual de `movimientos_previstos_mes` desde definiciones.

### Prioridad P4 — Futuro

18. Motor de sugerencia IA (spec §9) — definir approach con Mauro.
19. Reportes exportables, multi-hogar (fuera de alcance v1).

---

## Riesgos y Bloqueos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| ⚠️ **Dashboard muestra datos financieros incorrectos** (P0-1/P0-2) | Confirmado | Crítico | Fix inmediato: `parseFloat` + agrupar por moneda antes de sumar |
| ⚠️ **Schema bifurcado** — frontend y DB desalineados | Confirmado | Alto | Decidir tabla autoritativa, eliminar/renombrar huérfana (P0-4) |
| ⚠️ **Clave anónima de Supabase expuesta en git** | Confirmado | Alto | Rotar clave, agregar `.env.*` a `.gitignore` (P0-11) |
| Dashboard sin Macro → producto no resuelve su pregunta central | Alta | Alto | Implementar agregación por Macro como P1 (post-P0) |
| 3 taps no implementado → Agos necesita taps manuales | Alta | Alto | Defaults "último usado" en TransactionForm como P1 (post-P0) |
| `saldo` en `medios_pago` = 0 muestra balance incorrecto | Media | Medio | Cargar saldos iniciales reales antes de mostrar la app a Agos |
| Taxonomía rota — defaults inválidos, `macro` no persistido | Confirmado | Alto | P0-6, P0-7, P0-8: corregir antes de cualquier carga de datos |
| Token JWT expira sin refresh silencioso proactivo | Baja | Medio | `authStore.hydrate` verifica expiración; interceptor 401 hace refresh |

---

## Review Integral Pre-Merge

**Estado: COMPLETADO** (2026-04-29)

La auditoría integral post-Supabase se completó el 2026-04-29 con 4 sub-auditorías especializadas en paralelo (arquitectura, schema/API, FX/moneda, taxonomía) más inspección de residuos. Resultado: **11 P0 blockers**, 30+ P1 issues, 20+ P2 items.

**Informe completo:** `docs/technical/2026-04-29-auditoria-post-supabase.md`

**Hallazgos críticos resumen:**
- 🔴 `Dashboard.tsx` concatena strings en lugar de sumar saldos → datos financieros incorrectos
- 🔴 Schema bifurcado (`movimientos` vs `transactions`) — frontend y DB desalineados
- 🔴 `categorias_maestras` referenciada en RLS pero inexistente
- 🔴 Campo `macro` no se persiste — jerarquía de clasificación incompleta
- 🔴 Defaults de taxonomía inválidos en TransactionForm y ServicesView
- 🔴 5 tablas sin RLS en migration 002
- 🔴 Clave anónima de Supabase en git

**Decisión pendiente:** Resolver P0 antes del merge a `main` o mergear con P0 debt documentado e iterar.

---

## Backlog Técnico

Ítems que no pertenecen al ciclo cerrado (Phase 4) ni al scope de Phase 5, pero deben resolverse antes o después del handoff a Agos.

| ID | Item | Prioridad | Contexto |
|----|------|-----------|---------|
| BT-1 | **Generación mensual de `movimientos_previstos_mes`** | Media | Con n8n discontinuado, ya no hay workflow que genere los previstos al primer día de cada mes. Opciones: (a) `pg_cron` en Supabase, (b) Edge Function de Supabase disparada por schedule, (c) trigger client-side al primer login del mes. Decidir approach antes de Phase 6. |
| ~~BT-2~~ | ~~Actualizar CLAUDE.md — referencias a n8n~~ | ~~Baja~~ | ✅ **Resuelto** (2026-04-29). CLAUDE.md reescrito en formato conciso. Referencias a n8n eliminadas; backlog documentado en PROJECT_TRACKING.md. |

---

## Decisiones de Diseño Aceptadas

| # | Decisión | Justificación |
|---|----------|--------------|
| DA-1 | **RLS `auth_all` — acceso total a cualquier usuario autenticado** | La app es de uso familiar exclusivo (Mauro + Agos). No hay terceros. La policy compartida es la correcta para este contexto y no requiere endurecimiento por `user_id` o `household_id`. |

---

## Hitos y Deadlines

| Hito | Fecha objetivo | Estado | Notas |
|------|---------------|--------|-------|
| Phase 0 completada | 2026-04-11 | ✅ | Tipos + taxonomía + API client + migration |
| Phase 1 completada | 2026-04-22 | ✅ | Migración Firestore → PostgREST completa |
| Phase 2 completada | 2026-04-27 | ✅ | Rediseño UI Editorial Orgánico (ejecutado en Phase 3 branch) |
| Phase 3 completada | 2026-04-27 | ✅ | Todos los tasks 3.0→3.10 implementados y con tests |
| Merge Phase 3 → main | 2026-04-27 | ✅ | Completado (`6d113d8`). Branch `feat/phase4-gaps-p0` creada. |
| Phase 4: Migración Supabase | 2026-04-28 | ✅ | Auth + RLS + cliente API reescrito. 12 commits en `feat/supabase-migration`. |
| Auditoría post-Supabase | 2026-04-29 | ✅ | 11 P0 blockers, 30+ P1, 20+ P2 identificados. Informe: `docs/technical/2026-04-29-auditoria-post-supabase.md` |
| Phase 5: Resolver P0 blockers | TBD | ⚠️ | 11 P0 de la auditoría deben resolverse antes de feature work |
| Phase 5: Merge → main | TBD | ⏳ | Post-resolución de P0 (o con plan de mitigación) |
| Phase 5: Agregación Macro + 3 taps | TBD | ⏳ | G1 + G2 en Dashboard y TransactionForm (post-P0) |
| Phase 5: Handoff a Agos | TBD | ⏳ | App accesible desde móvil de Agos sin fricción |

---

## Notas del PM

- **Stack confirmado (actualizado):** React 19 + Vite + TypeScript + Tailwind + Supabase (PostgreSQL + GoTrue Auth + PostgREST). Zustand para `authStore` (sesión + refresh) y `uiStore` (navegación). Los hooks de dominio usan `api.ts` directamente.
- **Sin SDK de Supabase:** La migración fue intencional — se usa `fetch` crudo con helpers propios en `src/lib/supabaseAuth.ts` y `src/config/api.ts`. No instalar `@supabase/supabase-js` sin discutir primero.
- **Runbook de migración de datos:** `scripts/migrate-to-supabase.sh` — hace dump schema+data del VPS y prepara comandos psql para aplicar en Supabase. Untracked, requiere decisión (ver DP-1).
- **RLS compartido (DA-1):** La policy `auth_all` en `003_enable_rls.sql` da acceso total a cualquier usuario autenticado. Es la decisión de diseño correcta para un hogar de 2 usuarios (Mauro + Agos). No aplica revisar ni endurecer.
- **⚠️ Auditoría post-Supabase (2026-04-29):** La auditoría integral reveló 11 P0 blockers. El más grave es P0-1/P0-2: `Dashboard.tsx` concatena strings de `saldo` en lugar de sumarlos, produciendo cifras financieras incorrectas. También se detectó schema bifurcado, taxonomía rota, y clave anónima expuesta. Recomendación de la auditoría: frenar feature work hasta resolver P0. Ver `docs/technical/2026-04-29-auditoria-post-supabase.md`.
- **Fuera de alcance v1:** Ingresos automáticos, inversiones, reportes exportables, multi-hogar, ingresos del inmueble Brasil.
- **Monedas soportadas:** ARS, USD, USDT. BRL referenciado en spec para unidad Brasil pero no está en el tipo `Currency` — punto a decidir. Auditoría P1-SCH-1/SCH-2 confirma que CHECK constraints no incluyen USDT/BRL consistentemente.
- **Spec v1.0** vive en `docs/spec/finanzas_app_spec.md`. El archivo `docs/spec/finanzas_app_contexto_adicional.md` resuelve divergencias entre spec y prototipo UI.