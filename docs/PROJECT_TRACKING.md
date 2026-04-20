# Finanzas 2.0 — Seguimiento del Proyecto

**Propietarios:** Mauro & Agos  
**Creado:** 2026-04-20  
**Última actualización:** 2026-04-20  
**Estado general:** En progreso — Phase 1 por iniciar

---

## Visión General

Finanzas 2.0 es una PWA de gestión financiera familiar para Mauro y Agos. Reemplaza el bot de Telegram y la planilla Excel como canales primarios de registro, y unifica la vista transaccional (base caja, PostgreSQL VPS) con proyecciones devengadas. El norte inamovible: responder "¿Cuánto gastamos en vivir, en deber y en disfrutar?" en menos de 3 segundos al abrir la app.

Usuarios: Mauro (carga ~85% de los gastos, usuario técnico) y Agos (usuaria no técnica, necesita cargar un gasto en 3 taps o menos).

---

## Estado Actual

Phase 0 cerrada. La fundación de datos y arquitectura está alineada con la spec v1.0: tipos de dominio reescritos, taxonomía Macro correcta, Zustand instalado, cliente Hono/fetch creado, migration SQL lista para ejecutar en VPS. Sin embargo, las **capas de UI y hooks aún no migraron**: `App.tsx` todavía usa la estética dark/neon y el screen routing antiguo; `useTransactions.ts` sigue importando Firebase; `Dashboard.tsx`, `CardsView.tsx` y `TransactionForm.tsx` no consumen el nuevo store ni el cliente Hono. Phase 1 es donde arranca el trabajo visible.

Hay cambios sin commitear: `CLAUDE.md` modificado, `docs/finanzas_app_spec.md` eliminado del raíz (movido a `docs/spec/`), directorio `docs/spec/` nuevo.

---

## Fases del Proyecto

### Phase 0 — Fundación y migración a Spec v1.0 [Completada — 2026-04-11]

**Objetivo:** Alinear el modelo de datos, la taxonomía y la configuración de infraestructura con la spec v1.0 antes de tocar UI.

**Entregables completados:**
- `src/types/index.ts` reescrito con `Macro`, `Unit`, `Currency`, `QuestionMark`, `InstallmentPlan`, `Cuota`, `MonthlyIncome`, `Alert`
- `src/config/classificationMap.ts` migrado de Unit→Category a Macro→Category→Concept (VIVIR 7 cats, TRABAJAR 4, DEBER 2, DISFRUTAR 3)
- `src/store/transactionStore.ts` — store Zustand central (transactions, plans, cuotas, income, alerts + filtros)
- `src/store/uiStore.ts` — store Zustand de UI (navegación, modales, selectors de unidad/mes)
- `src/config/api.ts` — cliente fetch genérico (Hono/PostgREST-compatible: apiGet, apiPost, apiPatch, apiPut, apiDelete)
- `supabase/migrations/002_spec_v1_migration.sql` — migration lista (requiere ejecución manual en VPS)

**Pendiente de Phase 0 sin commitear:** mover spec a `docs/spec/`, actualizar `CLAUDE.md`.

---

### Phase 1 — Módulo Carga de Gasto + Migración de Hooks [Pendiente]

**Objetivo:** Hacer funcionar el flujo completo de carga de un gasto desde la app, consumiendo el backend real. Es la primera funcionalidad que Agos puede usar.

**Regla inamovible:** La carga debe completarse en 3 taps o menos desde el FAB.

**Entregables esperados:**

- [ ] Migrar `useTransactions.ts` de Firebase a `api.ts` (POST/GET `/movimientos`)
- [ ] Migrar `useAccounts.ts` a `useMediosPago.ts` (GET `/medios_pago`)
- [ ] Conectar `TransactionForm.tsx` al store Zustand + hooks nuevos
- [ ] Implementar lógica "último usado" para defaults de Macro/Categoría/Concepto/Medio de pago
- [ ] Motor de sugerencia IA: dado monto + texto libre, sugerir clasificación (spec §9)
- [ ] Ejecutar `002_spec_v1_migration.sql` en VPS y verificar endpoints
- [ ] Variable de entorno `VITE_API_URL` apuntando al backend Hono en VPS

**Dependencia:** migration en VPS debe ejecutarse antes de poder probar el flujo end-to-end.

---

### Phase 2 — Rediseño UI + App Shell [Pendiente]

**Objetivo:** Reemplazar la estética dark/neon por el tema "Editorial Orgánico" y alinear la navegación con la spec.

