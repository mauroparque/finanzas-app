# Phase 3: Editorial Orgánico UI & New Modules — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the app from its current dark/indigo theme to the "Editorial Orgánico" design system, fix critical bugs, create the missing UI primitive layer, and connect the three remaining modules (CardsView, ServicesView completion, Dashboard FX widget) to real API data.

**Architecture:** Layer-cake refactor — start with utility primitives (cn, formatters, fx), then build UI components (Button, Card, Badge, Input), then refactor each view bottom-up. All data flows through custom hooks in `src/hooks/` → PostgREST via `src/config/api.ts`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS (Editorial Orgánico tokens), Recharts, Lucide-React, PostgREST API.

**Pre-existing conditions (from Phase 1 & 2):**
- Tailwind CSS configured with Editorial Orgánico tokens in `tailwind.config.js`
- PostgREST API client in `src/config/api.ts` with CRUD helpers
- Hooks: `useTransactions`, `useMediosPago`, `usePresupuestos`, `useServicios` — all functional
- Missing hooks: `useCotizaciones`, `useCuotasTarjeta`, `usePrestamos`
- Classification hierarchy in `src/config/classificationMap.ts` — **has critical mapping bug**

**Critical bugs to fix during Phase 3:**
1. **Classification mismatch:** `Unidad` type (`HOGAR/PROFESIONAL/BRASIL`) ≠ `MacroConfig` names (`VIVIR/TRABAJAR/DEBER/DISFRUTAR`). TransactionForm cascading dropdowns will fail silently.
2. **Disconnected uiStore:** `App.tsx` uses local `useState<Screen>` instead of `useUIStore`, and `uiStore.activeScreen` defaults to `'inicio'` (not a valid `Screen`).
3. **ServicesView dual-write gap:** Marking a service as PAID only updates `movimientos_previstos_mes.estado` — does NOT create a `movimiento` record.
4. **Tailwind JIT dynamic classes:** Dashboard uses `bg-${color}-500/10` which Tailwind cannot detect at build time.

---

## Task 3.0: Create utility layer (cn, formatters, fx)

**Files:**
- Create: `src/utils/cn.ts`
- Create: `src/utils/formatters.ts`
- Create: `src/utils/fx.ts`

**Step 1: Write failing tests for formatters**

Create `src/utils/formatters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatNumber } from './formatters';

describe('formatCurrency', () => {
  it('formats ARS currency', () => {
    expect(formatCurrency(1234.56, 'ARS')).toContain('1.234,56');
  });
  it('formats USD currency', () => {
    expect(formatCurrency(100, 'USD')).toContain('100');
  });
  it('formats BRL currency', () => {
    expect(formatCurrency(50, 'BRL')).toContain('50');
  });
});

describe('formatDate', () => {
  it('formats ISO date string to locale', () => {
    const result = formatDate('2026-04-22T10:00:00Z');
    expect(result).toBeTruthy();
  });
});

describe('formatNumber', () => {
  it('formats with 2 decimals', () => {
    expect(formatNumber(1234.5)).toContain('1.234,5');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/formatters.test.ts`
Expected: FAIL — module not found

**Step 3: Implement `src/utils/cn.ts`**

