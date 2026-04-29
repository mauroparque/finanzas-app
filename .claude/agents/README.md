# Subagentes disponibles — Finanzas 2.0

Los subagentes se invocan vía la herramienta `Agent` (con `subagent_type`). Se dividen en **específicos del proyecto** (definidos en `.claude/agents/`) y **genéricos** (provistos por la plataforma o plugins).

**Regla general**: preferir el subagente específico si existe uno que encaje con la tarea; reservar los genéricos para exploración abierta, planificación, o revisión fuera del dominio de finanzas-app.

---

## Subagentes específicos del proyecto

| Agent                 | Cuándo usarlo                                                                                                                                                                                                                                                        | Modelo |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `finanzas-pm`         | Cuando el usuario pregunta por el estado del proyecto (`¿cómo vamos?`, `¿qué falta?`, `¿qué hicimos?`), necesita definir/actualizar fases o hitos, o al cerrar un ciclo de desarrollo significativo. Único agente que edita `docs/PROJECT_TRACKING.md`.            | sonnet (opus para planning profundo) |
| `finanzas-reviewer`   | Antes de mergear una feature branch o tras un cambio arquitectónico: revisa contra convenciones de finanzas-app (types en `src/types/`, API vía `src/config/api.ts`, stores Zustand, design tokens Editorial Orgánico). No sustituye a `superpowers:code-reviewer` genérico. | opus |
| `taxonomia-guardian`  | Al tocar formularios de carga, dropdowns cascading, helpers de clasificación, o migrations que afectan `categorias_maestras`. Protege la jerarquía `Macro → Categoría → Concepto → Detalle` y la sincronía entre `classificationMap.ts` y la DB. | sonnet |
| `db-schema-auditor`   | Antes de correr una migration en la VPS, al editar archivos de `supabase/migrations/`, o al cambiar endpoints de Hono / el cliente `api.ts`. Valida tipos, enums, FKs, scoping por `unidad` y sincronía del contrato frontend/backend. | sonnet |
| `fx-currency-auditor` | Al implementar o cambiar aritmética de montos, conversiones ARS/USD/USDT/BRL, llamadas a CriptoYa, cache `cotizaciones_fx`, o flujos de pago de tarjeta. Vela por la regla **"pago de tarjeta ≠ gasto"** y el uso correcto de `parseFloat` + `Intl.NumberFormat`. | sonnet |

## Subagentes genéricos (cuándo preferirlos)

| Agent                       | Cuándo usarlo                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Explore`                   | Exploración abierta del codebase que requiere >3 queries (buscar patrones, encontrar archivos por naming, entender flujos). Protege el contexto principal de resultados largos. |
| `Plan`                      | Diseñar la estrategia de implementación de una tarea multi-paso antes de escribir código. Devuelve plan paso a paso con trade-offs arquitectónicos.                             |
| `general-purpose`           | Búsquedas donde no hay confianza en acertar al primer intento, o tareas multi-paso que no encajan en ningún otro agente.                                                        |
| `superpowers:code-reviewer` | Revisión post-milestone contra un plan/estándar genérico. Usar `finanzas-reviewer` en su lugar si la revisión toca convenciones específicas del dominio.                           |

## Reglas de invocación

- **No delegar por defecto**: cada subagente arranca en frío y re-deriva contexto. Úsalos cuando (a) hay una razón clara (aislar contexto, paralelizar, consultar dominio específico) o (b) el usuario lo pide explícitamente.
- **Briefear bien**: el subagente no ve la conversación. Pasá paths, líneas, y el "por qué" — no solo el "qué".
- **Paralelizar cuando corresponde**: si hay 2+ tareas independientes, invocar múltiples `Agent` en un solo mensaje.
- **Verificar, no confiar**: el resumen del subagente describe su intención, no necesariamente el resultado. Si escribió/editó código, revisar el diff antes de reportar la tarea como terminada.
