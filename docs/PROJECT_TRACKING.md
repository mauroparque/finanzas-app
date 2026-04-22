# Finanzas 2.0 — Seguimiento del Proyecto

**Propietarios:** Mauro & Agos  
**Creado:** 2026-04-20  
**Última actualización:** 2026-04-22  
**Estado general:** Phase 1 completada — migración Firestore → PostgREST finalizada, app funcional en producción sin errores de consola

> **Rama `feat/phase1-foundation` mergeada a `main`** (`e087778`). Migración Firestore → PostgREST completada en esta sesión. App corriendo en `https://lince-finanzas-app.web.app/` con cero errores de consola.

---

## Visión General

Finanzas 2.0 es una PWA de gestión financiera familiar para Mauro y Agos. Reemplaza el bot de Telegram y la planilla Excel como canales primarios de registro, y unifica la vista transaccional (base caja, PostgreSQL VPS) con proyecciones devengadas. El norte inamovible: responder "¿Cuánto gastamos en vivir, en deber y en disfrutar?" en menos de 3 segundos al abrir la app.

Usuarios: Mauro (carga ~85% de los gastos, usuario técnico) y Agos (usuaria no técnica, necesita cargar un gasto en 3 taps o menos).

---

## Estado Actual

**Phase 1 completada.** La migración de Firestore a PostgREST está terminada. La app no tiene errores de consola. El backend (PostgREST en VPS via Tailscale) responde correctamente. Firebase quedó exclusivamente como hosting estático.

**Infraestructura operativa:** Tailscale instalado en VPS (`n8n.tail089052.ts.net`). PostgREST desplegado en Coolify como servicio Docker, conectado a la red `coolify` (Traefik como TLS terminator). `VITE_API_URL` configurado y funcional. Rol `web_anon` creado en PostgreSQL con GRANTs a todas las tablas.

**Deuda técnica activa:** (1) Certificado self-signed en PostgREST — browsers requieren aceptar excepción manual por dispositivo. (2) `saldo` en `medios_pago` son todos 0 — necesitan datos reales. (3) Cálculo de `spent` en presupuestos es client-side sin filtro de mes.

**Pendiente para Phase 2:** Rediseño UI Editorial Orgánico (App.tsx dark/neon, Dashboard, navegación responsive).

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
- [x] Migrar `Dashboard.tsx` a `useServicios` + `usePresupuestos` con cálculo client-side de `spent`
- [x] Eliminar `useServices.ts`, `useBudgets.ts`, `config/firebase.ts`
- [x] Firebase completamente removido del código fuente (solo queda como hosting)
- [x] Migrations adicionales ejecutadas en VPS: `RENAME fecha_operation → fecha_operacion`; nuevas columnas `saldo`, `moneda`, `saldo_inicial` en `medios_pago`
- [x] App con cero errores de consola en producción

**Pendiente (trasladado a fases siguientes):**
- [ ] Implementar lógica "último usado" para defaults de Macro/Categoría/Concepto/Medio de pago
- [ ] Motor de sugerencia IA: dado monto + texto libre, sugerir clasificación (spec §9)

---

### Phase 2 — Rediseño UI + App Shell [Pendiente]

**Objetivo:** Reemplazar la estética dark/neon por el tema "Editorial Orgánico" y alinear la navegación con la spec.

**Entregables completados** (en `feat/phase1-foundation`, pendiente merge):

- [x] Tailwind v3 instalado (`tailwind.config.js` con paleta terracotta/sage/navy, `postcss.config.js`) — `4d1f38d`
- [x] `src/index.css` con directivas Tailwind + tema base stone-50 — `4d1f38d`
- [x] `index.html` limpio: sin CDN Tailwind, con PWA meta tags — `4d1f38d`

**Entregables pendientes:**

- [ ] `App.tsx`: quitar fondo dark + blobs animados; aplicar `bg-stone-50`; actualizar FAB a terracotta
- [ ] `App.tsx`: actualizar `Screen` type a los screens de la spec (`inicio`, `carga`, `pasivos`, `tarjetas`, `horizonte`, `analisis`) — actualmente hay desalineación con el tipo en `types/index.ts`
- [ ] `Dashboard.tsx`: cards con diseño orgánico; resumen por Macro en tiempo real; widget FX (CriptoYa)
- [ ] `CardsView.tsx`: renombrar/refactorizar para tarjetas + préstamos (conectar a `cuotas_tarjeta`, `prestamos`)
- [ ] `ServicesView.tsx`: checklist mensual desde `movimientos_previstos_mes`
- [ ] Layout responsive: BottomNav mobile / Sidebar desktop
- [ ] Componentes UI primitivos: Button, Card, Badge, Input en `src/components/common/ui/`

---

### Phase 3 — Módulos Analíticos y Cotizaciones [Pendiente]

**Objetivo:** Vistas de análisis y cotizaciones FX en tiempo real. Desktop-first para análisis.

**Entregables esperados:**

- [ ] `CotizacionesView.tsx`: integración CriptoYa (`/api/dolar`, `/api/brl`); cache en `cotizaciones_fx`; mostrar blue + oficial ARS/USD y ARS/BRL
- [ ] `AnalisisView.tsx`: gráficos con Recharts (tendencias por Macro, comparativas mensuales) — lazy loaded con `React.lazy()`
- [ ] `usePresupuestos.ts`: hook para `presupuestos_definicion`
- [ ] `useCotizaciones.ts`: hook para CriptoYa + cache local

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
- [ ] Regla 3 taps implementada (defaults al último usado)
- [ ] Motor sugerencia IA

### Tarjetas y Préstamos