**Entregables esperados:**

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
- [x] Store Zustand (`transactionStore.ts`)
- [x] Cliente API (`api.ts`)
- [ ] Hook `useTransactions.ts` migrado a Hono (actualmente usa Firebase)
- [ ] `TransactionForm.tsx` conectado al store y hook nuevo
- [ ] Regla 3 taps implementada (defaults al último usado)
- [ ] Motor sugerencia IA

### Tarjetas y Préstamos

- [x] Tipos definidos (`InstallmentPlan`, `Cuota`, `InstallmentType`, `CuotaStatus`)
- [x] Migration SQL para tablas `installment_plans` y `cuotas` (002)
- [ ] `useCuotasTarjeta.ts` (hook nuevo)
- [ ] `usePrestamos.ts` (hook nuevo)
- [ ] `CardsView.tsx` conectado a datos reales

### Servicios (checklist mensual)

- [ ] Tablas `servicios_definicion` y `movimientos_previstos_mes` ejecutadas en VPS (migration 001)
- [ ] `useServicios.ts` migrado a Hono
- [ ] `ServicesView.tsx` mostrando servicios del mes desde DB
- [ ] Flujo PENDING → PAGADO (actualiza `movimientos_previstos_mes` + crea `movimiento`)

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

| Item | Severidad | Descripción |
|------|-----------|-------------|
| `useTransactions.ts` importa Firebase | Alta | Hook principal sigue apuntando a Firestore. Bloquea cualquier funcionalidad real con el nuevo backend. |
| `App.tsx` desalineado con spec | Media | Screen type en `types/index.ts` define `'inicio'|'carga'|'pasivos'|'tarjetas'|'horizonte'|'analisis'` pero `App.tsx` usa `'dashboard'|'cards'|'services'`. |
| `config/firebase.ts` sin eliminar | Baja | El archivo existe; `api.ts` ya lo reemplaza. Debe borrarse para evitar confusión. |
| Estética dark/neon en `App.tsx` | Media | Fondo oscuro con blobs animados inconsistente con "Editorial Orgánico". |
| Migration 001 y 002 sin ejecutar en VPS | Alta | Las tablas nuevas (`servicios_definicion`, `installment_plans`, `cuotas`, etc.) no existen en producción todavía. |
| `useAccounts.ts` y `useBudgets.ts` no migrados | Media | Hooks secundarios todavía sin conectar al nuevo cliente. |

---

## Próximos Pasos (accionables)

1. **Commitear cambios pendientes de Phase 0**: `CLAUDE.md` y reorganización de `docs/spec/`.
2. **Ejecutar migrations en VPS**: correr `001_finanzas_rearchitecture.sql` y `002_spec_v1_migration.sql` via CloudBeaver/SSH. Verificar que los endpoints respondan.
3. **Migrar `useTransactions.ts`**: reemplazar imports de Firebase por llamadas a `api.ts`. Es el desbloqueador principal de Phase 1.
4. **Migrar `TransactionForm.tsx`**: conectar al store Zustand + hook migrado; implementar defaults por último usado.
5. **Alinear `App.tsx`**: unificar el tipo `Screen` y aplicar el tema Editorial Orgánico como paso previo al rediseño completo de vistas.

---

## Riesgos y Bloqueos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Migrations sin ejecutar en VPS bloquean todo el flujo E2E | Alta | Alto | Ejecutar como primer paso de Phase 1 antes de escribir código |
| `VITE_API_URL` no configurada en entorno de desarrollo | Media | Alto | Verificar `.env.local` antes de arrancar Phase 1 |
| Motor IA (spec §9) requiere diseño adicional | Media | Medio | Definir con Mauro el approach (LLM externo, regex local, o híbrido) antes de implementar |
| Flujo "3 taps" para Agos requiere UX testing real | Baja | Alto | Validar con Agos en dispositivo real antes de dar Phase 1 por cerrada |

---

## Notas del PM

- **Stack real confirmado por código:** Frontend usa React 19 + Vite + Zustand. Backend es Hono (cliente genérico fetch en `api.ts`) — no PostgREST puro. `CLAUDE.md` menciona PostgREST en algunos lugares pero el commit Phase 0 y el código dicen Hono. Pendiente de aclarar si Hono corre delante de PostgREST o lo reemplaza completamente.
- **Fuera de alcance v1:** ingresos automáticos, inversiones, reportes exportables, multi-hogar, ingresos del inmueble Brasil.
- **Monedas soportadas:** ARS, USD, USDT. BRL referenciado en spec para unidad Brasil pero no está en el tipo `Currency` — punto a decidir.
- **Spec v1.0** vive en `docs/spec/finanzas_app_spec.md`. El archivo `docs/spec/finanzas_app_contexto_adicional.md` resuelve divergencias entre spec y el prototipo UI (`cauce-app-v2.jsx`). Ambos son insumos mandatorios para implementar.
