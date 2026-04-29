# Finanzas 2.0 — Seguimiento del Proyecto

**Propietarios:** Mauro & Agos  
**Creado:** 2026-04-20  
**Última actualización:** 2026-04-28 (v2)  
**Estado general:** ✅ Phase 4 (Migración Supabase) cerrada en `feat/supabase-migration` — 12 commits. Auth real + RLS implementados. Datos migrados a Supabase cloud. n8n/bot Telegram discontinuados. Review integral pre-merge en curso. Pendiente: merge a `main` y handoff a Agos.

> **Branch activa:** `feat/supabase-migration`. Ultimo commit: `b087130`. Backend migrado a Supabase (PostgreSQL + GoTrue Auth). **Supabase cloud es la fuente de verdad de datos** desde 2026-04-28; el PostgreSQL del VPS deja de ser autoritativo. n8n y bot Telegram se discontinúan; la carga de movimientos es exclusivamente vía app web. Deuda D1 (certificado self-signed PostgREST) resuelta implícitamente por la migración.

---

## Visión General

Finanzas 2.0 es una PWA de gestión financiera familiar para Mauro y Agos. Reemplaza el bot de Telegram y la planilla Excel como canales primarios de registro, y unifica la vista transaccional (base caja, PostgreSQL VPS) con proyecciones devengadas. El norte inamovible: responder **"¿Cuánto gastamos en vivir, en deber y en disfrutar?"** en menos de 3 segundos al abrir la app.

Usuarios: Mauro (carga ~85% de los gastos, usuario técnico) y Agos (usuaria no técnica, necesita cargar un gasto en 3 taps o menos).

---

## Estado Actual

**Phase 4 (Migración Supabase) cerrada en rama `feat/supabase-migration`.** La app tiene auth real (email + password vía GoTrue), gating de App detrás de `LoginScreen`, `api.ts` reescrito con headers `apikey + Authorization: Bearer <JWT>` + interceptor 401-refresh, y RLS habilitado con policies compartidas para usuarios autenticados. El bloqueo histórico D1 (certificado self-signed) queda resuelto implícitamente al migrar a Supabase cloud.

**Infraestructura operativa:** Supabase (PostgreSQL + GoTrue + PostgREST) — fuente de verdad desde 2026-04-28. Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Firebase Hosting para deploy estático. VPS ya no es autoritativo; n8n y bot Telegram discontinuados.

**Bloqueos actuales:**
1. **Merge pendiente** — `feat/supabase-migration` aún no fue mergeada a `main`. Review integral en curso (ver sección abajo).
2. TransactionForm usa defaults hardcodeados (no "último usado") — la regla de 3 taps no está desbloqueada. (G2 — pre-existente)
3. Dashboard no muestra agregación por Macro — la pregunta central del producto no se puede responder al abrir la app. (G1 — pre-existente)

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

### Phase 5 — Verificación, Deploy y Handoff a Agos [⏳ Pendiente]

**Objetivo:** App lista para que Agos la use sin fricción. Cerrar gaps críticos, deploy, testing manual.

**Entregables esperados:**

- [x] Datos migrados a Supabase cloud (`scripts/migrate-to-supabase.sh` ejecutado 2026-04-28)
- [ ] Review integral pre-merge con `finanzas-reviewer` — EN CURSO
- [ ] Merge `feat/supabase-migration` → `main`
- [ ] Agregación por Macro en Dashboard (VIVIR/TRABAJAR/DEBER/DISFRUTAR en tiempo real)
- [ ] Defaults "último usado" en TransactionForm (desbloquea regla 3 taps)
- [ ] `useCotizaciones` con fetch a CriptoYa y write-back a `cotizaciones_fx`
- [ ] `AnalisisView` con Recharts (tendencias por Macro, comparativas mensuales)
- [ ] Seed de `medios_pago` con saldos reales
- [ ] Testing manual completo (spec + implementation plan)
- [ ] Deploy a Firebase Hosting (`firebase deploy --only hosting`)
- [ ] Verificación del flujo Agos: 3 taps desde FAB hasta gasto guardado

---

