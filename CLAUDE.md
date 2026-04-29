# CLAUDE.md — Finanzas 2.0

Guidelines and commands for agentic coding tools in this repository.

---

## Agent Skills — Mandatory Usage

This project uses a **skills** system in `.agents/skills/`. All skills are listed with routing signals in [.agents/skills/SKILLS_INDEX.md](.agents/skills/SKILLS_INDEX.md).

### Rules

1. **Read `using-superpowers`** at the start of every conversation — it is the only mandatory skill.
2. **Consult SKILLS_INDEX.md** to find skills matching your task. Load all matching skills before acting.
3. Skills cover process (brainstorming, debugging, TDD), technology (React/Vite, Postgres), and quality (code review, verification). Load technology-specific skills when the task involves those technologies.
4. **Rigid skills** (TDD, debugging, verification): follow strictly. **Flexible skills** (frontend-design, postgres): adapt to context.

---

## Commands

```bash
# Development
npm run dev           # Vite dev server (localhost:3000)

# Build & Preview
npm run build         # Production build to /dist
npm run preview       # Preview production build

# Deploy
firebase deploy --only hosting   # Deploy to Firebase Hosting
```

---

## Architecture

**Stack**: React 19 + TypeScript + Vite + TailwindCSS + Supabase (PostgreSQL + GoTrue Auth + PostgREST). PWA mobile-first for data entry, desktop-optimized for analytics.

### Data Flow

```text
React Component → Custom Hook (src/hooks/) → API Client (src/config/api.ts) → PostgREST → PostgreSQL
```

- **`src/config/api.ts`** — Fetch client with CRUD helpers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`). Headers: `apikey` + `Authorization: Bearer <JWT>`. 401 interceptor with silent refresh. No Supabase SDK (intentional — raw fetch only).
- **`src/hooks/`** — One hook per domain entity. Responsible for fetching, local state, and exposing mutation functions.
- **`src/store/`** — Zustand stores: `authStore` (session + refresh) and `uiStore` (navigation).
- **`src/config/classificationMap.ts`** — Mirrors `categorias_maestras` in the DB. Used for cascading dropdowns.

### View Routing

No router library. `App.tsx` uses `activeScreen` state (`Screen` type) with `switch/case` conditional rendering. Views: `dashboard`, `movimientos`, `tarjetas`, `servicios`, `analisis`, `cotizaciones`.

### Auth & Security

- Auth: email + password via GoTrue (Supabase). JWT persisted in `localStorage` with auto-refresh.
- RLS: policies `auth_all` on all operational tables — shared access for any authenticated user (family-only app: Mauro + Agos).

---

## Code Style

- **Naming**: Components & types PascalCase; hooks `useXxx`; constants SCREAMING_SNAKE. DB fields: `snake_case`. Frontend state: `camelCase`.
- **Imports**: external libs first (named, no barrel files) → internal config/utils (relative paths) → types last with `import type`.
- **TypeScript**: strict null checks; all domain types in `src/types/index.ts`; input types use `Omit<T, 'id' | 'fecha_carga'>`. No `any` — use `unknown` + type guards.
- **Styling**: TailwindCSS only. Compose via `cn()` utility. Editorial Orgánico tokens: backgrounds `stone-50`/`stone-900`, accent `terracotta`, secondary `sage`, text/links `navy`, muted `stone-500`. Border radius: `rounded-2xl` or `rounded-3xl`.
- **Icons**: `lucide-react` exclusively.
- **Charts**: `recharts` exclusively.
- **Error handling**: wrap API calls in try-catch; show user-friendly messages in Spanish; `console.error` with context.

---

## Domain-Specific Rules

### Classification Hierarchy

All `movimientos`, `servicios_definicion`, and `cuotas_tarjeta` must carry the full chain:

```text
Macro → Categoría → Concepto → Detalle
VIVIR → Vivienda y Vida Diaria → Abastecimiento → Supermercado Coto
```

Macros: `VIVIR | TRABAJAR | DEBER | DISFRUTAR`. Units: `HOGAR | PROFESIONAL | BRASIL`. Use `classificationMap.ts` helpers for cascading dropdowns. **Always reset child fields when parent changes.**

### The 3-Tap Rule (Mobile)

Loading a `movimiento` from the FAB must be completable in **≤ 3 taps after opening the form**. Unit, Category, and Concept must default to the most recently used values. Never add required fields that don't default.

### Currency & FX

- **Never assume ARS**. Check the `moneda` field on every `movimiento`. Monedas: `ARS | USD | USDT | BRL`.
- **Parse before math**: Postgres `numeric` arrives as strings. Always `parseFloat()` before arithmetic (`+ - * /`) or `Intl.NumberFormat`.
- **Format**: `Intl.NumberFormat('es-AR', { style: 'currency', currency: record.moneda })`.
- **FX rates**: fetch from CriptoYa API (`/api/dolar`, `/api/brl`). Cache in `cotizaciones_fx` table. Always display **both blue and oficial** rates for ARS/USD.
- **"Pago de tarjeta ≠ gasto"**: credit-card statement payments are debt-cancellation events, not expenses. Do NOT create a `movimiento` with `tipo = 'gasto'` for a card payment.

### Period-Based Model (Servicios & Ingresos)

- `servicios_definicion` / `ingresos_definicion` are **templates** — store recurring concept and default day, never a fixed amount.
- `movimientos_previstos_mes` stores **monthly executions**.
- When paid: update `estado = 'PAGADO'` AND create a real `movimiento`.

---

## Testing

Currently no test runner configured. When adding tests:

```bash
# placeholder — adjust when test runner is configured
npm test -- --grep "currency|moneda|fx|cotizacion|cuota|tarjeta"
```

---

## Context Management

When using `/compact`, always preserve:

- The 3-Tap Rule and "último usado" defaults requirement
- The "pago de tarjeta ≠ gasto" business rule
- Currency handling rules (parseFloat, no ARS assumption, Intl formatting)
- Full classification hierarchy (Macro → Categoría → Concepto → Detalle)
- Current task checklist and any pending verification steps

---

## Subagentes & Convenciones

- **Subagentes**: documented in [`.claude/agents/README.md`](.claude/agents/README.md).
- **Documentation conventions**: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).
- **Project tracking**: `docs/PROJECT_TRACKING.md` (maintained by `finanzas-pm`).