```typescript
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

**Step 4: Implement `src/utils/formatters.ts`**

```typescript
const currencyFormatters: Record<string, Intl.NumberFormat> = {};

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  if (!currencyFormatters[currency]) {
    const localeMap: Record<string, string> = {
      ARS: 'es-AR',
      USD: 'en-US',
      USDT: 'en-US',
      BRL: 'pt-BR',
    };
    currencyFormatters[currency] = new Intl.NumberFormat(localeMap[currency] ?? 'es-AR', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return currencyFormatters[currency];
}

export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return getCurrencyFormatter(currency).format(amount);
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
```

**Step 5: Implement `src/utils/fx.ts`**

```typescript
import type { CotizacionFX, CotizacionDisplay, Moneda } from '../types';

export function cotizacionesToDisplay(
  rates: CotizacionFX[],
  labels?: Record<string, string>
): CotizacionDisplay[] {
  return rates.map(rate => ({
    label: labels?.[`${rate.par}_${rate.tipo}`] ?? `${rate.par} ${rate.tipo}`,
    compra: rate.compra,
    venta: rate.venta,
    tipo: rate.tipo,
  }));
}

export function convertAmount(
  amount: number,
  fromCurrency: Moneda,
  toCurrency: Moneda,
  rates: CotizacionFX[]
): number {
  if (fromCurrency === toCurrency) return amount;
  const par = `${fromCurrency}_${toCurrency}`;
  const rate = rates.find(r => r.par === par);
  if (!rate) {
    throw new Error(`No FX rate found for ${par}`);
  }
  return parseFloat((amount * rate.venta).toFixed(2));
}

export function getLatestRate(
  rates: CotizacionFX[],
  par: string,
  tipo: string
): CotizacionFX | undefined {
  return rates
    .filter(r => r.par === par && r.tipo === tipo)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
}
```

**Step 6: Run tests to verify they pass**

Run: `npx vitest run src/utils/`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add src/utils/cn.ts src/utils/formatters.ts src/utils/fx.ts src/utils/formatters.test.ts
git commit -m "feat(utils): add cn, formatters, and fx utility modules"
```

---

## Task 3.1: Fix classification mapping bug

The `Unidad` type has values `HOGAR | PROFESIONAL | BRASIL` but `CLASSIFICATION_MAP` uses `VIVIR | TRABAJAR | DEBER | DISFRUTAR` as macro names. The `getCategoriesForUnit()` function passes unit values directly to `getCategoriesForMacro()` which expects macro names, causing cascading dropdowns to return `undefined`.

**Files:**
- Modify: `src/config/classificationMap.ts:44-60` (the mapping functions)
- Modify: `src/types/index.ts:25` (add `Macro` type)
- Test: `src/config/classificationMap.test.ts` (already exists)

**Step 1: Write failing test for the unit→macro mapping**

Add to `src/config/classificationMap.test.ts`:

```typescript
describe('unit-to-macro mapping', () => {
  it('maps HOGAR to VIVIR categories', () => {
    const cats = getCategoriesForUnit('HOGAR');
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.some(c => c.nombre === 'Vivienda y Vida Diaria')).toBe(true);
  });
  it('maps PROFESIONAL to TRABAJAR categories', () => {
    const cats = getCategoriesForUnit('PROFESIONAL');
    expect(cats.length).toBeGreaterThan(0);
  });
  it('maps BRASIL to DEBER categories', () => {
    const cats = getCategoriesForUnit('BRASIL');
    expect(cats.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/config/classificationMap.test.ts`
Expected: FAIL — `getCategoriesForUnit('HOGAR')` returns `undefined`

**Step 3: Add `Macro` type to `src/types/index.ts`**

After `Unidad` type definition (line 25), add:

```typescript
export type Macro = 'VIVIR' | 'TRABAJAR' | 'DEBER' | 'DISFRUTAR';
```

And add the mapping constant:

```typescript
export const UNIDAD_TO_MACRO: Record<Unidad, Macro> = {
  HOGAR: 'VIVIR',
  PROFESIONAL: 'TRABAJAR',
  BRASIL: 'DEBER',
};
```

**Step 4: Fix `classificationMap.ts` — update `getCategoriesForUnit` to use the mapping**

Replace the current `getCategoriesForUnit` implementation with:

```typescript
import { UNIDAD_TO_MACRO } from '../types';
import type { Unidad } from '../types';

export function getCategoriesForUnit(unitOrMacro: Unidad): CategoryOption[] {
  const macroName = UNIDAD_TO_MACRO[unitOrMacro] ?? unitOrMacro;
  return getCategoriesForMacro(macroName);
}
```

Similarly update `getConceptsForCategory` and `getDetailsForConcept` to accept `Unidad | Macro` and resolve through the mapping when needed.

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/config/classificationMap.test.ts`
Expected: ALL PASS

**Step 6: Run full test suite**

Run: `npx vitest run`
Expected: No regressions (existing 10 failures in api.test.ts are pre-existing)

**Step 7: Commit**

```bash
git add src/types/index.ts src/config/classificationMap.ts
git commit -m "fix(classification): map Unidad (HOGAR/PROFESIONAL/BRASIL) to Macro names for cascading dropdowns"
```

---

## Task 3.2: Create UI primitive components (Button, Card, Badge, Input)

**Files:**
- Create: `src/components/common/ui/Button.tsx`
- Create: `src/components/common/ui/Card.tsx`
- Create: `src/components/common/ui/Badge.tsx`
- Create: `src/components/common/ui/Input.tsx`
- Create: `src/components/common/ui/index.ts`

**Step 1: Implement `Button.tsx`**

```tsx
import { type ButtonHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700',
  secondary: 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700',
  ghost: 'bg-transparent text-stone-700 hover:bg-stone-100 active:bg-stone-200',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Step 2: Implement `Card.tsx`**

```tsx
import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'card' | 'float';
}

const shadowMap = {
  none: '',
  soft: 'shadow-soft',
  card: 'shadow-card',
  float: 'shadow-float',
};

export function Card({
  children,
  padding = 'md',
  shadow = 'soft',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-stone-200',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-7',
        shadowMap[shadow],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

**Step 3: Implement `Badge.tsx`**

```tsx
import { type HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'terracotta' | 'sage' | 'navy' | 'warning' | 'success';
}

const variantStyles = {
  default: 'bg-stone-100 text-stone-700',
  terracotta: 'bg-terracotta-50 text-terracotta-700',
  sage: 'bg-sage-50 text-sage-700',
  navy: 'bg-navy-50 text-navy-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
```

**Step 4: Implement `Input.tsx`**

```tsx
import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800',
            'placeholder:text-stone-400',
            'focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-200 focus:outline-none',
            'transition-colors duration-150',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
```

**Step 5: Create barrel export `index.ts`**

```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Badge } from './Badge';
export { Input } from './Input';
```

**Step 6: Commit**

```bash
git add src/components/common/ui/
git commit -m "feat(ui): add Button, Card, Badge, Input primitive components with Editorial Orgánico tokens"
```

---

## Task 3.3: Create Layout components (BottomNav, Sidebar) and refactor App Shell

**Files:**
- Create: `src/components/common/Layout/BottomNav.tsx`
- Create: `src/components/common/Layout/Sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/stores/uiStore.ts` (fix `activeScreen` default + connect to App)

**Step 1: Fix `uiStore.ts` — set default screen to `'dashboard'` and align Screen type**

Update `uiStore.ts` default value of `activeScreen` from `'inicio'` to `'dashboard'`.

**Step 2: Implement `BottomNav.tsx`**

Mobile bottom navigation with the Editorial Orgánico palette. Uses `Screen` type from types. Deeply rounds active item, terracotta accent for active state.

```tsx
import { Home, CreditCard, ClipboardCheck, TrendingUp, DollarSign, List } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Screen } from '../../types';

interface NavItem {
  screen: Screen;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { screen: 'dashboard', label: 'Inicio', icon: <Home size={20} /> },
  { screen: 'movimientos', label: 'Movimientos', icon: <List size={20} /> },
  { screen: 'tarjetas', label: 'Tarjetas', icon: <CreditCard size={20} /> },
  { screen: 'servicios', label: 'Servicios', icon: <ClipboardCheck size={20} /> },
  { screen: 'cotizaciones', label: 'Cotizaciones', icon: <DollarSign size={20} /> },
  { screen: 'analisis', label: 'Análisis', icon: <TrendingUp size={20} /> },
];

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 pb-safe md:hidden">
      <ul className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ screen, label, icon }) => (
          <li key={screen}>
            <button
              onClick={() => onNavigate(screen)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors duration-150',
                activeScreen === screen
                  ? 'text-terracotta-600'
                  : 'text-stone-400 hover:text-stone-600',
              )}
              aria-label={label}
            >
              {icon}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

