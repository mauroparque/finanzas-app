# Phase 2 — Rediseño UI + App Shell

**Rama:** `feat/phase2-ui-redesign`  
**Worktree:** `.worktrees/feat-phase2-ui`  
**Fecha:** 2026-04-22  
**Referencia:** `docs/PROJECT_TRACKING.md` § Phase 2

---

## Objetivo

Reemplazar la estética dark/neon de `App.tsx` por el tema "Editorial Orgánico" (stone-50, terracotta, sage, navy) y construir el app shell responsive (BottomNav mobile / Sidebar desktop). Sin cambios en lógica de datos ni hooks — es una fase exclusivamente de UI.

---

## Estado de Partida

- Build limpio en la rama (verificado `npm run build` ✓).
- `tailwind.config.js` con paleta completa ya instalado (Phase 1).
- `App.tsx` usa fondo `bg-[#020617]` con blobs animados indigo/violet — todo a eliminar.
- `Screen` type en `types/index.ts`: `dashboard | movimientos | tarjetas | servicios | analisis | cotizaciones` — **mantener estos valores**, la desalineación con la spec se resuelve en Phase 4.
- `src/components/common/` solo tiene `Modal.tsx` — falta toda la estructura de layout y ui/.

---

## Tareas (en orden de dependencia)

### Paso 1 — UI Primitives (`src/components/common/ui/`)

Crear los componentes base que van a usar todas las vistas. Sin estos, los pasos siguientes no pueden componerse correctamente.

**Archivos a crear:**

#### `src/components/common/ui/Card.tsx`
```
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}
```
- `bg-white rounded-2xl shadow-sm border border-stone-200 p-4`
- Con `onClick` agrega `cursor-pointer hover:shadow-md transition-shadow`

#### `src/components/common/ui/Button.tsx`
```
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
```
- `primary`: `bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl`
- `secondary`: `bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl`
- `ghost`: `text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl`

#### `src/components/common/ui/Badge.tsx`
```
interface BadgeProps {
  label: string;
  color?: 'terracotta' | 'sage' | 'navy' | 'stone' | 'amber' | 'red';
}
```
- Pill shape: `rounded-full px-2.5 py-0.5 text-xs font-medium`
- Colores predefinidos por variante

#### `src/components/common/ui/Input.tsx`
```
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```
- `bg-stone-100 border border-stone-200 rounded-xl focus:border-terracotta-400 focus:ring-terracotta-100`
- Label sobre el campo, error en rojo debajo

---

### Paso 2 — Layout: BottomNav + Sidebar

**`src/components/common/Layout/BottomNav.tsx`**

Props:
```
interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}
```

Items de navegación:
- `dashboard` → icono `Home`, label "Inicio"
- `tarjetas` → icono `CreditCard`, label "Tarjetas"
- `servicios` → icono `ClipboardCheck`, label "Servicios"
- `movimientos` → icono `List`, label "Movimientos"

Estilo:
- `fixed bottom-0 left-0 right-0` con `bg-white border-t border-stone-200`
- Item activo: `text-terracotta-500`, punto indicador debajo del icono
- Item inactivo: `text-stone-400`
- Safe-area padding: `pb-safe` o `pb-4` con `env(safe-area-inset-bottom)`

**`src/components/common/Layout/Sidebar.tsx`**

Props: mismas que BottomNav.

Estilo:
- `hidden md:flex flex-col w-64 bg-white border-r border-stone-200 h-screen sticky top-0`
- Logo/nombre "Finanzas" en terracotta en la parte superior
- Items con icono + label, activo con `bg-terracotta-50 text-terracotta-700 rounded-xl`

---

### Paso 3 — App.tsx — App Shell

**Cambios:**

1. Eliminar blobs animados (`div.fixed` con `animate-pulse`, `blur-[100px]`)
2. Cambiar clase raíz: `bg-[#020617] text-slate-50` → `bg-stone-50 text-stone-800`
3. Eliminar clase `font-sans` custom y `selection:bg-indigo-500/30`
4. Reemplazar `NavItem` inline por `<BottomNav>` + `<Sidebar>`
5. Layout responsive:
   ```tsx
   <div className="flex min-h-screen bg-stone-50">
     <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
     <div className="flex-1 flex flex-col">
       <main className="flex-1 overflow-y-auto pb-20 md:pb-0 px-4 pt-6 max-w-2xl mx-auto w-full">
         {renderScreen()}
       </main>
       <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} className="md:hidden" />
     </div>
   </div>
   ```
6. FAB: cambiar `bg-gradient-to-tr from-indigo-600 to-violet-600` → `bg-terracotta-500 hover:bg-terracotta-600`
7. Eliminar `shadow-[0_8px_30px_rgb(79,70,229,0.4)]` → `shadow-lg`
8. Agregar `movimientos` y `cotizaciones` al `switch/case` (actualmente no están):
   - `movimientos` → `<MovimientosView />` (placeholder vacío si no existe)
   - `cotizaciones` → placeholder (Phase 3)

