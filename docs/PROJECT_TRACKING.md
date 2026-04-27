# Finanzas 2.0 — Seguimiento del Proyecto

**Propietarios:** Mauro & Agos  
**Creado:** 2026-04-20  
**Última actualización:** 2026-04-27  
**Estado general:** ✅ Phase 3 completada en código — 14 commits en `feat/phase3-editorial-organico`, pendiente merge a `main`. Quedan 3 gaps de alto impacto antes del handoff a Agos.

> **Branch `feat/phase3-editorial-organico`**: 14 commits por delante de `main`. TypeScript 0 errores, 116 tests pasados. Todos los tasks del plan (3.0→3.10) implementados. Ver sección "Gaps funcionales" para lo que falta.

---

## Visión General

Finanzas 2.0 es una PWA de gestión financiera familiar para Mauro y Agos. Reemplaza el bot de Telegram y la planilla Excel como canales primarios de registro, y unifica la vista transaccional (base caja, PostgreSQL VPS) con proyecciones devengadas. El norte inamovible: responder **"¿Cuánto gastamos en vivir, en deber y en disfrutar?"** en menos de 3 segundos al abrir la app.

Usuarios: Mauro (carga ~85% de los gastos, usuario técnico) y Agos (usuaria no técnica, necesita cargar un gasto en 3 taps o menos).

---

## Estado Actual

**Phase 3 implementada en código.** La app tiene tema Editorial Orgánico completo, navegación responsiva (BottomNav + Sidebar), hooks para todos los módulos, y defects resueltos (classification mapping, uiStore default, api.ts lazy-eval). Pendiente de merge a `main`.

**Infraestructura operativa:** PostgREST en VPS vía Coolify/Traefik. `VITE_API_URL` configurado. Firebase Hosting para deploy estático.

**⚠️ Bloqueos para Agos:**
1. Certificado self-signed en PostgREST — Agos no puede acceder desde su móvil sin aceptar excepción manual por dispositivo.
2. TransactionForm usa defaults hardcodeados (no "último usado") — la regla de 3 taps no está desbloqueada.
3. Dashboard no muestra agregación por Macro (VIVIR/TRABAJAR/DEBER/DISFRUTAR) — la pregunta central del producto no se puede responder al abrir la app.

**Deuda técnica resuelta en Phase 3:**
- ✅ `App.tsx` desalineado con spec → corregido (uiStore + Screen type alineado)
- ✅ Estética dark/neon en `App.tsx` → tema Editorial Orgánico aplicado
- ✅ Classification mapping bug (Unidad≠Macro) → fix con `UNIDAD_TO_MACRO`
- ✅ `spent` en presupuestos sin filtro de mes → `useTransactions({ month })` ya filtra
- ✅ Flujo PENDING → PAGADO → dual-write implementado
- ✅ Tailwind JIT dynamic classes → mapeo estático (bgMap/textMap/barMap)

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

### Phase 4 — Verificación, Deploy y Handoff a Agos [⏳ Pendiente]

**Objetivo:** App lista para que Agos la use sin fricción. Cerrar gaps críticos, deploy, testing manual.

**Entregables esperados:**

