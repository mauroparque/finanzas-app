---
name: Estado de fases — Finanzas 2.0
description: Estado actualizado de fases y deuda técnica activa tras cierre de Phase 1 (2026-04-22)
type: project
---

Phase 0 cerrada (2026-04-11). Phase 1 cerrada (2026-04-22).

El proyecto NO usa Zustand. La arquitectura es React hooks → api.ts → PostgREST → PostgreSQL.

**Why:** El commit de refactor Phase 0 en main (f2f7d32) mencionaba Zustand y migration 002, pero el worktree lo corrigió. Phase 1 completó la migración total de Firestore a PostgREST.

**How to apply:** No mencionar Zustand como parte del stack. Firebase es exclusivamente hosting estático.

---

## Hitos de Phase 1 (cerrada 2026-04-22)

- `feat/phase1-foundation` mergeada a `main` (`e087778`)
- Tailscale instalado en VPS, hostname `n8n.tail089052.ts.net`
- PostgREST desplegado en Coolify (Docker, red `coolify`, Traefik TLS terminator)
- `PGRST_DB_URI` corregido → apunta a `finanzas_app` (no `postgres`)
- Rol `web_anon` creado en PostgreSQL + GRANTs a todas las tablas
- `VITE_API_URL` configurado y funcional
- `useServicios.ts` creado (reemplaza `useServices.ts` de Firestore)
- `usePresupuestos.ts` creado (reemplaza `useBudgets.ts` de Firestore)
- `ServicesView.tsx` y `Dashboard.tsx` migrados a PostgREST
- `useServices.ts`, `useBudgets.ts`, `config/firebase.ts` eliminados
- Migrations adicionales ejecutadas: `RENAME fecha_operation → fecha_operacion`; columnas `saldo`, `moneda`, `saldo_inicial` en `medios_pago`
- App en producción (`https://lince-finanzas-app.web.app/`) con cero errores de consola

---

## Deuda técnica activa (al 2026-04-22)

1. **Certificado TLS self-signed** — browsers requieren excepción manual por dispositivo. Bloquea onboarding de Agos.
2. **`saldo` en `medios_pago` = 0** — columnas existen pero necesitan datos reales.
3. **Cálculo `spent` en presupuestos** — client-side sin filtro de mes actual.
4. **Flujo PENDING → PAGADO** en `ServicesView.tsx` — no implementado.

---

## Próxima fase

Phase 2 — Rediseño UI Editorial Orgánico:
- `App.tsx`: quitar dark/neon, aplicar `bg-stone-50`, unificar Screen type
- Dashboard: resumen por Macro, widget FX (CriptoYa)
- Layout responsive: BottomNav mobile / Sidebar desktop
- Defaults "último usado" en `TransactionForm.tsx` (desbloqueador regla 3 taps)
