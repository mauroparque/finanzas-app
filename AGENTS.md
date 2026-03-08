# AGENTS.md — Finanzas 2.0

This file contains guidelines and commands for agentic coding tools working in this repository.

---

## Agent Skills — Mandatory Usage

This project uses a **skills** system located in `.agents/skills/`. All available skills are listed there.

### Rules

1. **Read `using-superpowers`** at the start of every conversation — it is the only mandatory skill.
2. **Scan available skills** and load all that match your current task before acting.
3. Skills cover process (brainstorming, debugging, TDD), technology (React/Vite best practices, frontend design), and quality (code review, verification). Load technology-specific skills when the task involves those technologies.
4. **Rigid skills** (TDD, debugging, verification, receiving-code-review): follow strictly. **Flexible skills** (frontend-design, vercel-react-best-practices): adapt principles to context.

### Available Skills Quick Reference

| Signal | Skill |
|---|---|
| "let's build / add / redesign" | `brainstorming` → then `writing-plans` |
| Any implementation task | `test-driven-development` |
| "UI / component / page" | `frontend-design` |
| React/Vite code | `vercel-react-best-practices` |
| "bug / broken / not working" | `systematic-debugging` |
| Finishing feature branch | `finishing-a-development-branch` |
| Code review feedback | `receiving-code-review` |
| "done / complete" claim | `verification-before-completion` |
| Multiple independent tasks | `dispatching-parallel-agents` |
| Feature isolation needed | `using-git-worktrees` |

---

## Project Overview

