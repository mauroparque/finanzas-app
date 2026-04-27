# docs/ — Índice de documentación

**Finanzas 2.0** — Última actualización: 2026-04-23

---

## Seguimiento del proyecto

| Documento | Descripción |
|-----------|-------------|
| [PROJECT_TRACKING.md](./PROJECT_TRACKING.md) | Estado actual, fases, checklists por módulo, deuda técnica y próximos pasos. Mantenido por el agente `finanzas-pm`. |

---

## Planes de implementación (`plans/`)

| Documento | Descripción |
|-----------|-------------|
| [2026-03-08-finanzas-rearchitecture-design.md](./plans/2026-03-08-finanzas-rearchitecture-design.md) | Diseño de la rearquitectura (Firebase → PostgreSQL + PostgREST, UI Editorial Orgánico) |
| [2026-03-08-finanzas-implementation-plan.md](./plans/2026-03-08-finanzas-implementation-plan.md) | Plan de implementación por fases (Phase 1–4), tasks, pasos y criterios de verificación |
| [2026-04-22-phase2-ui-redesign.md](./plans/2026-04-22-phase2-ui-redesign.md) | Plan detallado Phase 2: UI Primitives → Layout → App Shell → Dashboard → CardsView → ServicesView |

---

## Especificación (`spec/`)

| Documento | Descripción |
|-----------|-------------|
| [finanzas_app_spec.md](./spec/finanzas_app_spec.md) | Spec v1.0 — Fuente de verdad: modelo de datos, taxonomía completa, reglas de negocio, stack técnico, módulos |
| [finanzas_app_contexto_adicional.md](./spec/finanzas_app_contexto_adicional.md) | Resuelve divergencias entre spec y prototipo UI; instrucciones de integración para el agente |
| [cauce-app-v2.jsx](./spec/cauce-app-v2.jsx) | Prototipo UI/UX de referencia. No es fuente de verdad de datos ni lógica de negocio |

---

## Documentación técnica (`technical/`)

| Documento | Descripción |
|-----------|-------------|
| [2026-04-23-auditoria-integral.md](./technical/2026-04-23-auditoria-integral.md) | Auditoría integral de `main` @ `e0ab9ab`: schema, FX, taxonomía, arquitectura, seguridad, tests, CI/CD, PWA, dependencias. Veredicto `NO_SHIP` con plan de remediación priorizado. |