**Step 3: Implement `Sidebar.tsx`**

Desktop sidebar, visible `md:` and above. Same nav items, vertical layout. Serif font for section headers.

```tsx
import { Home, CreditCard, ClipboardCheck, TrendingUp, DollarSign, List } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Screen } from '../../types';

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  { screen: 'dashboard', label: 'Inicio', icon: <Home size={20} /> },
  { screen: 'movimientos', label: 'Movimientos', icon: <List size={20} /> },
  { screen: 'tarjetas', label: 'Tarjetas', icon: <CreditCard size={20} /> },
  { screen: 'servicios', label: 'Servicios', icon: <ClipboardCheck size={20} /> },
  { screen: 'cotizaciones', label: 'Cotizaciones', icon: <DollarSign size={20} /> },
  { screen: 'analisis', label: 'Análisis', icon: <TrendingUp size={20} /> },
];

export function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-stone-200">
      <div className="p-6">
        <h1 className="font-serif text-xl text-navy-800">Finanzas</h1>
        <p className="text-sm text-stone-400 mt-1">Mau & Agos</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ screen, label, icon }) => (
          <button
            key={screen}
            onClick={() => onNavigate(screen)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
              activeScreen === screen
                ? 'bg-terracotta-50 text-terracotta-700'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
```

**Step 4: Refactor `App.tsx` — replace local state with uiStore + Editorial Orgánico shell**

