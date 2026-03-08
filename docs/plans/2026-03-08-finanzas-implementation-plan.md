# Finanzas 2.0 Rearchitecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Finanzas application from Firebase to a PostgreSQL + PostgREST backend on a VPS, implementing a dynamic period-based data model, 6 new modules, and an "Editorial Orgánico" UI/UX aesthetic.

**Architecture:** Frontend remains React 19 + TypeScript + Vite. Backend shifts to PostgREST automatically exposing the existing/updated PostgreSQL database as a REST API. We will replace Firebase hooks with generic `fetch` hooks (or SWR/React Query) interacting with PostgREST.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS (needs explicit installation), PostgREST, PostgreSQL, Recharts, Lucide-React.

---

### Phase 1: Foundation & Backend Connection

#### Task 1.1: Install and configure Tailwind CSS
The project currently uses Tailwind classes implicitly via CDN or an external index. We need it properly installed for the new UI to work reliably.

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css` (or `App.css`)
- Modify: `package.json`

**Steps:**
1. Install dependencies: `npm install -D tailwindcss postcss autoprefixer`
2. Initialize Tailwind: `npx tailwindcss init -p`
3. Configure `tailwind.config.js` to scan `./src/**/*.{js,ts,jsx,tsx}`.
4. Add Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) to the main CSS file.
5. Define the "Editorial Orgánico" core color variables in CSS (warm pastels, beige/stone, terracotta/sage/navy accents).

#### Task 1.2: Set up PostgREST API Client
Replace Firebase config with a generic API client for PostgREST.

**Files:**
- Create: `src/config/api.ts`
- Delete: `src/config/firebase.ts`
- Modify: `src/types/index.ts` (Update models to match PostgreSQL snake_case exactly or define mappers)

**Steps:**
1. Create `api.ts` with a base `fetch` wrapper pointing to `import.meta.env.VITE_API_URL`.
2. Implement basic CRUD helper functions (e.g., `apiGet`, `apiPost`, `apiPatch`) that automatically append the `Prefer: return=representation` header required by PostgREST to return created records.

#### Task 1.3: Update Database Schema (Migration Script)
Create a SQL script to run on the VPS database to create the new tables needed for the dynamic model.

**Files:**
- Create: `supabase/migrations/001_finanzas_rearchitecture.sql` (Even if not using Supabase, this is a good convention for SQL scripts)

**Steps:**
1. Write `ALTER TABLE movimientos ADD COLUMN tipo VARCHAR(10) DEFAULT 'gasto';`
2. Write `CREATE TABLE servicios_definicion (...)`, `ingresos_definicion (...)`, `presupuestos_definicion (...)`
3. Write `CREATE TABLE movimientos_previstos_mes (...)`
4. Write `CREATE TABLE cuotas_tarjeta (...)`, `prestamos (...)`, `cotizaciones_fx (...)`
5. (Manual step: Run this script on the VPS PostgreSQL instance via CloudBeaver/SSH).

---

### Phase 2: Core Hooks Refactoring

#### Task 2.1: Refactor useTransactions (Movimientos)
Replace Firestore listeners with PostgREST calls.

**Files:**
- Modify: `src/hooks/useTransactions.ts`

**Steps:**
1. Remove `firebase/firestore` imports.
2. Implement data fetching via the new `api.ts` client (e.g., `GET /movimientos?order=fecha_operation.desc`).
3. Add a `refresh` function to manually re-fetch data (since we no longer have real-time websockets by default with bare PostgREST).
4. Refactor `addTransaction` to `POST /movimientos`.

#### Task 2.2: Refactor useAccounts (Medios de Pago)
Connect accounts (medios_pago) to the new backend.

**Files:**
- Modify: `src/hooks/useAccounts.ts` (Rename to `useMediosPago.ts` to match DB optionally, or map the responses).

**Steps:**
1. Fetch from `GET /medios_pago?activo=eq.true`.
2. Map `nombre` to `name`, `medio_pago` to `id`, etc., to minimize frontend component breakage, or update the types explicitly.

---

### Phase 3: Implementing New Modules & "Editorial Orgánico" UI

For all UI changes, follow the `frontend-design` and `vercel-react-best-practices` guidelines. Use semantic HTML, minimal but effective re-renders, and the new calm color palette.

#### Task 3.1: Global Layout and App Shell Redesign
Implement the warm, calm "Editorial Orgánico" aesthetic.

**Files:**
- Modify: `src/App.tsx`

**Steps:**
1. Remove the current dark/neon background divs and pulse animations.
2. Apply a beige/stone gray background (`bg-stone-50` or similar).
3. Update the Bottom Navigation Bar (Mobile) and Sidebar (Desktop) to use the new color palette (sage green/terracota active states instead of indigo neons).
4. Update the FAB (Floating Action Button) to be soft, rounded, and welcoming (e.g., soft terracotta).

#### Task 3.2: Redesign TransactionForm (Carga Rápida)
Optimize for mobile data entry.

**Files:**
- Modify: `src/components/transactions/TransactionForm.tsx`

**Steps:**
1. Update styling to the new organic theme (rounded inputs, soft shadows, warm borders).
2. Wire up the form to the refactored `useTransactions` hook.
3. Ensure it writes `tipo` (ingreso/gasto) correctly to the backend via PostgREST.

#### Task 3.3: Dashboard Redesign
Implement the desktop/mobile Dashboard view.

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Steps:**
1. Change grid layouts to card-based components with generous padding and soft borders.
2. Replace hardcoded "Enero 2026" with dynamic current month logic.
3. Integrate the new FX widget fetching from `cotizaciones_fx` (or directly from CriptoYa initially).
4. Show a consolidated balance querying the updated `medios_pago` logic.

#### Task 3.4: Rebuild CardsView (Tarjetas y Préstamos)
Connect to the new database tables instead of using hardcoded mock data.

**Files:**
- Modify: `src/components/CardsView.tsx`

**Steps:**
1. Create hooks `useCuotasTarjeta` and `usePrestamos` talking to PostgREST.
2. Remove hardcoded `installments` and `loans` arrays.
3. Implement the UI using the data from the API.
4. Apply the organic typography (e.g., Lora/Serif for headers).

#### Task 3.5: Rebuild ServicesView (Checklist Mensual)
Use the new dynamic Period-Based Model.

**Files:**
- Modify: `src/components/ServicesView.tsx`

**Steps:**
1. Hook into `movimientos_previstos_mes`.
2. Show services due for the *current month*.
3. Implement logic: clicking "Paid" updates the row in `movimientos_previstos_mes` and triggers a creation in `movimientos`.

---

### Phase 4: Verification and Testing

#### Task 4.1: Manual Testing Script
Since the project lacks automated tests, we must perform rigorous manual verification.

**Verification Plan:**
1. **Database Setup:** Verify the SQL migration runs successfully on the VPS via CloudBeaver.
2. **API Connection:** Ensure `VITE_API_URL` correctly points to the PostgREST instance.
3. **Data Integrity (Read):** Open the Dashboard. Verify that existing `movimientos` and `medios_pago` are displayed accurately.
4. **Data Integrity (Write):** Open the FAB. Add a new Gasto and a new Ingreso. Verify they appear in the UI immediately and are persisted correctly in the PostgreSQL `movimientos` table (checking via CloudBeaver).
5. **UI Aesthetic Check:** Open the app on a mobile viewport (Chrome DevTools). Confirm the neon/dark theme is gone and the "Editorial Orgánico" theme (soft corners, terracotta/sage colors, beige background) is applied.
6. **CardsView / ServicesView:** Navigate to these tabs. Verify they no longer display mock data but attempt to fetch from the new endpoints (they may be empty initially, which is expected and correct).

---

### Execution Handoff
Plan complete and saved to `docs/plans/2026-03-08-finanzas-implementation-plan.md` as well as the artifacts directory.

**Execution Option:**
**Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration.

(Waiting for user confirmation to begin execution according to the `writing-plans` workflow).