- **Name:** Finanzas 2.0 — Hub de gestión financiera personal/familiar
- **Owners:** Mau & Agos
- **Stack:** React 19 + TypeScript + Vite + TailwindCSS + PostgREST + PostgreSQL
- **Type:** Progressive Web App — Mobile-first for data entry, Desktop-optimized for BI/analytics
- **Language & Domain:** Spanish. Personal finance management: movimientos (gastos e ingresos), tarjetas de crédito, cuotas, préstamos, servicios/vencimientos, presupuestos, tipo de cambio (ARS/USD, ARS/BRL).
- **Backend:** PostgreSQL en VPS, gestionado vía Coolify. PostgREST expone la DB como API REST. n8n orquesta automatizaciones (carga desde Telegram bot).
- **External APIs:** [CriptoYa](https://criptoya.com/api/) para cotizaciones FX en tiempo real.

---

## Commands

```bash
# Development
npm run dev           # Vite dev server (localhost:3000)

# Build & Preview
npm run build         # Production build to /dist
npm run preview       # Preview production build

# Deploy
firebase deploy --only hosting   # Deploy to Firebase Hosting (lince-finanzas-app)
```

---

## Architecture

### Data Flow

```
React Component
  → Custom Hook (src/hooks/)
    → API Client (src/config/api.ts)
      → PostgREST (VPS / Coolify)
        → PostgreSQL
```

- **`src/config/api.ts`** — Base fetch client with CRUD helpers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`). Always set `Prefer: return=representation` header on writes. Points to `VITE_API_URL`.
- **`src/hooks/`** — One hook per domain entity. Each hook is responsible for fetching, local state, and exposing mutation functions.
- **`src/config/classificationMap.ts`** — Mirrors `categorias_maestras` in the DB. Used for offline-capable cascading dropdowns. Keep in sync if DB changes.

### View Routing

No router library. `App.tsx` uses `activeScreen` state (`Screen` type) with `switch/case` conditional rendering. Views are: `dashboard`, `movimientos`, `tarjetas`, `servicios`, `analisis`, `cotizaciones`.

### Module Structure (Planned)

```
src/
├── App.tsx                          # Main app shell, navigation, routing
├── index.tsx                        # Entry point (ReactDOM.createRoot)
├── components/
│   ├── Dashboard.tsx                # Balance, presupuestos, alertas, FX widget
│   ├── MovimientosView.tsx          # Feed + filtros + formulario carga rápida
│   ├── TarjetasView.tsx             # Cuotas de tarjeta + préstamos + perfil crediticio
│   ├── ServicesView.tsx             # Checklist mensual de servicios/vencimientos
│   ├── AnalisisView.tsx             # BI, tendencias, comparativas (desktop-first)
│   ├── CotizacionesView.tsx         # FX real-time + histórico (CriptoYa)
│   ├── common/
│   │   ├── Modal.tsx                # Bottom-sheet mobile / centered desktop
│   │   ├── Layout/
│   │   │   ├── BottomNav.tsx        # Mobile navigation
│   │   │   └── Sidebar.tsx          # Desktop navigation
│   │   └── ui/                      # Primitives: Button, Card, Badge, Input
│   └── transactions/
│       └── TransactionForm.tsx      # Formulario de carga rápida (FAB)
├── config/
│   ├── api.ts                       # PostgREST client
│   └── classificationMap.ts         # Jerarquía de clasificación (Unit→Cat→Concept→Detail)
├── hooks/
│   ├── useMovimientos.ts            # CRUD movimientos con filtros
│   ├── useMediosPago.ts             # Medios de pago activos
│   ├── useServicios.ts              # Servicios recurrentes (definición + previstos)
│   ├── useCuotasTarjeta.ts          # Cuotas activas
│   ├── usePrestamos.ts              # Préstamos activos
│   ├── usePresupuestos.ts           # Presupuestos mensuales
│   └── useCotizaciones.ts           # FX rates (CriptoYa + cotizaciones_fx cache)
├── types/
│   └── index.ts                     # Todos los tipos de dominio
└── utils/
    ├── cn.ts                        # Class name utility
    ├── formatters.ts                # Formateo de moneda, fechas, números
    └── fx.ts                        # Helpers de conversión de divisas
```

---

## Database Schema

Tables in **PostgreSQL** on the VPS (exposed via PostgREST):

### Existing (do not drop or rename)

| Table | Purpose |
|---|---|
| `movimientos` | Core financial transactions (gastos, ingresos) |
| `medios_pago` | Payment accounts/methods (bank, cash, MP, etc.) |
| `categorias_maestras` | Classification hierarchy (unidad → categoria → concepto) |
| `bot_sessions` | Telegram bot conversation state |
| `chat_histories` | Bot chat history (used by n8n/AI) |

### Added in Migration 001

| Table | Purpose |
|---|---|
| `servicios_definicion` | Templates for recurring services (EPEC, Netflix, etc.) |
| `ingresos_definicion` | Templates for income sources (Honorarios, Alquiler cobrado, etc.) |
| `presupuestos_definicion` | Default budget limits per category |
| `movimientos_previstos_mes` | Monthly occurrences from definitions (PENDING→PAID workflow) |
| `cuotas_tarjeta` | Credit card installment purchases |
| `prestamos` | Bank loans with installment tracking |
| `cotizaciones_fx` | Cached FX rates (ARS/USD, ARS/BRL) from CriptoYa |

### Key Column Conventions

- `movimientos.tipo`: `'gasto'` | `'ingreso'` (column added in migration, default `'gasto'`)
- `movimientos.unidad`: `'HOGAR'` | `'PROFESIONAL'` | `'BRASIL'`
- All timestamps: `timestamp with time zone`
- Monetary amounts: `numeric` (not `float`)
- Status fields use `character varying` with defined vocabulary (e.g., `PENDING`, `RESERVED`, `PAID`)

---

## Code Style Guidelines

### Imports

```typescript
// External libraries — named imports, no barrel files
import { useState, useMemo } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

// Internal config/utils — relative paths
import { apiGet, apiPost } from '../config/api';
import { cn } from '../utils/cn';

// Types — always use `type` keyword
import type { Movimiento, MedioPago } from '../types';
```

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `TransactionForm`, `CotizacionWidget` |
| Hooks | `use` + PascalCase | `useMovimientos`, `useCotizaciones` |
| Types/Interfaces | PascalCase | `Movimiento`, `ServicioDefinicion` |
| Input/Partial types | `Omit<T, 'id' \| 'created_at'>` | `type MovimientoInput = Omit<Movimiento, 'id' \| 'fecha_carga'>` |
| DB-mapped fields | snake_case | `fecha_operation`, `medio_pago` |
| Frontend-only state | camelCase | `isLoading`, `activeScreen` |
| Constants | SCREAMING_SNAKE | `VITE_API_URL`, `UNIDADES` |

### TypeScript

- All domain types in `src/types/index.ts`
- DB types must match PostgreSQL column names exactly (snake_case)
- Use `Omit<T, ...>` for create/input types
- No `any` — use `unknown` + type guards when needed
- Strict null checks enabled

### React Patterns

- Function components with explicit prop interface
- Extract all non-trivial logic into custom hooks in `src/hooks/`
- Memoize expensive selectors with `useMemo` (per `vercel-react-best-practices`)
- Use `useCallback` for handlers passed to children
- `React.lazy()` for heavy views (desktop-only like `AnalisisView`)

```typescript
interface CotizacionCardProps {
  label: string;
  value: number;
  currency: 'USD' | 'BRL';
  trend?: 'up' | 'down' | 'stable';
}

export const CotizacionCard = ({ label, value, currency, trend }: CotizacionCardProps) => {
  // ...
};
```

### Error Handling

- Wrap all `apiPost/apiPatch/apiDelete` calls in try-catch
- Show user-friendly toast/error messages in Spanish
- Validate required env vars at dev startup in `api.ts`
- Log errors with `console.error` including context

### Styling — "Editorial Orgánico" Theme

The app uses Tailwind CSS with a custom palette defined in `tailwind.config.js`. **Do not introduce new color classes arbitrarily — use the design tokens.**

```typescript
import { cn } from '../utils/cn';

// Correct: compose using tokens
<div className={cn(
  "bg-stone-50 rounded-2xl shadow-sm border border-stone-200",
  isActive && "border-terracotta-400 bg-terracotta-50",
  className
)}>
```

**Design tokens:**
- Backgrounds: `stone-50` (light), `stone-900` (dark)
- Accent: `terracotta` (primary actions/active states), `sage` (secondary), `navy` (text/links)
- Text: `stone-800` (primary), `stone-500` (secondary/muted)
- Typography: Heading → serif (Lora or equivalent); Body/Numbers → clean sans-serif
- Borders: `rounded-2xl` or `rounded-3xl` — always generous rounding
- Icons: `lucide-react` exclusively
- Charts: `recharts` exclusively

---

## Domain-Specific Rules

### The 3-Tap Rule (Mobile)

Loading a `movimiento` from the FAB must be completable in **≤ 3 taps after opening the form**. The Unit, Category, and Concept must default to the most recently used values. Never add required fields that don't default.

### Classification Hierarchy

All `movimientos`, `servicios_definicion`, and `cuotas_tarjeta` must carry the full hierarchy:

```
unidad → categoria → concepto → detalle
HOGAR  → Vivienda y Vida Diaria → Abastecimiento → Supermercado Coto
```

Use `classificationMap.ts` helpers (`getCategoriesForUnit`, `getConceptsForCategory`, etc.) for cascading dropdowns. **Always reset child fields when parent changes.**

### Period-Based Model (Servicios & Ingresos)

- `servicios_definicion` / `ingresos_definicion` are **templates** — they store recurring concept and default day, never a fixed amount.
- `movimientos_previstos_mes` stores **monthly executions** — an n8n workflow generates them at month start from the definitions.
- When a service is paid, update `movimientos_previstos_mes.estado = 'PAGADO'` AND create a real `movimiento`.

### FX Rates

- Use the [CriptoYa API](https://criptoya.com/api/) — specifically `/api/dolar` for ARS/USD and `/api/brl` for ARS/BRL.
- Cache fetched rates in the `cotizaciones_fx` table via PostgREST to avoid rate-limiting.
- Always display **both blue-rate (blue) and official rate (oficial)** for ARS/USD.

### Currency Handling

- Never perform arithmetic on `numeric` strings — always `parseFloat()` first.
- Format amounts for display using `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` (or USD/BRL as appropriate).
- Never assume ARS — check the `moneda` field on every `movimiento`.

---

## Environment Variables

```text
# PostgREST API
VITE_API_URL=https://api.tudominio.com   # PostgREST base URL on VPS

# Firebase Hosting (only for deploy, not runtime)
# (no client-side Firebase config needed — Firebase is hosting-only now)
```

---

## Documentation Convention (`docs/`)

```text
docs/
  plans/     ← planes de diseño e implementación → YYYY-MM-DD-<feature>.md
  technical/ ← arquitectura, decisiones técnicas → YYYY-MM-DD-<topic>.md
  README.md  ← índice maestro con historial
```

**Reglas:**
- Cada plan debe referenciar el documento de diseño que lo originó.
- Actualizar `docs/README.md` cada vez que se crea un documento.
- Commits de documentación: `docs(plans): ...` / `docs(technical): ...`

---

## Git Conventions

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <description>

Types: feat, fix, refactor, style, docs, chore, test
Scopes: movimientos, tarjetas, servicios, dashboard, cotizaciones, api, ui, db
```

**Examples:**
```bash
git commit -m "feat(movimientos): add income/expense type field to transaction form"
git commit -m "fix(api): handle PostgREST 401 errors gracefully"
git commit -m "style(ui): apply editorial organic theme to dashboard cards"
git commit -m "docs(plans): add implementation plan for tarjetas module"
```

### Branch Naming

```
feat/<feature>       # New functionality
fix/<issue>          # Bug fixes
refactor/<area>      # Refactoring
docs/<topic>         # Documentation only
```

---

## Key Files

| File | Purpose |
|---|---|
| `src/types/index.ts` | All domain types — source of truth |
| `src/config/api.ts` | PostgREST fetch client |
| `src/config/classificationMap.ts` | Unit→Category→Concept→Detail hierarchy |
| `src/App.tsx` | App shell, screen routing, FAB, navigation |
| `docs/plans/2026-03-08-finanzas-rearchitecture-design.md` | Original design document |
| `docs/plans/2026-03-08-finanzas-implementation-plan.md` | Implementation plan |
| `tailwind.config.js` | Tailwind + Editorial Orgánico design tokens |
| `firebase.json` | Hosting config (deploy only) |
| `supabase/migrations/` | SQL migration scripts for the PostgreSQL VPS DB |