**Nota:** NO cambiar el tipo `Screen` — `types/index.ts` ya tiene los valores correctos.

---

### Paso 4 — Dashboard.tsx — Rediseño Editorial Orgánico

La vista principal. Actualmente muestra datos reales de PostgREST pero con estilos dark/glassmorphism. Reemplazar estilos, mantener lógica de datos.

**Estructura de la vista (de arriba a abajo):**

```
[Header] "Buenos días, Mauro" + fecha
[Sección: Saldo total] Card grande con saldo total de medios de pago
[Sección: Macros] 4 cards horizontales: VIVIR / TRABAJAR / DEBER / DISFRUTAR con gasto del mes
[Sección: Presupuestos] Cards de barras de progreso por categoría
[Sección: Servicios próximos] Lista de vencimientos del mes
```

**Reglas de estilo:**
- Usar componentes `Card` del Paso 1
- Heading de sección: `text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3`
- Saldo: número grande en `text-3xl font-bold text-stone-900` con formato `Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS'})`
- Macro cards: icono de color por macro + monto en bold
- Presupuesto: barra con `bg-sage-400` para normal, `bg-terracotta-400` si > 80% del límite

---

### Paso 5 — CardsView.tsx + Hooks de Tarjetas

Actualmente `CardsView.tsx` no tiene datos reales. Crear los hooks y conectar.

**Hooks a crear:**

`src/hooks/useCuotasTarjeta.ts`
- GET `/cuotas_tarjeta?estado=eq.ACTIVA` 
- Retorna `{ cuotas, isLoading, error }`

`src/hooks/usePrestamos.ts`
- GET `/prestamos?estado=eq.ACTIVO`
- Retorna `{ prestamos, isLoading, error }`

**CardsView.tsx:**
- Dos secciones: "Cuotas activas" y "Préstamos"
- Si no hay datos: estado vacío con `text-stone-400 text-sm text-center py-8`
- Cada cuota: `Card` con nombre del comercio, monto cuota, `cuota_actual / total_cuotas`
- Cada préstamo: `Card` con nombre, saldo pendiente, próximo vencimiento

---

### Paso 6 — ServicesView.tsx — Flujo PENDING → PAGADO

`ServicesView.tsx` ya tiene el checklist pero falta la acción de marcar como pagado.

**Cambios en `useServicios.ts`:**
- Agregar función `marcarComoPagado(id: number, monto: number)`:
  1. `apiPatch('/movimientos_previstos_mes', id, { estado: 'PAGADO', monto_real: monto })`
  2. `apiPost('/movimientos', { /* gasto generado automáticamente */ })`
  3. Re-fetch de previstos del mes

**Cambios en `ServicesView.tsx`:**
- Botón "Marcar pagado" en cada item PENDING
- Dialog/modal para ingresar el monto real antes de confirmar
- Estado visual: PAGADO = verde + tachado; PENDING = terracotta call-to-action

---

## Orden de Ejecución Recomendado

```
Paso 1 (UI Primitives)
    ↓
Paso 2 (Layout components)
    ↓
Paso 3 (App.tsx shell)     ← punto de integración; build debe pasar antes de seguir
    ↓
Paso 4 (Dashboard)  ──┬──  Paso 5 (CardsView + hooks)  ──── Paso 6 (ServicesView)
                      └── (paralelo: 4, 5 y 6 son independientes entre sí)
```

Pasos 4, 5 y 6 pueden ejecutarse en paralelo con subagentes si se desea acelerar.

---

## Criterios de Aceptación

- [ ] `npm run build` pasa sin errores TypeScript
- [ ] No quedan referencias a `bg-[#020617]`, `indigo-600`, `violet-600`, `slate-900` en App.tsx
- [ ] BottomNav visible en mobile (< md); Sidebar visible en desktop (≥ md)
- [ ] FAB es terracotta-500
- [ ] Dashboard muestra al menos: saldo total + lista de presupuestos con datos reales
- [ ] CardsView no crashea aunque no haya datos en DB
- [ ] ServicesView tiene botón "Marcar pagado" funcional

---

## Deuda Técnica que NO se aborda en Phase 2

- Defaults "último usado" en TransactionForm (trasladado a Phase 3)
- Widget FX en Dashboard (Phase 3 — requiere `useCotizaciones`)
- Motor IA de sugerencia (indefinido)
- Certificado TLS válido (infra, no código)
- Corrección filtro mes en `usePresupuestos` (quick fix, hacerlo como parte del Paso 4 si hay tiempo)