## Gaps Funcionales (Post-Phase 3)

### 🔴 Alto impacto (bloquean la visión central o la experiencia de Agos)

| ID | Gap | Módulo | Detalle |
|----|-----|--------|---------|
| G1 | **Sin resumen por Macro en Dashboard** | Dashboard | El norte del producto es *"¿Cuánto gastamos en vivir, deber y disfrutar?"*. El Dashboard no agrega gastos por Macro con color/tendencia. Agos no puede responder la pregunta central al abrir la app. |
| G2 | **TransactionForm sin defaults "último usado"** | Movimientos | Los defaults son hardcodeados (`HOGAR`, `Vivienda y Vida Diaria`, `Abastecimiento`). La Regla de 3 Taps NO está desbloqueada para Agos. Se necesita persistir último movimiento usado (localStorage o `/movimientos?order=fecha_carga.desc&limit=1`). |
| G3 | **Certificado TLS self-signed en PostgREST** | Infra | `ERR_CERT_AUTHORITY_INVALID` en browsers. Agos no puede usar la app desde su teléfono sin aceptar excepción manual por dispositivo. |

### 🟡 Medio impacto (funcionalidad parcial o degradada)

| ID | Gap | Módulo | Detalle |
|----|-----|--------|---------|
| G4 | **`useCotizaciones` solo lee cache PostgREST** | Cotizaciones FX | No llama a CriptoYa (`/api/dolar`, `/api/brl`). El widget muestra vacío si no hay datos precargados en `cotizaciones_fx`. Falta fetch → write-back → display. |
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
- [ ] **Resumen por Macro en tiempo real** — **G1**

### Cotizaciones FX

- [x] `useCotizaciones.ts` creado (lee de PostgREST cache)
- [x] `CotizacionesView.tsx` mostrando rates desde datos cache
- [x] `CotizacionWidget.tsx` en Dashboard
- [ ] **Fetch a CriptoYa API** (`/api/dolar`, `/api/brl`) — **G4**
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
| D1 | Certificado self-signed en PostgREST | 🔴 Alta | ✅ Resuelto | Migración a Supabase cloud elimina el problema de raíz. |
| D2 |Defaults "último usado" en TransactionForm | 🔴 Alta | Pendiente | La regla de 3 taps para Agos no está desbloqueada. Se necesita localStorage o `GET /movimientos?order=fecha_carga.desc&limit=1`. |
| D3 | Dashboard sin agregación por Macro | 🔴 Alta | Pendiente | La pregunta central ("¿Cuánto gastamos en VIVIR, DEBER, DISFRUTAR?") no se puede responder al abrir la app. |
| D4 | `useCotizaciones` sin fetch a CriptoYa | 🟡 Media | Pendiente | Solo lee de cache PostgREST. Si no hay datos precargados, el widget y la vista muestran vacío. |
| D5 | `AnalisisView` es stub vacío | 🟡 Media | Pendiente | Sin Recharts, sin lazy loading. Deuda significativa para la visión de BI desktop-first. |
| D6 | `saldo` en `medios_pago` = 0 | 🟡 Media | Pendiente | Las columnas existen pero los valores son 0. Balance en Dashboard muestra $0.00. |
| D7 | Motor IA (spec §9) | 🟢 Baja | Futuro | Fuera de alcance v1. Requiere diseño de approach (LLM externo, regex local, híbrido). |
| D8 | Worktree git roto | 🟢 Baja | Contorneable | `.git` del worktree apunta a path inexistente. Operar git desde repo principal. No afecta código. |

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
| DP-3 | **Merge `feat/supabase-migration`** | En curso. Se realiza review integral con `finanzas-reviewer` antes de mergear. |

---

## Próximos Pasos (accionables, priorizados)

### Prioridad P0 — Estabilizar la migración Supabase

1. **Completar review integral pre-merge** con `finanzas-reviewer` — en curso sobre `feat/supabase-migration`.
2. **Merge `feat/supabase-migration` → `main`** — post-review. *~30min.*

### Prioridad P1 — Desbloqueo Agos (frontend)

