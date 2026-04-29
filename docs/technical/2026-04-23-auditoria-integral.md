# Auditoría integral — finanzas-app

**Fecha:** 2026-04-23
**Rama auditada:** `main` @ `e0ab9ab`
**Autores:** Claude (orquestación) + subagentes `db-schema-auditor`, `fx-currency-auditor`, `taxonomia-guardian`, `finanzas-reviewer`, `finanzas-pm` + auditorías inline (tests, CI, PWA, seguridad, dependencias).
**Veredicto global:** `NO_SHIP`

Tres frentes bloqueantes simultáneos: la migración 002 no corre, la matemática financiera del Dashboard es incorrecta, y la taxonomía `macro` está declarada en TypeScript pero no existe en DB. A eso se suma un drift narrativo serio: el commit "Phase 3 Editorial Orgánico" en `main` no contiene el trabajo — el código real vive en worktrees sin mergear (`feat/phase2-ui-redesign`, `feat/phase3-editorial-organico`).

---

## Índice

1. [Alcance y método](#1-alcance-y-método)
2. [Hallazgos por dominio](#2-hallazgos-por-dominio)
   - 2.1 [Schema y contrato API](#21-schema-y-contrato-api)
   - 2.2 [FX y aritmética de moneda](#22-fx-y-aritmética-de-moneda)
   - 2.3 [Taxonomía de clasificación](#23-taxonomía-de-clasificación)
   - 2.4 [Arquitectura y convenciones](#24-arquitectura-y-convenciones)
   - 2.5 [Estado del proyecto](#25-estado-del-proyecto)
   - 2.6 [Tests](#26-tests)
   - 2.7 [Seguridad](#27-seguridad)
   - 2.8 [Dependencias](#28-dependencias)
   - 2.9 [PWA, CI/CD, accesibilidad, performance](#29-pwa-cicd-accesibilidad-performance)
3. [Matriz de severidad](#3-matriz-de-severidad)
4. [Plan de remediación propuesto](#4-plan-de-remediación-propuesto)
5. [Gaps de esta auditoría](#5-gaps-de-esta-auditoría)

---

## 1. Alcance y método

Se auditó el estado de `main` en `e0ab9ab` mediante 5 subagentes del proyecto ejecutados en paralelo, más 4 chequeos inline (tests, CI/CD, PWA, seguridad/dependencias). No se audió código de los worktrees (`feat/phase1-foundation`, `feat/phase2-ui-redesign`, `feat/phase3-editorial-organico`) excepto en los puntos donde `finanzas-pm` los referenció.

**Severidades:**
- **CRIT** — bloquea producción o corrompe datos.
- **HIGH** — bug real sin disparar aún, o deuda estructural.
- **MED** — inconsistencia, edge case, o deuda.
- **LOW** — estilo, menor.

---

## 2. Hallazgos por dominio

### 2.1 Schema y contrato API

| ID | Sev | Archivo:línea | Hallazgo |
|---|---|---|---|
| SCH-1 | CRIT | `supabase/migrations/002_spec_v1_migration.sql:11,107–154` | Referencia a tabla inexistente `transactions` (la real es `movimientos`). La migración falla en runtime. |
| SCH-2 | CRIT | `supabase/migrations/002_spec_v1_migration.sql:108` | `ADD CONSTRAINT IF NOT EXISTS` no es sintaxis válida en PG < 17. |
| SCH-3 | CRIT | `supabase/migrations/001_finanzas_rearchitecture.sql:86,95` | `movimientos_previstos_mes.referencia_id` y `movimiento_id` están comentadas como FK pero son `INTEGER` bare; huérfanos silenciosos al borrar. |
| SCH-4 | CRIT | `src/types/index.ts` + `src/store/transactionStore.ts:2` | `installment_plans`, `cuotas`, `monthly_income`, `alerts` creadas en 002 sin tipos TS. El store las importa → compile failure en strict. |
| SCH-5 | MED | `supabase/migrations/001_finanzas_rearchitecture.sql:93` | CHECK de `estado` mezcla inglés/español: `'PENDING','RESERVED','PAID','PAGADO'`. |
| SCH-6 | MED | `supabase/migrations/001_finanzas_rearchitecture.sql:69` | `presupuestos_definicion.moneda` CHECK excluye `'USDT'` pero el tipo `Moneda` lo acepta. |
| SCH-7 | MED | `supabase/migrations/001_finanzas_rearchitecture.sql:164` | Índice `(unidad)` simple no cubre el filtro más común `(unidad, fecha_operacion DESC)`. |
| SCH-8 | MED | `src/types/index.ts:51` | `Movimiento.medio_pago: string` (nombre desnormalizado) en lugar de FK a `medios_pago.id`. |
| SCH-9 | LOW | `src/config/api.ts:92` | `apiGetOne` silencia todos los errores con `.catch(() => [])`; un 500 se convierte en `null` sin distinción. |
| SCH-10 | LOW | `src/config/api.ts:11-16` | Warn de `VITE_API_URL` sólo en DEV; en prod falla con error opaco. |

### 2.2 FX y aritmética de moneda

| ID | Sev | Archivo:línea | Hallazgo |
|---|---|---|---|
| FX-1 | CRIT | `src/components/Dashboard.tsx:14` | `reduce((sum,acc) => sum + acc.saldo, 0)` sin `parseFloat` → concatenación de strings. Además suma cuentas en monedas distintas sin FX. |
| FX-2 | CRIT | `src/components/Dashboard.tsx:23-34` | Presupuesto vs gasto acumula sin validar `moneda` → USD sumado contra ARS. |
| FX-3 | HIGH | `src/components/Dashboard.tsx:117` | División `p.spent / p.limite` sin `parseFloat` → `NaN` si viene como string. |
| FX-4 | HIGH | arquitectura | `useCotizaciones`, `utils/fx.ts`, `utils/formatters.ts`, `CotizacionesView` declarados pero **no implementados**. |
| FX-5 | MED | `src/components/Dashboard.tsx:183`, `src/components/ServicesView.tsx:158` | Símbolo `$` hardcodeado para registros cuya `moneda` puede ser BRL o USD. |
| FX-6 | MED | `src/components/CardsView.tsx:236` | Cálculo `totalDebt - (amount * current)` sin validar `current ≤ total` → deuda negativa. |
| FX-7 | LOW | múltiples | `toLocaleString()` sin locale ni `style:'currency'`; depende del dispositivo. |
| FX-8 | N/A | `CardsView.tsx` | Regla "pago de tarjeta ≠ gasto" no verificable hoy: la view está con datos mock. El riesgo existirá cuando se conecte a DB. |

### 2.3 Taxonomía de clasificación

| ID | Sev | Archivo:línea | Hallazgo |
|---|---|---|---|
| TAX-1 | CRIT | `src/config/classificationMap.ts` + DB | La dimensión `macro` (`VIVIR/TRABAJAR/DEBER/DISFRUTAR`) existe en el map pero **no en DB** (ninguna tabla tiene columna `macro`) y **no en `src/types/index.ts`**. Nivel raíz se pierde en cada insert. |
| TAX-2 | CRIT | `src/components/transactions/TransactionForm.tsx:131-138` | Los botones "Unidad" iteran `CLASSIFICATION_MAP` (macros) y envían `'VIVIR'/'DEBER'/...` al campo `unidad` de DB, que sólo acepta `HOGAR/PROFESIONAL/BRASIL`. Los inserts fallan o corrompen datos. |
| TAX-3 | HIGH | `src/components/ServicesView.tsx:19-24` | Estado inicial hardcodea `categoria:'Vivienda y Vida Diaria'` y `concepto:'Servicios e Impuestos'`, strings inexistentes en el map. Form sin dropdowns cascading. |
| TAX-4 | HIGH | `src/components/CardsView.tsx:16-28` | Arrays de cuotas/préstamos 100% mock; sin hook, sin API, clasificación fuera del map. |
| TAX-5 | LOW | `src/components/transactions/TransactionForm.tsx:22-25` | Defaults hardcodeados (`unit:'HOGAR'`, etc.) en vez de MRU (viola regla 3-taps). |

### 2.4 Arquitectura y convenciones

| ID | Sev | Archivo:línea | Hallazgo |
|---|---|---|---|
| ARCH-1 | CRIT | `src/App.tsx`, `src/components/**/*.tsx` | Design system Editorial Orgánico **no aplicado**: 0 tokens `stone/terracotta/sage/navy`; todo sigue en `slate/indigo/violet/rose/emerald`. `tailwind.config.js` define los tokens pero nadie los usa. |
| ARCH-2 | HIGH | `src/store/` | No existe el directorio pese a tener `zustand` en deps y convención documentada. |
| ARCH-3 | HIGH | `src/App.tsx:25,57-76` | Shell limitado a `max-w-md mx-auto`; no hay `BottomNav`/`Sidebar` separados → desktop inutilizable. |
| ARCH-4 | HIGH | `src/hooks/useTransactions.ts:52` | `filters.month.toISOString()` como dep con `month: new Date()` inline en `Dashboard.tsx:12` → fetch-loop. |
| ARCH-5 | HIGH | `src/components/transactions/TransactionForm.tsx:119` | `e.target.value as any` en moneda. Debe ser `as Moneda`. |
| ARCH-6 | MED | `src/components/common/Modal.tsx:12-19` | Doble estado `show` + `isOpen` con `setTimeout`; antipattern para React 19. |
| ARCH-7 | MED | hooks varios | `setError(string)` sin consumer → los errores nunca llegan al usuario. No hay `ToastProvider`. |
| ARCH-8 | MED | `package.json:14` | `firebase ^12.7.0` como dep runtime pese a ser hosting-only; bundle inflado + 1 vuln crítica transitiva. |
| ARCH-9 | MED | `src/types/index.ts:224-302` | Legacy aliases `@deprecated` (`Transaction`, `Account`, etc.) alimentan drift snake/camelCase. |

### 2.5 Estado del proyecto

| ID | Sev | Hallazgo |
|---|---|---|
| PM-1 | CRIT | `docs/PROJECT_TRACKING.md` marca Phase 2 y 3 como "Pendiente"; el trabajo real está implementado en worktrees sin mergear. |
| PM-2 | CRIT | El commit `e0ab9ab` en `main` anuncia "Phase 3 Editorial Orgánico" pero no contiene el trabajo (verificado: 0 tokens del nuevo theme en archivos). Drift narrativo entre mensaje y contenido. |
| PM-3 | HIGH | Certificado TLS del PostgREST sin renovar: bloquea onboarding de Agos en su teléfono. |
| PM-4 | HIGH | Saldos en `medios_pago` sin carga inicial (datos = 0). |
| PM-5 | MED | Cálculo de `spent` en presupuestos no filtra por mes. |
| PM-6 | MED | Motor de sugerencia IA (spec §9) sin approach definido. |

### 2.6 Tests

| ID | Sev | Hallazgo |
|---|---|---|
| TST-1 | HIGH | **0/5 componentes** tienen test (`App`, `Dashboard`, `CardsView`, `ServicesView`, `TransactionForm`). |
| TST-2 | HIGH | **No hay tests E2E** ni Playwright configurado pese a que la skill está disponible y el flujo multi-tap crítico. |
| TST-3 | MED | Cobertura de hooks: 4/4, de stores: 2/2, de `api.ts` + `classificationMap.ts`: OK. La base de tests existe pero no cubre el layer donde están los bugs reales (FX-1..3 en `Dashboard`, TAX-2 en `TransactionForm`). |
| TST-4 | LOW | No hay threshold de coverage en CI (porque no hay CI). |

### 2.7 Seguridad

| ID | Sev | Archivo:línea | Hallazgo |
|---|---|---|---|
| SEC-1 | CRIT | `src/config/api.ts` | **No envía ningún header de autenticación** (`Authorization`, `apikey`, JWT). Si el PostgREST expone `anon` con permisos amplios (probable dado que no hay policies visibles), cualquiera con la URL lee/escribe toda la DB. |
| SEC-2 | CRIT | `node_modules/protobufjs` (vía firebase) | Vulnerabilidad **crítica** GHSA-xq3m-2v4x-88gg (arbitrary code execution). Mitigación inmediata: remover `firebase` del runtime (no se usa) — esto resuelve SEC-2 y ARCH-8 de un tiro. |
| SEC-3 | MED | `.env.local` | Correctamente gitignored. OK. Pero `VITE_*` son embebidas al build; cualquier secreto ahí queda público. Validar que `VITE_API_URL` sea sólo la URL y no incluya tokens. |
| SEC-4 | LOW | `src/` | No se encontraron `dangerouslySetInnerHTML` / `eval` / `innerHTML` manual. XSS surface limpia a nivel código. |

### 2.8 Dependencias

| Paquete | Actual | Latest | Nota |
|---|---|---|---|
| firebase | 12.7.0 | 12.12.1 | **Remover.** Hosting-only según CLAUDE.md; arrastra vuln crítica. |
| tailwindcss | 3.4.19 | 4.2.4 | Upgrade mayor diferido. OK mantener en 3 hasta post-MVP. |
| vite | 6.4.1 | 8.0.10 | Dos majors atrás. |
| typescript | 5.8.3 | 6.0.3 | Major atrás. |
| lucide-react | 0.561.0 | 1.8.0 | Major atrás. |
| @vitejs/plugin-react | 5.1.2 | 6.0.1 | Major atrás. |
| recharts | 3.6.0 | 3.8.1 | Patch/minor. |

`npm audit`: **1 vulnerabilidad crítica** (protobufjs) — corrige al remover firebase.

### 2.9 PWA, CI/CD, accesibilidad, performance

| ID | Sev | Hallazgo |
|---|---|---|
| OPS-1 | HIGH | **No hay PWA**: sin `public/manifest.json`, sin service worker, sin `vite-plugin-pwa`. CLAUDE.md declara PWA como característica del producto. |
| OPS-2 | HIGH | **No hay CI**: sin `.github/workflows/`, sin pipeline que corra `test:run` + `build` en PR. |
| OPS-3 | MED | Accesibilidad sin auditar: no se verificaron roles ARIA, contraste, navegación por teclado. |
| OPS-4 | MED | Bundle/performance sin medir: `firebase` inflando bundle sin uso; viewport limitado a mobile sin `React.lazy` para vistas pesadas. |

---

## 3. Matriz de severidad

| Severidad | Cantidad | Dominios principales |
|---|---|---|
| CRIT | 11 | SCH-1..4, FX-1, FX-2, TAX-1, TAX-2, ARCH-1, PM-1, PM-2, SEC-1, SEC-2 |
| HIGH | 15 | FX-3, FX-4, TAX-3, TAX-4, ARCH-2..5, PM-3, PM-4, TST-1, TST-2, OPS-1, OPS-2 |
| MED | ~15 | (ver tablas por dominio) |
| LOW | ~8 | (ver tablas por dominio) |

---

## 4. Plan de remediación propuesto

Orden sugerido para minimizar retrabajo. Cada paso resuelve bloqueos del siguiente.

1. **Reconciliar `main` con los worktrees** (PM-1, PM-2, ARCH-1). Decidir si `feat/phase3-editorial-organico` se mergea o si el commit `e0ab9ab` se revierte. Sin esto, cualquier fix se aplica al árbol equivocado.
2. **Quick wins de seguridad** (SEC-1, SEC-2, ARCH-8): remover `firebase` de deps (hosting-only), agregar header `apikey` o JWT en `api.ts`, validar RLS policies en PostgREST.
3. **Bloquear migración 002** (SCH-1, SCH-2, SCH-4) hasta: renombrar `transactions→movimientos`, quitar `IF NOT EXISTS` de constraints, agregar tipos para las 4 tablas nuevas.
4. **Decidir contrato `macro`** (TAX-1): agregar columna a DB + tipo + formularios, o eliminar del `classificationMap.ts`. Elegir uno.
5. **Fix `TransactionForm`** (TAX-2) antes de cualquier uso en prod.
6. **Matemática del Dashboard** (FX-1..3): `parseFloat` + validación de `moneda` en todas las agregaciones.
7. **Habilitar CI mínima** (OPS-2): workflow que corra `npm run test:run` y `npm run build` en cada PR.
8. **Tests de componentes críticos** (TST-1): al menos `Dashboard` y `TransactionForm`.
9. **Servicios faltantes** (FX-4): implementar `useCotizaciones` + `utils/fx.ts` + `utils/formatters.ts`.
10. **PWA** (OPS-1): `vite-plugin-pwa` + manifest + service worker mínimo. Post-MVP aceptable.
11. **Actualizar `PROJECT_TRACKING.md`** (via `finanzas-pm`) al cerrar cada paso.

---

## 5. Gaps de esta auditoría

Lo que **no** se cubrió y conviene agendar:

- **Accesibilidad profunda** (lectores de pantalla, contraste AA/AAA en el nuevo theme cuando se aplique).
- **Performance/bundle analysis** medido con `rollup-plugin-visualizer` o similar, no por inspección.
- **Carga y resiliencia** del PostgREST (rate limits, retry strategy en cliente).
- **Integración con n8n**: los workflows viven fuera del repo; no se validó el contrato entre n8n y `movimientos_previstos_mes`.
- **Código en worktrees**: sólo se auditó `main`. Los bloqueantes SCH/FX/TAX/ARCH podrían estar resueltos parcialmente en `feat/phase3-editorial-organico`; pendiente de verificación post-merge.
- **Migration reversibility**: no se revisaron rollback scripts.

---

## Referencias

- Spec: [`docs/spec/finanzas_app_spec.md`](../spec/finanzas_app_spec.md)
- Diseño: [`docs/plans/2026-03-08-finanzas-rearchitecture-design.md`](../plans/2026-03-08-finanzas-rearchitecture-design.md)
- Implementación: [`docs/plans/2026-03-08-finanzas-implementation-plan.md`](../plans/2026-03-08-finanzas-implementation-plan.md)
- Tracking: [`docs/PROJECT_TRACKING.md`](../PROJECT_TRACKING.md) — pendiente de sincronizar con estado real
