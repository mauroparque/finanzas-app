# Finanzas 2.0 — Seguimiento del Proyecto

**Propietarios:** Mauro & Agos  
**Creado:** 2026-04-20  
**Última actualización:** 2026-04-22  
**Estado general:** En progreso — Phase 1 completada, Phase 2 (UI Redesign) iniciada en `feat/phase2-ui-redesign`

> **Rama `feat/phase1-foundation` mergeada a `main`** (`e087778`). `main` está al día con el remote. La migration `001_finanzas_rearchitecture.sql` fue ejecutada en el VPS. `useServices.ts` y `useBudgets.ts` migrados a PostgREST (`aa2064c`). En curso: rediseño UI Editorial Orgánico en worktree `feat-phase2-ui`.

---

## Visión General

Finanzas 2.0 es una PWA de gestión financiera familiar para Mauro y Agos. Reemplaza el bot de Telegram y la planilla Excel como canales primarios de registro, y unifica la vista transaccional (base caja, PostgreSQL VPS) con proyecciones devengadas. El norte inamovible: responder "¿Cuánto gastamos en vivir, en deber y en disfrutar?" en menos de 3 segundos al abrir la app.

Usuarios: Mauro (carga ~85% de los gastos, usuario técnico) y Agos (usuaria no técnica, necesita cargar un gasto en 3 taps o menos).

---

## Estado Actual

Phase 0 cerrada. `feat/phase1-foundation` mergeada a `main`. La migration `001_finanzas_rearchitecture.sql` ejecutada en VPS — tablas nuevas (`servicios_definicion`, `cuotas_tarjeta`, `prestamos`, etc.) disponibles en producción. Infraestructura Tailscale + PostgREST configurada: API accesible en `https://n8n.tail089052.ts.net` (solo via tailnet). Frontend deployado en Firebase Hosting (`https://lince-finanzas-app.web.app/`) con `VITE_API_URL` apuntando al VPS.

Phase 1 completada: todos los hooks migrados a PostgREST, migration ejecutada en VPS, Tailscale + PostgREST configurados. Phase 2 en curso en worktree `feat-phase2-ui` (rama `feat/phase2-ui-redesign`): plan de rediseño UI definido en `docs/plans/2026-04-22-phase2-ui-redesign.md`, trabajo de implementación por comenzar. Deuda técnica pendiente: `App.tsx` mantiene estética dark/neon; certificado self-signed en PostgREST es rechazado por browsers.

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
- [x] Actualizar `Dashboard.tsx` para usar `useMediosPago` — `e80beef`
- [x] Mergear `feat/phase1-foundation` a `main` — `e087778`
- [x] Ejecutar `001_finanzas_rearchitecture.sql` en VPS y verificar endpoints
- [x] Variable de entorno `VITE_API_URL` apuntando al backend real en VPS
- [x] Migrar `useServices.ts` de Firestore a PostgREST (`/movimientos_previstos_mes`, `/servicios_definicion`) — `aa2064c`
- [x] Migrar `useBudgets.ts` de Firestore a PostgREST (`/presupuestos_definicion`) — `aa2064c`
- [x] Alias backward-compatible en clasificación (`e316d98`)

**Pendiente (trasladado a Phase 3 o posterior):**

- [ ] Implementar lógica "último usado" para defaults de Macro/Categoría/Concepto/Medio de pago
- [ ] Motor de sugerencia IA: dado monto + texto libre, sugerir clasificación (spec §9)

---

### Phase 2 — Rediseño UI + App Shell [En progreso — rama `feat/phase2-ui-redesign`]

**Objetivo:** Reemplazar la estética dark/neon por el tema "Editorial Orgánico" y construir el app shell responsive. Sin cambios en lógica de datos ni hooks — fase exclusivamente de UI.

**Plan de implementación:** `docs/plans/2026-04-22-phase2-ui-redesign.md`  
**Worktree activo:** `.worktrees/feat-phase2-ui`

