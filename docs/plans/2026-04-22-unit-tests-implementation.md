# Unit Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish a comprehensive unit testing infrastructure and cover all core hooks and utilities in `src/`.

**Architecture:** Install Vitest + @testing-library/react as the testing stack (native Vite integration, no extra config). Mock `fetch` at the API layer so hooks can be tested in isolation without a real PostgREST backend.

**Tech Stack:** Vitest, @testing-library/react, @testing-library/jest-dom

---

## Phase 1: Infrastructure Setup

### Task 1: Install testing dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Vitest and testing library**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Create vitest config**

Create: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

**Step 3: Create test setup file**

Create: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

**Step 4: Add test scripts to package.json**

In `scripts`, add:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 5: Run test to verify setup works**

```bash
npm run test:run
```
Expected: PASS (no tests yet, but no errors)

**Step 6: Commit**

```bash
git add package.json vitest.config.ts src/test/setup.ts
git commit -m "chore: add Vitest testing infrastructure"
```

---

## Phase 2: API Client Tests (`src/config/api.ts`)

### Task 2: Test API CRUD helpers

**Files:**
- Test: `src/config/api.test.ts`
- Setup: `src/test/helpers.ts`

**Step 1: Create fetch mock helper**

Create: `src/test/helpers.ts`

```typescript
export const mockFetch = (response: unknown, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(ok ? '' : 'Bad request'),
  }) as jest.Mock;
};

export const mockFetch204 = () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 204,
    json: () => Promise.resolve(undefined),
    text: () => Promise.resolve(''),
  }) as jest.Mock;
};
```

**Step 2: Write tests for apiGet, apiPost, apiPatch, apiDelete**

Create: `src/config/api.test.ts`

- Test `apiGet` returns typed array, passes query params, throws on non-ok
- Test `apiPost` sends body as JSON, returns created record
- Test `apiPatch` sends filter params and partial body
- Test `apiDelete` sends DELETE with filter params

**Step 3: Run tests and verify pass**

```bash
npm run test:run src/config/api.test.ts
```

**Step 4: Commit**

```bash
git add src/config/api.test.ts src/test/helpers.ts
git commit -m "test(api): add unit tests for PostgREST CRUD helpers"
```

---

## Phase 3: Classification Map Tests

### Task 3: Test classification hierarchy helpers

**Files:**
- Test: `src/config/classificationMap.test.ts`

**Step 1: Write tests for all helper functions**

```typescript
// getMacroConfig, getCategoriesForMacro, getCategoriesForUnit,
// getConceptsForCategory, getDetailsForConcept, getMacros,
// getAllCategories, getAllConcepts
```

**Step 2: Run tests and verify pass**

```bash
npm run test:run src/config/classificationMap.test.ts
```

**Step 3: Commit**

```bash
git add src/config/classificationMap.test.ts
git commit -m "test(classificationMap): add unit tests for hierarchy helpers"
```

---

## Phase 4: Hook Tests

### Task 4: Test useTransactions hook

**Files:**
- Test: `src/hooks/useTransactions.test.ts`

Tests:
- Fetches transactions on mount
- Returns transactions array
- Applies unidad filter
- Adds transaction and updates local state
- Updates transaction
- Deletes transaction and updates local state

### Task 5: Test useMediosPago hook

**Files:**
- Test: `src/hooks/useMediosPago.test.ts`

Tests:
- Fetches medios de pago on mount (activo filter)
- Returns both accounts alias and mediosPago
- Fetches all when onlyActive is false
- Adds medio de pago

### Task 6: Test useServicios hook

**Files:**
- Test: `src/hooks/useServicios.test.ts`

Tests:
- Fetches both movimientosPrevistos and servicios
- updateEstado changes estado and sets fecha_pago when PAID
- addServicio adds new servicio

### Task 7: Test usePresupuestos hook

**Files:**
- Test: `src/hooks/usePresupuestos.test.ts`

Tests:
- Fetches presupuestos with activo filter
- Applies unidad filter when provided
- Returns empty array when no presupuestos

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Vitest infrastructure | `package.json`, `vitest.config.ts`, `src/test/setup.ts` |
| 2 | API client tests | `src/config/api.test.ts`, `src/test/helpers.ts` |
| 3 | Classification map tests | `src/config/classificationMap.test.ts` |
| 4 | useTransactions tests | `src/hooks/useTransactions.test.ts` |
| 5 | useMediosPago tests | `src/hooks/useMediosPago.test.ts` |
| 6 | useServicios tests | `src/hooks/useServicios.test.ts` |
| 7 | usePresupuestos tests | `src/hooks/usePresupuestos.test.ts` |

---

## Execution Options

**Plan complete and saved to `docs/plans/2026-04-22-unit-tests-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
