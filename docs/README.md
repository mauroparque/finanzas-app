# docs/ — Índice de Documentación

Registro centralizado de planes de implementación, auditorías, y revisiones de cierre del proyecto **Finanzas 2.0**.

**Última actualización:** 2026-04-29

---

## Estructura

```text
docs/
  audits/      ← auditorías periódicas de calidad del repositorio
  plans/       ← planes de implementación (tarea a tarea, antes de tocar código)
  reviews/     ← registros de verificación y cierre de fase
  spec/        ← especificación funcional y contexto adicional
  technical/   ← documentación técnica de arquitectura y decisiones de diseño
```

### Convención de nombres

| Carpeta      | Patrón                                 | Ejemplo                                  |
| ------------ | -------------------------------------- | ---------------------------------------- |
| `audits/`    | `YYYY-MM-DD_AUDIT.md`                  | `2026-04-23_AUDIT.md`                    |
| `plans/`     | `YYYY-MM-DD-<feature>.md`              | `2026-04-27-supabase-migration.md`       |
| `reviews/`   | `YYYY-MM-DD_<tema>-review.md`          | `2026-04-22_phase3-completion-review.md` |
| `spec/`      | `<proyecto>_spec.md`                   | `finanzas_app_spec.md`                   |
| `technical/` | `v<semver>_TECHNICAL.md` o `<tema>.md` | `v1.0.0_TECHNICAL.md`                    |

---

## Historial de trabajo

### Ciclo 1 — Fundación y Rearquitectura (Mar–Abr 2026)

```text
Spec v1.0
  └── finanzas_app_spec.md (fuente de verdad: modelo, taxonomía, reglas de negocio)
       │
       ├── Rearquitectura (Firebase → PostgreSQL + PostgREST)
       │    ├── 2026-03-08-finanzas-rearchitecture-design.md  (diseño de rearquitectura)
       │    └── 2026-03-08-finanzas-implementation-plan.md  (plan Phase 1–4)
       │
       ├── UI Editorial Orgánico
       │    ├── 2026-04-22-phase2-ui-redesign.md            (rediseño visual)
       │    └── 2026-04-22-phase3-editorial-organico.md     (módulos nuevos, 11 tasks)
       │
       └── Migración Supabase
            └── 2026-04-27-supabase-migration.md            (auth + RLS + datos migrados)
```

### Auditoría Post-Migración (Abr 2026)

```text
Auditoría integral post-migración Supabase
  ├── 2026-04-23-auditoria-integral.md               (auditoría previa, en technical/)
  └── 2026-04-29-auditoria-post-supabase.md          (11 P0 blockers, 30+ P1, 20+ P2)
```

---

## Seguimiento del proyecto

| Documento | Descripción |
|-----------|-------------|
| [PROJECT_TRACKING.md](./PROJECT_TRACKING.md) | Estado actual, fases, checklists por módulo, deuda técnica y próximos pasos. Mantenido por el agente `finanzas-pm`. |

---

## Planes de implementación (`plans/`)

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [2026-03-08-finanzas-rearchitecture-design.md](./plans/2026-03-08-finanzas-rearchitecture-design.md) | Diseño de la rearquitectura (Firebase → PostgreSQL + PostgREST, UI Editorial Orgánico) | Completado ✓ |
| [2026-03-08-finanzas-implementation-plan.md](./plans/2026-03-08-finanzas-implementation-plan.md) | Plan de implementación por fases (Phase 1–4), tasks, pasos y criterios de verificación | Completado ✓ |
| [2026-04-22-phase2-ui-redesign.md](./plans/2026-04-22-phase2-ui-redesign.md) | Plan de rediseño UI Editorial Orgánico | Completado ✓ |
| [2026-04-22-phase3-editorial-organico.md](./plans/2026-04-22-phase3-editorial-organico.md) | Plan Phase 3: Editorial Orgánico UI, bugfixes, nuevos módulos (11 tasks: 3.0→3.10) | Completado ✓ |
| [2026-04-22-unit-tests-implementation.md](./plans/2026-04-22-unit-tests-implementation.md) | Plan de implementación de tests unitarios | Pendiente |
| [2026-04-27-supabase-migration.md](./plans/2026-04-27-supabase-migration.md) | Plan de migración a Supabase: auth + RLS + datos | Completado ✓ |
| [2026-04-29-post-supabase-repo-audit.md](./plans/2026-04-29-post-supabase-repo-audit.md) | Plan de auditoría integral post-migración Supabase | Completado ✓ |

---

## Especificación (`spec/`)

| Documento | Descripción |
|-----------|-------------|
| [finanzas_app_spec.md](./spec/finanzas_app_spec.md) | Spec v1.0 — Fuente de verdad: modelo de datos, taxonomía completa, reglas de negocio, stack técnico, módulos |
| [finanzas_app_contexto_adicional.md](./spec/finanzas_app_contexto_adicional.md) | Resuelve divergencias entre spec y prototipo UI; instrucciones de integración para el agente |

---

## Técnicos (`technical/`)

| Documento | Descripción |
|-----------|-------------|
| [2026-04-23-auditoria-integral.md](./technical/2026-04-23-auditoria-integral.md) | Auditoría integral del repositorio post-migración |
| [2026-04-29-auditoria-post-supabase.md](./technical/2026-04-29-auditoria-post-supabase.md) | Auditoría post-Supabase: 11 P0 blockers, 30+ P1, 20+ P2. Bloquea feature work hasta resolución. |

---

## Referencia de agentes y convenciones

| Documento | Descripción |
|-----------|-------------|
| [CONVENTIONS.md](CONVENTIONS.md) | Convenciones de documentación `docs/` — cargado on-demand por agentes al crear documentos |

---

## Deuda técnica abierta

Ver [PROJECT_TRACKING.md — Deuda Técnica Conocida](./PROJECT_TRACKING.md#deuda-técnica-conocida) para el estado detallado.

Resumen de gaps críticos (actualizado post-auditoría 2026-04-29):

| ID | Gap | Estado |
|----|-----|--------|
| ~~G1~~ | ~~Sin resumen por Macro en Dashboard~~ | ✅ Resuelto (2026-04-29) — Dashboard muestra agregación por Macro en cards 2x2 |
| G2 | TransactionForm sin defaults "último usado" | Pendiente (agravado por P0-7: defaults inválidos) |
| G3 | Certificado TLS self-signed (resuelto por migración Supabase) | ✅ Resuelto |
| ~~G4~~ | ~~`useCotizaciones` sin fetch a CriptoYa~~ | ✅ Resuelto (2026-04-29) — Fetch directo a CriptoYa + write-back a cache |
| ~~G5~~ | ~~`AnalisisView` es stub vacío~~ | ✅ Resuelto (2026-04-29) — Stacked AreaChart por Macro con Recharts |
| ~~G6~~ | ~~`saldo` en `medios_pago` = 0~~ | ✅ Estructura resuelta — seed manual pendiente (runbook disponible) |
| — | **11 P0 blockers de auditoría** (D9–D18 en PROJECT_TRACKING.md) | ⚠️ Bloqueante |

Ver detalle completo en [PROJECT_TRACKING.md — Hallazgos de la Auditoría Post-Supabase](./PROJECT_TRACKING.md#hallazgos-de-la-auditoría-post-supabase-2026-04-29).