- [x] Tipos definidos (`InstallmentPlan`, `Cuota`, `InstallmentType`, `CuotaStatus`)
- [x] Migration SQL para tablas `cuotas_tarjeta` y `prestamos` (001)
- [ ] `useCuotasTarjeta.ts` (hook nuevo)
- [ ] `usePrestamos.ts` (hook nuevo)
- [ ] `CardsView.tsx` conectado a datos reales

### Servicios (checklist mensual)

- [x] Tablas `servicios_definicion` y `movimientos_previstos_mes` ejecutadas en VPS (migration `001_finanzas_rearchitecture.sql`)
- [x] `useServicios.ts` creado y conectado a PostgREST
- [x] `ServicesView.tsx` mostrando servicios del mes desde PostgreSQL
- [ ] Flujo PENDING → PAGADO (actualiza `movimientos_previstos_mes` + crea `movimiento`)

### Dashboard

- [x] Balance de medios de pago desde PostgreSQL (`useMediosPago`)
- [x] Presupuestos con cálculo client-side de `spent` desde PostgreSQL
- [x] Vencimientos de servicios del mes desde PostgreSQL
- [ ] Resumen por Macro en tiempo real
- [ ] Widget FX integrado (CriptoYa)
- [ ] Diseño "Editorial Orgánico" aplicado

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

| Item                                                            | Severidad | Descripción                                                                                                                                     |
| --------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.tsx` desalineado con spec                                  | Media     | Screen type en `types/index.ts` define `inicio, carga, pasivos, tarjetas, horizonte, analisis` pero `App.tsx` usa `dashboard, cards, services`. |
| Estética dark/neon en `App.tsx`                                 | Media     | Fondo oscuro con blobs animados inconsistente con "Editorial Orgánico". Tailwind ya instalado; falta aplicar tema a `App.tsx`.                  |
| Certificado self-signed en PostgREST                            | Media     | Browsers requieren aceptar excepción manual por dispositivo (`ERR_CERT_AUTHORITY_INVALID`). Requiere cert válido (Let's Encrypt u otro).        |
| `saldo` en `medios_pago` son todos 0                            | Baja      | Las columnas `saldo`, `saldo_inicial`, `moneda` fueron agregadas pero no tienen datos reales. Necesitan carga inicial.                          |
| Cálculo `spent` en presupuestos sin filtro de mes              | Baja      | El cálculo de gasto acumulado es client-side y no filtra por mes actual. Corrección necesaria antes de que el dato sea confiable para Agos.     |
| Flujo PENDING → PAGADO en servicios no implementado            | Media     | `ServicesView.tsx` muestra el checklist pero no tiene la acción de marcar como pagado (actualizar `movimientos_previstos_mes` + crear `movimiento`). |

---

## Próximos Pasos (accionables)

1. **Resolver certificado TLS** — obtener cert válido (Let's Encrypt vía Coolify/Traefik) para eliminar la fricción de aceptación manual por dispositivo. Bloquea el onboarding de Agos en su teléfono.
2. **Alinear `App.tsx`**: unificar el tipo `Screen`, quitar estética dark/neon, aplicar `bg-stone-50` + FAB terracotta. Entrada a Phase 2.
3. **Implementar defaults "último usado"** en `TransactionForm.tsx`: Macro/Categoría/Concepto/Medio de pago. Desbloqueador de la regla 3 taps para Agos.
4. **Cargar saldos iniciales** en `medios_pago` — las columnas existen pero los valores son 0.
5. **Corregir cálculo `spent`** en `usePresupuestos.ts` — agregar filtro por mes actual para que el dato sea confiable.
6. **Flujo PENDING → PAGADO** en `ServicesView.tsx` — acción de marcar servicio como pagado.

---

## Riesgos y Bloqueos

| Riesgo                                                                            | Probabilidad | Impacto | Mitigación                                                                               |
| --------------------------------------------------------------------------------- | ------------ | ------- | ---------------------------------------------------------------------------------------- |
| Certificado self-signed bloquea onboarding de Agos en su teléfono                | Alta         | Alto    | Resolver cert válido (Let's Encrypt via Coolify) antes de invitar a Agos a usar la app  |
| `saldo` en `medios_pago` = 0 muestra datos incorrectos en Dashboard               | Media        | Medio   | Cargar saldos iniciales reales antes de mostrar la app a Agos                            |
| Motor IA (spec §9) requiere diseño adicional                                      | Media        | Medio   | Definir con Mauro el approach (LLM externo, regex local, o híbrido) antes de implementar |
| Flujo "3 taps" para Agos requiere UX testing real                                 | Baja         | Alto    | Validar con Agos en dispositivo real; defaults "último usado" aún no implementados       |

---

## Notas del PM

- **Stack real confirmado por código (worktree):** Frontend usa React 19 + Vite + hooks directos (sin Zustand). El cliente `api.ts` apunta a PostgREST en VPS. `CLAUDE.md` menciona Hono como capa intermedia pero el código real en `feat/phase1-foundation` usa PostgREST directo. Confirmar con Mauro si Hono está previsto como proxy o si PostgREST es el backend definitivo.
- **Fuera de alcance v1:** ingresos automáticos, inversiones, reportes exportables, multi-hogar, ingresos del inmueble Brasil.
- **Monedas soportadas:** ARS, USD, USDT. BRL referenciado en spec para unidad Brasil pero no está en el tipo `Currency` — punto a decidir.
- **Spec v1.0** vive en `docs/spec/finanzas_app_spec.md`. El archivo `docs/spec/finanzas_app_contexto_adicional.md` resuelve divergencias entre spec y el prototipo UI (`cauce-app-v2.jsx`). Ambos son insumos mandatorios para implementar.