**Entregables completados (base de Phase 1):**

- [x] Tailwind v3 instalado (`tailwind.config.js` con paleta terracotta/sage/navy, `postcss.config.js`) — `4d1f38d`
- [x] `src/index.css` con directivas Tailwind + tema base stone-50 — `4d1f38d`
- [x] `index.html` limpio: sin CDN Tailwind, con PWA meta tags — `4d1f38d`

**Pasos del plan (en orden de dependencia):**

- [ ] **Paso 1 — UI Primitives** (`src/components/common/ui/`): `Card`, `Button`, `Badge`, `Input`
- [ ] **Paso 2 — Layout**: `BottomNav.tsx` (mobile, fixed bottom) + `Sidebar.tsx` (desktop, sticky)
- [ ] **Paso 3 — App.tsx shell**: eliminar blobs dark, aplicar `bg-stone-50`, FAB terracotta, layout responsive con BottomNav/Sidebar
- [ ] **Paso 4 — Dashboard.tsx**: rediseño Editorial Orgánico; secciones: saldo total, Macros (VIVIR/TRABAJAR/DEBER/DISFRUTAR), presupuestos, servicios próximos
- [ ] **Paso 5 — CardsView.tsx + hooks**: crear `useCuotasTarjeta.ts` y `usePrestamos.ts`; conectar a datos reales
- [ ] **Paso 6 — ServicesView.tsx**: botón "Marcar pagado" funcional; flujo PENDING → PAGADO con modal de monto real

**Pasos 4, 5 y 6 son independientes entre sí** — pueden ejecutarse en paralelo con subagentes.

**Criterios de aceptación:**

- `npm run build` pasa sin errores TypeScript
- No quedan referencias a `bg-[#020617]`, `indigo-600`, `violet-606`, `slate-900` en `App.tsx`
- BottomNav visible en mobile (< md); Sidebar visible en desktop (≥ md)
- FAB es terracotta-500
- Dashboard muestra saldo total + presupuestos con datos reales
- CardsView no crashea aunque no haya datos en DB
- ServicesView tiene botón "Marcar pagado" funcional

**Deuda técnica que NO se aborda en Phase 2:**

- Defaults "último usado" en TransactionForm (Phase 3)
- Widget FX en Dashboard (Phase 3 — requiere `useCotizaciones`)
- Motor IA de sugerencia (indefinido)
- Certificado TLS válido (infra, no código)

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
- [ ] `useCuotasTarjeta.ts` (hook nuevo) (Phase 2, Paso 5)
- [ ] `usePrestamos.ts` (hook nuevo) (Phase 2, Paso 5)
- [ ] `CardsView.tsx` conectado a datos reales (Phase 2, Paso 5)

### Servicios (checklist mensual)

- [x] Tablas `servicios_definicion` y `movimientos_previstos_mes` ejecutadas en VPS (migration `001_finanzas_rearchitecture.sql`)
- [x] `useServicios.ts` migrado a PostgREST — `aa2064c`
- [ ] `ServicesView.tsx` mostrando servicios del mes desde DB (Phase 2, Paso 6)
- [ ] Flujo PENDING → PAGADO (actualiza `movimientos_previstos_mes` + crea `movimiento`) (Phase 2, Paso 6)

### Dashboard

- [ ] Resumen por Macro en tiempo real
- [ ] Widget FX integrado
- [ ] Diseño "Editorial Orgánico" aplicado
- [ ] Balance de medios de pago actualizado

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