Replace the current dark theme shell with:
- `useUIStore` for `activeScreen` and modal state
- `bg-stone-50` background
- `<Sidebar>` for desktop, `<BottomNav>` for mobile
- Terracotta FAB button
- Proper `<main>` layout with padding for bottom nav
- All 6 screens routed (with stubs for `movimientos`, `analisis`, `cotizaciones`)

The App.tsx should:
1. Import `useUIStore` for `activeScreen`, `toggleModal`, `isModalOpen`
2. Render `<Sidebar>` + `<BottomNav>` + `<main>`
3. Switch over `Screen` type for conditional rendering
4. FAB opens `TransactionForm` inside `Modal`
5. Remove all dark/neon styling (`bg-[#020617]`, gradient backgrounds, blur orbs)

**Step 5: Commit**

```bash
git add src/components/common/Layout/ src/App.tsx src/stores/uiStore.ts
git commit -m "feat(ui): create BottomNav and Sidebar layout components, refactor App shell to Editorial Orgánico theme and uiStore navigation"
```

---

## Task 3.4: Redesign TransactionForm with Editorial Orgánico theme

**Files:**
- Modify: `src/components/transactions/TransactionForm.tsx`

**Step 1: Refactor TransactionForm styling**

Replace all indigo/violet/dark styles with Editorial Orgánico tokens:
- Container: `bg-white rounded-3xl p-6`
- Type toggle: Terracotta for "gasto", sage for "ingreso"
- Input fields: Use the new `<Input>` component
- Unit buttons: `bg-stone-100` inactive, `bg-terracotta-500 text-white` active
- Category/concept/detail selects: Rounded `border-stone-300 focus:border-terracotta-400`
- Account grid: Soft `bg-stone-50` cards with `rounded-2xl`
- Submit button: Terracotta primary `<Button>`
- Ensure the 3-tap rule: Default unit to most recently used (or `HOGAR`), category/concept auto-selected from classification map using the fixed `getCategoriesForUnit` from Task 3.1

**Step 2: Verify manual interaction**

Open the form via FAB. In ≤3 taps, a user should be able to:
1. Tap type (gasto/ingreso)
2. Tap amount
3. Tap submit

Unit, category, and concept must auto-populate with defaults.

**Step 3: Commit**

```bash
git add src/components/transactions/TransactionForm.tsx
git commit -m "style(transactions): redesign TransactionForm with Editorial Orgánico theme and 3-tap defaults"
```

---

## Task 3.5: Dashboard redesign with FX widget

**Files:**
- Create: `src/hooks/useCotizaciones.ts`
- Create: `src/components/common/CotizacionWidget.tsx`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Create `useCotizaciones` hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../config/api';
import type { CotizacionFX } from '../types';

