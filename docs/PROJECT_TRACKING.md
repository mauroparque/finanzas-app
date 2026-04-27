# Finanzas 2.0 — Seguimiento del Proyecto

**Propietarios:** Mauro & Agos  
**Creado:** 2026-04-20  
**Última actualización:** 2026-04-27
**Estado general:** Phase 2 completada — UI Editorial Orgánico mergeada a `main` (PR #4 + merge local 2026-04-27). Divergencia local/remoto resuelta.

> Phase 0, 1 y 2 cerradas. `main` tiene la app con tema Editorial Orgánico, app shell responsive, y flujo PENDING→PAGADO en servicios. Próximo: Phase 3 — Cotizaciones FX + Análisis + defaults "último usado".

---

## Visión General

Finanzas 2.0 es una PWA de gestión financiera familiar para Mauro y Agos. Reemplaza el bot de Telegram y la planilla Excel como canales primarios de registro, y unifica la vista transaccional (base caja, PostgreSQL VPS) con proyecciones devengadas. El norte inamovible: responder "¿Cuánto gastamos en vivir, en deber y en disfrutar?" en menos de 3 segundos al abrir la app.

Usuarios: Mauro (carga ~85% de los gastos, usuario técnico) y Agos (usuaria no técnica, necesita cargar un gasto en 3 taps o menos).

---

## Estado Actual

**Phase 1 completada.** La migración de Firestore a PostgREST está terminada. La app no tiene errores de consola. El backend (PostgREST en VPS via Tailscale) responde correctamente. Firebase quedó exclusivamente como hosting estático.

**Infraestructura operativa:** Tailscale instalado en VPS (`n8n.tail089052.ts.net`). PostgREST desplegado en Coolify como servicio Docker, conectado a la red `coolify` (Traefik como TLS terminator). `VITE_API_URL` configurado y funcional. Rol `web_anon` creado en PostgreSQL con GRANTs a todas las tablas.

**Phase 2 completada.** Tema "Editorial Orgánico" aplicado en toda la UI. App shell responsive con BottomNav + Sidebar. Dashboard, CardsView y ServicesView conectados a datos reales. Flujo PENDING→PAGADO operativo.

**Deuda técnica activa:** (1) Certificado self-signed en PostgREST — browsers requieren aceptar excepción manual por dispositivo. (2) `saldo` en `medios_pago` son todos 0 — necesitan datos reales. (3) Clasificación macro en Dashboard usa keywords — `Movimiento` no tiene campo `macro` en DB.

---

## Fases del Proyecto

### Phase 0 — Fundación y migración a Spec v1.0 [Completada — 2026-04-11]

**Objetivo:** Alinear el modelo de datos, la taxonomía y la configuración de infraestructura con la spec v1.0 antes de tocar UI.

**Entregables completados:**

- `src/types/index.ts` reescrito con `Macro`, `Unit`, `Currency`, `QuestionMark`, `InstallmentPlan`, `Cuota`, `MonthlyIncome`, `Alert` — tipos en snake_case alineados con esquema PostgreSQL
- `src/config/classificationMap.ts` migrado de Unit→Category a Macro→Category→Concept (VIVIR 7 cats, TRABAJAR 4, DEBER 2, DISFRUTAR 3)
- `src/config/api.ts` — cliente PostgREST con `apiGet`, `apiPost`, `apiPatch`, `apiDelete` (header `Prefer: return=representation` en writes)
- `supabase/migrations/001_finanzas_rearchitecture.sql` — migration lista (173 líneas; requiere ejecución manual en VPS)

**Nota:** El proyecto **no usa Zustand**. Los stores `transactionStore.ts` / `uiStore.ts` que el commit Phase 0 original registró fueron eliminados en `feat/phase1-foundation`. La arquitectura real usa hooks directos sobre `api.ts`, sin capa de store intermedia.

---

### Phase 1 — Módulo Carga de Gasto + Migración de Hooks [Completada — 2026-04-22]

**Objetivo:** Hacer funcionar el flujo completo de carga de un gasto desde la app, consumiendo el backend real. Es la primera funcionalidad que Agos puede usar.

**Regla inamovible:** La carga debe completarse en 3 taps o menos desde el FAB.

**Entregables completados:**

- [x] Migrar `useTransactions.ts` de Firebase a `api.ts` (POST/GET `/movimientos`) — `e80beef`
- [x] Crear `useMediosPago.ts` reemplazando `useAccounts.ts` (GET `/medios_pago`, 70 líneas) — `e80beef`
- [x] Actualizar `TransactionForm.tsx` al nuevo esquema PostgREST — `e80beef`
- [x] Actualizar `Dashboard.tsx` para usar `useMediosPago` + `useServicios` + `usePresupuestos`
- [x] Mergear `feat/phase1-foundation` a `main` — `e087778`
- [x] Ejecutar `001_finanzas_rearchitecture.sql` en VPS y verificar endpoints
- [x] Variable de entorno `VITE_API_URL` apuntando al backend real en VPS
- [x] Crear `src/hooks/useServicios.ts` — reemplaza `useServices.ts` de Firestore
- [x] Crear `src/hooks/usePresupuestos.ts` — reemplaza `useBudgets.ts` de Firestore
- [x] Migrar `ServicesView.tsx` a `useServicios` (PostgreSQL)
- [x] Eliminar `useServices.ts`, `useBudgets.ts`, `config/firebase.ts`
- [x] Firebase completamente removido del código fuente (solo queda como hosting)
- [x] Migrations adicionales ejecutadas en VPS: `RENAME fecha_operation → fecha_operacion`; nuevas columnas `saldo`, `moneda`, `saldo_inicial` en `medios_pago`
- [x] App con cero errores de consola en producción

**Pendiente (trasladado a fases siguientes):**

- [ ] Implementar lógica "último usado" para defaults de Macro/Categoría/Concepto/Medio de pago
- [ ] Motor de sugerencia IA: dado monto + texto libre, sugerir clasificación (spec §9)

---

### Phase 2 — Rediseño UI + App Shell [Completada — 2026-04-22 — PR #4]

**Objetivo:** Reemplazar la estética dark/neon por el tema "Editorial Orgánico" y construir el app shell responsive. Sin cambios en lógica de datos ni hooks — fase exclusivamente de UI.

**Plan de implementación:** `docs/plans/2026-04-22-phase2-ui-redesign.md`

**Entregables completados:**

- [x] Tailwind v3 instalado (`tailwind.config.js` con paleta terracotta/sage/navy, `postcss.config.js`) — `4d1f38d`
- [x] `src/index.css` con directivas Tailwind + tema base stone-50 — `4d1f38d`
- [x] `index.html` limpio: sin CDN Tailwind, con PWA meta tags — `4d1f38d`
- [x] **Paso 1 — UI Primitives**: `Card`, `Button` (primary/secondary/ghost), `Badge` (6 colores), `Input` (label+error), utilitario `cn` — `3c3c4a9`
- [x] **Paso 2 — Layout**: `BottomNav.tsx` (mobile, fixed bottom, safe-area PWA) + `Sidebar.tsx` (desktop, `hidden md:flex`) — `d14891f`
- [x] **Paso 3 — App.tsx shell**: elimina blobs dark/neon, `bg-stone-50`, FAB `terracotta-500`, layout responsive, placeholders Phase 3 — `58022b4`
- [x] **Paso 4 — Dashboard.tsx**: header serif, saldo agrupado por moneda, Macros grid (gastos ARS), presupuestos con filtro moneda/unidad, vencimientos — `dc463de`
- [x] **Paso 5 — CardsView + hooks**: `useCuotasTarjeta.ts`, `usePrestamos.ts`, CardsView con skeletons y empty states — `dc463de`
- [x] **Paso 6 — ServicesView**: `marcarComoPagado` (POST→PATCH con `movimiento_id`, compensating delete, fetch-by-ID fallback para defs inactivas), modal de monto, badges PENDING/PAGADO — `dc463de`
- [x] Post-review: `@types/react@19` + `@types/react-dom@19` instalados; imports React 19 correctos; `type="button"` en nav buttons; filtros moneda/unidad en Dashboard — `02d7904`, `f5affa1`

**Nota post-merge (2026-04-27):** La divergencia entre `main` local y `origin/main` fue resuelta mediante merge de `origin/main`. La historia granular de Phase 2 (8 commits) ahora forma parte del `main` local. El worktree de Phase 1 fue eliminado; Phase 2 permanece disponible como branch hasta decisión de limpieza.

**Deuda técnica que NO se abordó en Phase 2:**

- Defaults "último usado" en TransactionForm (Phase 3)
- Widget FX en Dashboard (Phase 3 — requiere `useCotizaciones`)
- Motor IA de sugerencia (indefinido)
- Certificado TLS válido (infra, no código)
- Clasificación macro desde DB (Phase 3 — `Movimiento` no tiene campo `macro`)

---

### Phase 3 — Módulos Analíticos y Cotizaciones [Pendiente]

**Objetivo:** Vistas de análisis y cotizaciones FX en tiempo real. Desktop-first para análisis.

**Entregables esperados:**

- [ ] `CotizacionesView.tsx`: integración CriptoYa (`/api/dolar`, `/api/brl`); cache en `cotizaciones_fx`; mostrar blue + oficial ARS/USD y ARS/BRL
- [ ] `AnalisisView.tsx`: gráficos con Recharts (tendencias por Macro, comparativas mensuales) — lazy loaded con `React.lazy()`
- [ ] `useCotizaciones.ts`: hook para CriptoYa + cache local
- [ ] Defaults "último usado" en `TransactionForm.tsx` — desbloqueador regla 3 taps para Agos
- [ ] Widget FX en Dashboard

---

### Phase 4 — Verificación, Deploy y Handoff a Agos [Pendiente]

**Objetivo:** App en producción, accesible para Agos sin fricción.

**Entregables esperados:**

- [ ] Testing manual completo según plan de verificación (spec + implementation plan)
- [ ] Deploy a Firebase Hosting (`firebase deploy --only hosting`)
- [ ] Verificación del flujo Agos: 3 taps desde FAB hasta gasto guardado
- [ ] Automatizaciones n8n: generación mensual de `movimientos_previstos_mes` desde definiciones

---

## Checklist por Módulo

### Movimientos (carga de gastos)

- [x] Tipos de dominio definidos (`Transaction`, `Macro`, `Unit`, `Currency`, `QuestionMark`)
- [x] Taxonomía completa en `classificationMap.ts`
- [x] Cliente API (`api.ts`) — PostgREST con `apiGet/apiPost/apiPatch/apiDelete`
- [x] Hook `useTransactions.ts` migrado a PostgREST `api.ts` — `feat/phase1-foundation` `e80beef`
- [x] `TransactionForm.tsx` actualizado al nuevo esquema PostgREST — `feat/phase1-foundation` `e80beef`
- [ ] Regla 3 taps implementada (defaults al último usado) — Phase 3
- [ ] Motor sugerencia IA — indefinido

### Tarjetas y Préstamos

- [x] Tipos definidos (`InstallmentPlan`, `Cuota`, `InstallmentType`, `CuotaStatus`)
- [x] Migration SQL para tablas `cuotas_tarjeta` y `prestamos` (001)
- [x] `useCuotasTarjeta.ts` — `dc463de`
- [x] `usePrestamos.ts` — `dc463de`
- [x] `CardsView.tsx` conectado a datos reales con skeletons y empty states — `dc463de`

### Servicios (checklist mensual)

- [x] Tablas `servicios_definicion` y `movimientos_previstos_mes` ejecutadas en VPS (migration `001_finanzas_rearchitecture.sql`)
- [x] `useServicios.ts` creado y conectado a PostgREST
- [x] `ServicesView.tsx` mostrando servicios del mes desde PostgreSQL
- [x] Flujo PENDING → PAGADO (actualiza `movimientos_previstos_mes` + crea `movimiento`) — `dc463de`

### Dashboard

- [x] Balance de medios de pago desde PostgreSQL (`useMediosPago`)
- [x] Presupuestos con cálculo client-side de `spent` desde PostgreSQL, filtrado por moneda y unidad
- [x] Vencimientos de servicios del mes desde PostgreSQL
- [x] Saldo agrupado por moneda (no mezcla ARS + USD)
- [x] Macros grid (VIVIR/TRABAJAR/DEBER/DISFRUTAR) con gastos ARS del mes
- [x] Diseño "Editorial Orgánico" aplicado
- [ ] Widget FX integrado (CriptoYa) — Phase 3
- [ ] Clasificación macro desde DB — Phase 3

### Cotizaciones FX

- [ ] `useCotizaciones.ts` con llamada a CriptoYa
- [ ] Cache en `cotizaciones_fx`
- [ ] `CotizacionesView.tsx` mostrando blue + oficial

### Análisis

- [ ] `AnalisisView.tsx` con Recharts
- [ ] Lazy loading implementado (`React.lazy`)
- [ ] Al menos una vista de tendencias por Macro

---

## Deuda Técnica Conocida

| Item                                              | Severidad | Estado        | Descripción                                                                                                                                |
| ------------------------------------------------- | --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Certificado self-signed en PostgREST              | Media     | Pendiente     | Browsers rechazan el cert (`ERR_CERT_AUTHORITY_INVALID`). Requiere cert válido (Let's Encrypt u otro) o aceptación manual por dispositivo. |
| `saldo` en `medios_pago` son todos 0              | Baja      | Pendiente     | Las columnas existen pero no tienen datos reales. Necesitan carga inicial.                                                                 |
| Clasificación macro por keywords en Dashboard     | Baja      | Phase 3       | `Movimiento` no tiene campo `macro` en DB. Keyword-match funciona pero es frágil. Agregar campo o helper en Phase 3.                      |
| Defaults "último usado" en `TransactionForm`      | Alta      | Phase 3       | Bloqueador de regla 3 taps para Agos.                                                                                                      |
| ~~`App.tsx` estética dark/neon~~                  | Media     | Resuelto P2   | Eliminado en Phase 2 — `58022b4`.                                                                                                          |
| ~~`useServices.ts` / `useBudgets.ts` Firestore~~  | Alta      | Resuelto P1   | Migrados y eliminados en Phase 1.                                                                                                          |

---

## Próximos Pasos (accionables)

**Phase 3:**

1. **Resolver certificado TLS** — obtener cert válido (Let's Encrypt vía Coolify/Traefik). Bloquea onboarding de Agos en su teléfono.
2. **Cargar saldos iniciales** en `medios_pago` — las columnas existen pero los valores son 0.
3. **`useCotizaciones.ts`** + **`CotizacionesView.tsx`** — integración CriptoYa con cache en `cotizaciones_fx`.
4. **Widget FX en Dashboard** — blue + oficial ARS/USD.
5. **Defaults "último usado"** en `TransactionForm.tsx` — desbloqueador de regla 3 taps para Agos.
6. **`AnalisisView.tsx`** — Recharts, lazy loaded, tendencias por Macro.

---

## Riesgos y Bloqueos

| Riesgo                                                            | Probabilidad | Impacto | Mitigación                                                                               |
| ----------------------------------------------------------------- | ------------ | ------- | ---------------------------------------------------------------------------------------- |
| Certificado self-signed bloquea onboarding de Agos                | Alta         | Alto    | Resolver cert válido (Let's Encrypt via Coolify) antes de invitar a Agos a usar la app  |
| `saldo` en `medios_pago` = 0 muestra datos incorrectos            | Media        | Medio   | Cargar saldos iniciales reales antes de mostrar la app a Agos                            |
| Motor IA (spec §9) requiere diseño adicional                      | Media        | Medio   | Definir con Mauro el approach (LLM externo, regex local, o híbrido) antes de implementar |
| Flujo "3 taps" para Agos requiere UX testing real                 | Baja         | Alto    | Validar con Agos en dispositivo real; defaults "último usado" aún no implementados       |

---

## Notas del PM

- **Stack real confirmado:** Frontend usa React 19 + Vite + hooks directos (sin Zustand). El cliente `api.ts` apunta a PostgREST en VPS. Firebase es hosting-only.
- **`@types/react`**: faltaba como dev dep — instalado en Phase 2 (`@types/react@19`, `@types/react-dom@19`).
- **Fuera de alcance v1:** ingresos automáticos, inversiones, reportes exportables, multi-hogar, ingresos del inmueble Brasil.
- **Monedas soportadas:** ARS, USD, USDT. BRL referenciado en spec para unidad Brasil pero no está en el tipo `Currency` — punto a decidir.
- **Spec v1.0** vive en `docs/spec/finanzas_app_spec.md`. El archivo `docs/spec/finanzas_app_contexto_adicional.md` resuelve divergencias entre spec y el prototipo UI (`cauce-app-v2.jsx`). Ambos son insumos mandatorios para implementar.