| Item                                              | Severidad | Estado     | Descripción                                                                                                                                |
| ------------------------------------------------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `App.tsx` estética dark/neon                      | Media     | En Phase 2 | Fondo oscuro con blobs animados. Se elimina en Phase 2, Paso 3.                                                                            |
| `config/firebase.ts` sin eliminar                 | Baja      | Pendiente  | El archivo existe; `api.ts` ya lo reemplaza. Borrar tras confirmar que ningún hook lo importa.                                             |
| Certificado self-signed en PostgREST              | Media     | Pendiente  | Browsers rechazan el cert (`ERR_CERT_AUTHORITY_INVALID`). Requiere cert válido (Let's Encrypt u otro) o aceptación manual por dispositivo. |
| Defaults "último usado" en `TransactionForm`      | Alta      | Phase 3    | Bloqueador de regla 3 taps para Agos. Trasladado de Phase 1 a Phase 3.                                                                    |
| Filtro de mes en `usePresupuestos`                | Baja      | Phase 2-4  | Quick fix posible durante Paso 4 de Phase 2; de lo contrario en Phase 4.                                                                  |
| ~~`useServices.ts` usando Firestore~~             | Alta      | Resuelto   | Migrado a PostgREST en `aa2064c`.                                                                                                          |
| ~~`useBudgets.ts` usando Firestore~~              | Media     | Resuelto   | Migrado a PostgREST en `aa2064c`.                                                                                                          |

---

## Próximos Pasos (accionables)

**Ahora — Phase 2 (en progreso):**

1. **Paso 1: UI Primitives** — Crear `Card`, `Button`, `Badge`, `Input` en `src/components/common/ui/`. Prerequisito para todo lo que sigue.
2. **Paso 2: Layout** — Crear `BottomNav.tsx` y `Sidebar.tsx` con los items de navegación y estilos terracotta/stone.
3. **Paso 3: App.tsx shell** — Eliminar blobs dark, aplicar `bg-stone-50`, integrar BottomNav/Sidebar, FAB terracotta. Build debe pasar antes de continuar.
4. **Pasos 4, 5, 6 en paralelo** (independientes entre sí): Dashboard redesign / CardsView + hooks / ServicesView marcar-pagado.

**Pendiente post-Phase 2:**

5. **Eliminar `config/firebase.ts`** — limpieza post-migración.
6. **Implementar defaults "último usado"** en `TransactionForm.tsx` — desbloqueador de la regla 3 taps para Agos (Phase 3).

---

## Riesgos y Bloqueos

| Riesgo                                                                            | Probabilidad | Impacto | Mitigación                                                                               |
| --------------------------------------------------------------------------------- | ------------ | ------- | ---------------------------------------------------------------------------------------- |
| Migration `001_finanzas_rearchitecture.sql` sin ejecutar en VPS bloquea flujo E2E | Alta         | Alto    | Ejecutar como primer paso tras mergear el worktree                                       |
| `VITE_API_URL` no configurada en entorno de desarrollo                            | Media        | Alto    | Verificar `.env.local` antes de arrancar Phase 1                                         |
| Motor IA (spec §9) requiere diseño adicional                                      | Media        | Medio   | Definir con Mauro el approach (LLM externo, regex local, o híbrido) antes de implementar |
| Flujo "3 taps" para Agos requiere UX testing real                                 | Baja         | Alto    | Validar con Agos en dispositivo real antes de dar Phase 1 por cerrada                    |

---

## Notas del PM

- **Stack real confirmado por código (worktree):** Frontend usa React 19 + Vite + hooks directos (sin Zustand). El cliente `api.ts` apunta a PostgREST en VPS. `CLAUDE.md` menciona Hono como capa intermedia pero el código real en `feat/phase1-foundation` usa PostgREST directo. Confirmar con Mauro si Hono está previsto como proxy o si PostgREST es el backend definitivo.
- **Fuera de alcance v1:** ingresos automáticos, inversiones, reportes exportables, multi-hogar, ingresos del inmueble Brasil.
- **Monedas soportadas:** ARS, USD, USDT. BRL referenciado en spec para unidad Brasil pero no está en el tipo `Currency` — punto a decidir.
- **Spec v1.0** vive en `docs/spec/finanzas_app_spec.md`. El archivo `docs/spec/finanzas_app_contexto_adicional.md` resuelve divergencias entre spec y el prototipo UI (`cauce-app-v2.jsx`). Ambos son insumos mandatorios para implementar.