export const useCotizaciones = () => {
  const [rates, setRates] = useState<CotizacionFX[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<CotizacionFX>('/cotizaciones_fx', {
        order: 'timestamp.desc',
        limit: '20',
      });
      setRates(data);
    } catch (err) {
      console.error('Error fetching cotizaciones:', err);
      setError('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { rates, loading, error, refresh: fetchRates };
};
```

**Step 2: Create `CotizacionWidget` component**

A card displaying USD/ARS (blue + oficial) and BRL/ARS rates using `CotizacionDisplay` and `formatCurrency`. Uses `<Card>` component. Shows compra/venta for each par_tipo.

**Step 3: Redesign Dashboard**

- Replace dark gradients with `bg-stone-50` page + `<Card>` sections
- Fix `bg-${color}-500/10` JIT issue by using a static mapping object:
  ```typescript
  const bgMap = { emerald: 'bg-emerald-500/10', amber: 'bg-amber-500/10', rose: 'bg-rose-500/10' };
  ```
- Add `<CotizacionWidget>` in a section below presupuestos
- Use `font-serif` for section titles (Lora headings)
- Show consolidated balance from `useMediosPago`
- Wire "Ver todo el calendario" button to navigate to servicios screen via `onNavigate`

**Step 4: Commit**

```bash
git add src/hooks/useCotizaciones.ts src/components/common/CotizacionWidget.tsx src/components/Dashboard.tsx
git commit -m "feat(dashboard): redesign with Editorial Orgánico theme, add FX cotizaciones widget, fix Tailwind JIT classes"
```

---

## Task 3.6: Create useCuotasTarjeta and usePrestamos hooks

**Files:**
- Create: `src/hooks/useCuotasTarjeta.ts`
- Create: `src/hooks/usePrestamos.ts`
- Create: `src/hooks/useCuotasTarjeta.test.ts`
- Create: `src/hooks/usePrestamos.test.ts`

**Step 1: Write failing test for useCuotasTarjeta**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCuotasTarjeta } from './useCuotasTarjeta';

vi.mock('../config/api', () => ({
  apiGet: vi.fn().mockResolvedValue([
    { id: 1, descripcion: 'TV Samsung', tarjeta: 'Visa', monto_cuota: 15000, moneda: 'ARS', cuota_actual: 3, total_cuotas: 12, fecha_inicio: '2026-01-15', unidad: 'HOGAR', categoria: 'Vivienda y Vida Diaria', concepto: 'Equipamiento', detalle: 'TV Samurai 55"', activo: true },
  ]),
}));

describe('useCuotasTarjeta', () => {
  it('fetches installments on mount', async () => {
    const { result } = renderHook(() => useCuotasTarjeta());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cuotas.length).toBe(1);
    expect(result.current.cuotas[0].descripcion).toBe('TV Samsung');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useCuotasTarjeta.test.ts`
Expected: FAIL — module not found

**Step 3: Implement `useCuotasTarjeta.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch } from '../config/api';
import type { CuotaTarjeta } from '../types';

export const useCuotasTarjeta = (tarjeta?: string) => {
  const [cuotas, setCuotas] = useState<CuotaTarjeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuotas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        activo: 'eq.true',
        order: 'fecha_inicio.desc',
      };
      if (tarjeta) {
        params.tarjeta = `eq.${tarjeta}`;
      }
      const data = await apiGet<CuotaTarjeta>('/cuotas_tarjeta', params);
      setCuotas(data);
    } catch (err) {
      console.error('Error fetching cuotas:', err);
      setError('Error al cargar cuotas');
    } finally {
      setLoading(false);
    }
  }, [tarjeta]);

  useEffect(() => {
    fetchCuotas();
  }, [fetchCuotas]);

  const updateCuota = async (id: number, updates: Partial<CuotaTarjeta>) => {
    try {
      const updated = await apiPatch<CuotaTarjeta, CuotaTarjeta>(
        '/cuotas_tarjeta',
        { id: `eq.${id}` },
        updates,
      );
      if (updated.length > 0) {
        setCuotas(prev => prev.map(c => (c.id === id ? updated[0] : c)));
      }
    } catch (err) {
      console.error('Error updating cuota:', err);
      throw err;
    }
  };

  return { cuotas, loading, error, updateCuota, refresh: fetchCuotas };
};
```

**Step 4: Write test for usePrestamos and implement similarly**

Same pattern: `apiGet` `/prestamos?activo=eq.true`, with `updatePrestamo` via `apiPatch`.

**Step 5: Run all hook tests**

Run: `npx vitest run src/hooks/`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/hooks/useCuotasTarjeta.ts src/hooks/usePrestamos.ts src/hooks/useCuotasTarjeta.test.ts src/hooks/usePrestamos.test.ts
git commit -m "feat(hooks): add useCuotasTarjeta and usePrestamos hooks with PostgREST integration"
```

---

## Task 3.7: Rebuild CardsView (Tarjetas) with real data

**Files:**
- Modify: `src/components/CardsView.tsx` (or `TarjetasView.tsx` if renamed)
- Delete: All hardcoded mock data arrays

**Step 1: Replace mock data with hooks**

- Import `useCuotasTarjeta` and `usePrestamos`
- Replace `projectionData`, `installments`, `loans` arrays with hook data
- Add loading/error states

**Step 2: Redesign visual theme**

- Remove indigo/violet gradients
- Use `<Card>` component with `shadow="card"` for each item
- Type toggle (Visa/Master vs Préstamos): Use `bg-stone-100` default, `bg-terracotta-500` active
- Progress bars: Terracotta for cuotas progress, navy for loans progress
- Typography: `font-serif` for section headings, `font-mono` for currency amounts
- Group cuotas by `tarjeta` field if multiple cards exist

**Step 3: Verify in browser**

Navigate to Tarjetas tab. Should show empty state if no data, or real installment/loan data from API.

**Step 4: Commit**

```bash
git add src/components/CardsView.tsx
git commit -m "feat(tarjetas): rebuild CardsView with real API data, Editorial Orgánico theme, and remove mock data"
```

---

## Task 3.8: Complete ServicesView — add dual-write on PAID

**Files:**
- Modify: `src/hooks/useServicios.ts`
- Modify: `src/components/ServicesView.tsx`

**Step 1: Fix the dual-write in `useServicios`**

When `updateEstado(id, 'PAGADO')` is called, it must also create a corresponding `movimiento` record. Add a `markAsPaid` function that:

1. Calls `apiPatch('/movimientos_previstos_mes', { id: eq.${id} }, { estado: 'PAGADO', fecha_pago: now })`
2. Looks up the corresponding `servicios_definicion` to get the classification fields
3. Calls `apiPost('/movimientos', { ...movimiento fields from the definition })`
4. Updates both local states

```typescript
const markAsPaid = async (
  previstoId: number,
  servicioDef: ServicioDefinicion,
  medioPagoNombre: string,
) => {
  try {
    const updated = await apiPatch<MovimientoPrevisto, MovimientoPrevisto>(
      '/movimientos_previstos_mes',
      { id: `eq.${previstoId}` },
      { estado: 'PAGADO', fecha_pago: new Date().toISOString() },
    );

    const movimiento = await apiPost<MovimientoInput, Movimiento>('/movimientos', {
      tipo: 'gasto',
      monto: previsto.monto_real ?? previsto.monto_estimado ?? 0,
      moneda: previsto.moneda,
      unidad: servicioDef.unidad,
      categoria: servicioDef.categoria,
      concepto: servicioDef.concepto,
      detalle: servicioDef.detalle ?? servicioDef.nombre,
      fecha_operacion: new Date().toISOString(),
      medio_pago: medioPagoNombre,
      fuente: 'manual',
    });

    setMovimientosPrevistos(prev =>
      prev.map(mp => (mp.id === previstoId ? { ...mp, ...updated[0] } : mp)),
    );
    return movimiento;
  } catch (err) {
    console.error('Error marking as paid:', err);
    throw err;
  }
};
```

**Step 2: Update `ServicesView.tsx` to use `markAsPaid`**

When user clicks to mark PAID, call `markAsPaid` instead of the simple `updateEstado`. Show the medio_pago selector when transitioning to PAID.

**Step 3: Redesign ServicesView with Editorial Orgánico theme**

- Replace dark/amber states with Editorial Orgánico colors:
  - `PENDING`: `bg-stone-100` with `text-stone-600`
  - `RESERVED`: `bg-amber-50` with `text-amber-700`
  - `PAID`/`PAGADO`: `bg-sage-50` with `text-sage-700`
- Use `<Card>` for each service item
- Section titles in `font-serif`
- Add servicio form inside existing `<Modal>` with `<Input>` components

**Step 4: Commit**

```bash
git add src/hooks/useServicios.ts src/components/ServicesView.tsx
git commit -m "feat(servicios): implement dual-write on PAID (create movimiento + update previsto), redesign with Editorial Orgánico theme"
```

---

## Task 3.9: Create stub views for missing screens

**Files:**
- Create: `src/components/MovimientosView.tsx`
- Create: `src/components/AnalisisView.tsx`
- Create: `src/components/CotizacionesView.tsx`

**Step 1: Create MovimientosView stub**

A simple list view that uses `useTransactions()` to show recent movimientos with type badge (gasto/ingreso), amount, date. Uses Editorial Orgánico tokens.

**Step 2: Create AnalisisView stub**

Desktop-first placeholder with a message: "Vista de análisis — próximamente". Uses `React.lazy` pattern.

**Step 3: Create CotizacionesView stub**

Uses `useCotizaciones()` to display FX rates in a card layout. Shows compra/venta for each par_tipo.

**Step 4: Update App.tsx switch/case to render these new views**

All 6 `Screen` cases should now render real components instead of missing.

**Step 5: Commit**

```bash
git add src/components/MovimientosView.tsx src/components/AnalisisView.tsx src/components/CotizacionesView.tsx src/App.tsx
git commit -m "feat(views): create MovimientosView, AnalisisView, and CotizacionesView stubs with real data hooks"
```

---

## Task 3.10: Remove orphaned code and legacy types

**Files:**
- Modify: `src/types/index.ts` — Remove `@deprecated` legacy types (`Transaction`, `Account`, `ServiceStatus`, `Service`, `ServiceItem`, `Budget`, `BudgetCategory`, `CreditCardItem`, `RecurringConfig`)
- Delete: `src/stores/transactionStore.ts` — Orphaned store referencing undefined types, not imported anywhere

**Step 1: Verify `transactionStore.ts` is unused**

Run: `grep -r "transactionStore" src/ --include="*.ts" --include="*.tsx"`
Expected: Only the file itself (no imports)

**Step 2: Delete `transactionStore.ts`**

**Step 3: Remove deprecated type aliases and interfaces from `types/index.ts`**

Remove lines 221-301 (all `@deprecated` types). Run type check after.

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors (or only pre-existing ones)

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(types): remove deprecated legacy types and orphaned transactionStore"
```

---

## Summary

| Task | What | Key Deliverable |
|------|------|-----------------|
| 3.0 | Utility layer | `cn`, `formatters`, `fx` modules |
| 3.1 | Fix classification bug | `UNIDAD_TO_MACRO` mapping, cascading dropdowns work |
| 3.2 | UI primitives | `Button`, `Card`, `Badge`, `Input` components |
| 3.3 | Layout + App Shell | `BottomNav`, `Sidebar`, refactor `App.tsx` to `uiStore` + theme |
| 3.4 | TransactionForm redesign | Editorial Orgánico theme, 3-tap rule preserved |
| 3.5 | Dashboard + FX widget | `useCotizaciones`, `CotizacionWidget`, redesign |
| 3.6 | New hooks | `useCuotasTarjeta`, `usePrestamos` with tests |
| 3.7 | CardsView rebuild | Real API data, no mock data, organic theme |
| 3.8 | ServicesView dual-write | `markAsPaid` creates `movimiento` + updates `previsto` |
| 3.9 | Stub views | `MovimientosView`, `AnalisisView`, `CotizacionesView` |
| 3.10 | Cleanup | Remove deprecated types, delete orphaned store |

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-04-22-phase3-editorial-organico.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration.

**2. Parallel Session (separate)** — Open new session in worktree, use `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**