4. **Implementar agregación por Macro en Dashboard** — Sumar gastos del mes por VIVIR/TRABAJAR/DEBER/DISFRUTAR con color y tendencia. Es la respuesta a la pregunta central del producto. *Frontend ~2h.*
5. **Implementar defaults "último usado" en TransactionForm** — Persistir último movimiento en localStorage y pre-popular al abrir el formulario. Desbloquea la regla de 3 taps. *Frontend ~3h.*

### Prioridad P2 — Funcionalidad completa

6. **Fetch a CriptoYa en `useCotizaciones`** + write-back a `cotizaciones_fx`. *Frontend ~2h.*
7. **`AnalisisView` con Recharts** — tendencias por Macro, comparativas mensuales, lazy loading. *Frontend ~4h.*

### Prioridad P3 — Datos y automatización

8. **Cargar saldos iniciales** en `medios_pago` — SQL manual o UI de edición. *Mauro ~1h.*
9. **n8n workflow** para generación mensual de `movimientos_previstos_mes` desde definiciones.

### Prioridad P4 — Futuro

10. Motor de sugerencia IA (spec §9) — definir approach con Mauro.
11. Reportes exportables, multi-hogar (fuera de alcance v1).

---

## Riesgos y Bloqueos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Dashboard sin Macro → producto no resuelve su pregunta central | Alta | Alto | Implementar agregación por Macro como P1 |
| 3 taps no implementado → Agos necesita taps manuales | Alta | Alto | Defaults "último usado" en TransactionForm como P1 |
| `saldo` en `medios_pago` = 0 muestra balance incorrecto | Media | Medio | Cargar saldos iniciales reales antes de mostrar la app a Agos |
| Token JWT expira sin refresh silencioso proactivo | Baja | Medio | `authStore.hydrate` verifica expiración en cada carga; el interceptor 401 en `api.ts` hace refresh. Riesgo bajo. |

---

## Review Integral Pre-Merge

**Estado: EN CURSO** (2026-04-28)

El agente `finanzas-reviewer` está corriendo sobre `feat/supabase-migration` en paralelo. Esta revisión cubre auth, RLS, API client, y convenciones del proyecto antes del merge a `main`. Los hallazgos se incorporarán en esta sección cuando el review concluya.

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
| Phase 5: Review + merge | TBD | 🔄 | Review integral en curso; merge a main post-review |
| Phase 5: Agregación Macro + 3 taps | TBD | ⏳ | G1 + G2 en Dashboard y TransactionForm |
| Phase 5: Handoff a Agos | TBD | ⏳ | App accesible desde móvil de Agos sin fricción |

---

## Notas del PM

- **Stack confirmado (actualizado):** React 19 + Vite + TypeScript + Tailwind + Supabase (PostgreSQL + GoTrue Auth + PostgREST). Zustand para `authStore` (sesión + refresh) y `uiStore` (navegación). Los hooks de dominio usan `api.ts` directamente.
- **Sin SDK de Supabase:** La migración fue intencional — se usa `fetch` crudo con helpers propios en `src/lib/supabaseAuth.ts` y `src/config/api.ts`. No instalar `@supabase/supabase-js` sin discutir primero.
- **Runbook de migración de datos:** `scripts/migrate-to-supabase.sh` — hace dump schema+data del VPS y prepara comandos psql para aplicar en Supabase. Untracked, requiere decisión (ver DP-1).
- **RLS compartido (DA-1):** La policy `auth_all` en `003_enable_rls.sql` da acceso total a cualquier usuario autenticado. Es la decisión de diseño correcta para un hogar de 2 usuarios (Mauro + Agos). No aplica revisar ni endurecer.
- **Fuera de alcance v1:** Ingresos automáticos, inversiones, reportes exportables, multi-hogar, ingresos del inmueble Brasil.
- **Monedas soportadas:** ARS, USD, USDT. BRL referenciado en spec para unidad Brasil pero no está en el tipo `Currency` — punto a decidir.
- **Spec v1.0** vive en `docs/spec/finanzas_app_spec.md`. El archivo `docs/spec/finanzas_app_contexto_adicional.md` resuelve divergencias entre spec y prototipo UI.