- [ ] Agregación por Macro en Dashboard (VIVIR/TRABAJAR/DEBER/DISFRUTAR en tiempo real)
- [ ] Defaults "último usado" en TransactionForm (desbloquea regla 3 taps)
- [ ] Certificado TLS válido en PostgREST (Let's Encrypt vía Coolify/Traefik)
- [ ] `useCotizaciones` con fetch a CriptoYa y write-back a `cotizaciones_fx`
- [ ] `AnalisisView` con Recharts (tendencias por Macro, comparativas mensuales)
- [ ] Seed de `medios_pago` con saldos reales
- [ ] Testing manual completo (spec + implementation plan)
- [ ] Deploy a Firebase Hosting (`firebase deploy --only hosting`)
- [ ] Verificación del flujo Agos: 3 taps desde FAB hasta gasto guardado
- [ ] Automatización n8n: generación mensual de `movimientos_previstos_mes`

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
| D1 | Certificado self-signed en PostgREST | 🔴 Alta | Pendiente | Bloquea onboarding de Agos. Requiere cert válido (Let's Encrypt vía Coolify/Traefik). |
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

---

## Próximos Pasos (accionables, priorizados)

### Prioridad P0 — Desbloqueo Agos (antes del handoff)

1. **Resolver certificado TLS** — Let's Encrypt vía Coolify/Traefik. Sin esto, Agos no puede usar la app desde su teléfono. *Responsable: Mauro (devops).*
2. **Implementar agregación por Macro en Dashboard** — Sumar gastos del mes por VIVIR/TRABAJAR/DEBER/DISFRUTAR con color y tendencia. Es la respuesta a la pregunta central del producto. *Frontend ~2h.*
3. **Implementar defaults "último usado" en TransactionForm** — Persistir último movimiento en localStorage y pre-popular al abrir el formulario. Desbloquea la regla de 3 taps. *Frontend ~3h.*

### Prioridad P1 — Funcionalidad completa

4. **Fetch a CriptoYa en `useCotizaciones`** + write-back a `cotizaciones_fx`. *Frontend ~2h.*
5. **`AnalisisView` con Recharts** — tendencias por Macro, comparativas mensuales, lazy loading. *Frontend ~4h.*

### Prioridad P2 — Datos y automatización

6. **Cargar saldos iniciales** en `medios_pago` — SQL manual o UI de edición. *Mauro ~1h.*
7. **Merge `feat/phase3-editorial-organico` → `main`** — una vez resueltos P0 items G1+G2 (o en paralelo si se prefiere).
8. **n8n workflow** para generación mensual de `movimientos_previstos_mes` desde definiciones.

### Prioridad P3 — Futuro

9. Motor de sugerencia IA (spec §9) — definir approach con Mauro.
10. Reportes exportables, multi-hogar (fuera de alcance v1).

---

## Riesgos y Bloqueos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Certificado self-signed bloquea onboarding de Agos | Alta | Alto | Resolver cert válido (Let's Encrypt via Coolify) antes de invitar a Agos |
| Dashboard sin Macro → producto no resuelve su pregunta central | Alta | Alto | Implementar agregación por Macro como P0 |
| 3 taps no implementado → Agos necesita taps manuales | Alta | Alto | Defaults "último usado" en TransactionForm como P0 |
| `saldo` en `medios_pago` = 0 muestra balance incorrecto | Media | Medio | Cargar saldos iniciales reales antes de mostrar la app a Agos |
| Motor IA (spec §9) requiere diseño adicional | Media | Medio | Definir approach con Mauro antes de implementar |
| Worktree git roto puede confundir herramientas | Baja | Bajo | Operar git desde repo principal `/home/mauro/projects/finanzas-app` |

---

## Hitos y Deadlines

| Hito | Fecha objetivo | Estado | Notas |
|------|---------------|--------|-------|
| Phase 0 completada | 2026-04-11 | ✅ | Tipos + taxonomía + API client + migration |
| Phase 1 completada | 2026-04-22 | ✅ | Migración Firestore → PostgREST completa |
| Phase 2 completada | 2026-04-27 | ✅ | Rediseño UI Editorial Orgánico (ejecutado en Phase 3 branch) |
| Phase 3 completada | 2026-04-27 | ✅ | Todos los tasks 3.0→3.10 implementados y con tests |
| Merge Phase 3 → main | 2026-04-28 | ⏳ | Pendiente revisión y resolución de P0 gaps |
| Phase 4: Agregación Macro + 3 taps | 2026-04-30 | ⏳ | G1 + G2 en Dashboard y TransactionForm |
| Phase 4: Cert TLS | 2026-04-30 | ⏳ | Requiere configuración Coolify/Traefik |
| Phase 4: Handoff a Agos | 2026-05-02 | ⏳ | App accesible desde móvil de Agos sin fricción |

---

## Notas del PM

- **Stack confirmado:** React 19 + Vite + TypeScript + Tailwind + PostgREST. Sin Zustand — la arquitectura usa hooks directos sobre `api.ts`. `uiStore` es Zustand pero solo para UI state (activeScreen, modal).
- **Merge strategy:** La branch `feat/phase3-editorial-organico` tiene 14 commits que incluyen Phase 2 + Phase 3. Se recomienda squash-merge o merge con rebase para limpiar el historial antes de mergear a `main`.
- **Worktree git roto:** El `.git` del worktree apunta a `/home/mauro/projects/finanzas-app/.git/worktrees/phase3` que no existe. Operaciones git deben hacerse desde el repo principal `/home/mauro/projects/finanzas-app`. El código está intacto.
- **Fuera de alcance v1:** Ingresos automáticos, inversiones, reportes exportables, multi-hogar, ingresos del inmueble Brasil.
- **Monedas soportadas:** ARS, USD, USDT. BRL referenciado en spec para unidad Brasil pero no está en el tipo `Currency` — punto a decidir.
- **Spec v1.0** vive en `docs/spec/finanzas_app_spec.md`. El archivo `docs/spec/finanzas_app_contexto_adicional.md` resuelve divergencias entre spec y prototipo UI.