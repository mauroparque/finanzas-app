# Migración del backend a Supabase

**Fecha:** 2026-04-27
**Estado:** Design — pendiente de plan de implementación
**Autor:** Mauro (con Claude)

---

## 1. Contexto y motivación

El backend actual de Finanzas 2.0 corre en un VPS gestionado con Coolify:
**PostgreSQL + PostgREST + n8n**, expuesto al frontend (Firebase Hosting)
mediante Tailscale (`https://n8n.tail089052.ts.net`). Esta arquitectura tiene
dos problemas concretos documentados en `docs/PROJECT_TRACKING.md` (hallazgo
**D1**, riesgo alto):

1. **Certificado TLS self-signed** en PostgREST. Bloquea el onboarding de Agos
   desde su teléfono y de cualquier usuario externo a la red Tailscale.
2. **Tailscale acopla auth de red con auth de aplicación.** No es viable para
   una PWA pública: cada usuario necesitaría instalar el cliente Tailscale.

Las restricciones del usuario para resolverlo:

- **No mezclar dominios.** El dominio existente (`lumensaludmental.com`) es
  para una app clínica separada y no debe albergar la API de uso doméstico.
- **No incurrir en gasto adicional** (descarta comprar un dominio dedicado).

**Decisión:** migrar el backend a **Supabase** (free tier).

## 2. Por qué Supabase

- El motor de Supabase es **PostgreSQL + PostgREST** — el mismo stack que ya
  usa el frontend. La capa `src/config/api.ts` y los hooks de dominio
  funcionan con cambios quirúrgicos (URL + headers de auth).
- Provee URL pública con TLS válido (`https://<proyecto>.supabase.co`) sin
  configurar dominios.
- Auth gestionado (email + password) resuelve el bloqueo de Agos.
- Free tier (500 MB DB, 5 GB bandwidth/mes, requests ilimitadas) es holgado
  para una app financiera personal/familiar.
- La carpeta `supabase/migrations/` del repo ya estaba pensada para este
  destino.

Alternativas consideradas y descartadas:

- **Cloudflare Tunnel + VPS:** mantiene la DB en VPS, pero sin un dominio
  propio el hostname queda atado a `cfargotunnel.com` (poco profesional y
  acoplado al proveedor).
- **Comprar un dominio dedicado:** ~USD 10-15/año. Descartado por la
  restricción de no incurrir en gasto.

## 3. Arquitectura objetivo

```
┌─────────────────────┐     ┌──────────────────────────┐
│ React PWA           │────▶│ Supabase                 │
│ (Firebase Hosting)  │     │  - PostgreSQL            │
└─────────────────────┘     │  - PostgREST (REST API)  │
                            │  - Auth (email+password) │
                            └────────▲─────────────────┘
                                     │ service_role key
                            ┌────────┴─────────────────┐
                            │ VPS (Coolify)            │
                            │  - n8n                   │
                            │  - Telegram bot worker   │
                            └──────────────────────────┘
```

**Sale del VPS:** PostgreSQL, PostgREST, gateway Tailscale.
**Permanece en el VPS:** n8n y el bot de Telegram. Apuntan a Supabase vía la
URL pública con `service_role key` (bypass de RLS).

## 4. Decisiones de diseño

### 4.1 Modelo de auth: email + password

Supabase Auth con email + password tradicional. Se descartó magic link por la
fricción de tener que ir al mail al expirar la sesión o cambiar de
dispositivo. La sesión persiste con refresh token (configurable, default
~1 h de access token + refresh largo).

Usuarios provisionados manualmente vía dashboard de Supabase: Mau y Agos. No
hay flujo de signup público.

### 4.2 Política de acceso: compartido total (RLS)

Mau y Agos ven y editan todos los datos. Es una app de finanzas familiares;
no hay datos privados por usuario.

Para cada tabla operativa (`movimientos`, `medios_pago`,
`categorias_maestras`, `servicios_definicion`, `ingresos_definicion`,
`presupuestos_definicion`, `movimientos_previstos_mes`, `cuotas_tarjeta`,
`prestamos`, `cotizaciones_fx`):

```sql
ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON <tabla>
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

Tablas internas usadas por el bot/n8n (`bot_sessions`, `chat_histories`):
RLS habilitada **sin policy para `authenticated`**. Solo accesibles vía
`service_role key` desde n8n. Esto evita que el frontend pueda leerlas.

### 4.3 Cliente HTTP: mantener `fetch` crudo, evaluar `@supabase/supabase-js` después

Fase inicial: extender `src/config/api.ts` para inyectar headers
`apikey` + `Authorization: Bearer <jwt>` y un interceptor de refresh ante
401. Cambio quirúrgico, mantiene los tests existentes y todos los hooks
funcionan sin tocarse.

Refactor opcional posterior (fuera del scope de esta migración): adoptar
`@supabase/supabase-js` para integrar mejor auth, realtime y storage si en
el futuro se usan.

### 4.4 Migración de datos: `pg_dump` → `psql`

`pg_dump` del VPS y restore en Supabase mediante el editor SQL o `psql`
contra el endpoint Postgres directo de Supabase. Mantiene IDs, timestamps y
relaciones intactos.

Pasos:

1. `pg_dump --schema-only --no-owner --no-privileges` → revisar SQL,
   ajustar grants (Supabase usa roles propios: `anon`, `authenticated`,
   `service_role`, `postgres`).
2. `pg_dump --data-only --inserts` → ejecutar en Supabase.
3. Verificación de paridad: comparar `count(*)` por tabla entre VPS y
   Supabase.

## 5. Plan de cutover (resumen, expandible en plan de implementación)

Sin downtime planificado. El VPS sigue corriendo hasta validar Supabase.

1. **Preparación de Supabase.** Crear proyecto (región: South America/São
   Paulo si está disponible, fallback US East), guardar `SUPABASE_URL`,
   `anon key`, `service_role key`. Crear los dos usuarios en Auth.
2. **Migración de schema y datos** (sección 4.4).
3. **Aplicar RLS** (sección 4.2).
4. **Adaptar frontend en una rama feature, sin desplegar.**
   - `src/config/api.ts`: headers de auth, interceptor de refresh.
   - `src/stores/authStore.ts` (Zustand): sesión, login, logout, persistencia
     en `localStorage`.
   - `src/components/LoginScreen.tsx`: form email + password contra
     `POST /auth/v1/token?grant_type=password`.
   - `App.tsx`: render condicional `LoginScreen` vs app si hay sesión.
   - Tests: cobertura de headers de auth y del interceptor 401.
5. **Cutover.** Deploy a Firebase con `VITE_API_URL` apuntando a
   `https://<proyecto>.supabase.co/rest/v1`. Validación de flujos (alta y
   listado de movimientos, FX, tarjetas). Onboarding de Agos. Reapuntar n8n
   con `service_role key`. Validar bot de Telegram.
6. **Decommission.** Tras 7 días estables: apagar PostgREST en Coolify,
   apagar Tailscale (mantener n8n), cerrar hallazgo D1 en
   `PROJECT_TRACKING.md`.

## 6. Rollback

Si Fase 5 falla: revertir `VITE_API_URL` al endpoint Tailscale y redeploy en
Firebase. RTO < 5 minutos. Los datos del VPS no se modifican durante la
migración. n8n se reapunta de vuelta al PostgreSQL local.

## 7. Riesgos y mitigaciones

| Riesgo                                                     | Mitigación                                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Diferencias de roles entre PostgREST custom y Supabase     | Auditar grants en el dump y ajustar a roles `anon` / `authenticated`             |
| RLS bloqueando queries que antes pasaban sin auth          | Test exhaustivo de cada hook de dominio post-cutover, antes de onboardear a Agos |
| Latencia mayor desde Argentina a Supabase US East          | Elegir región São Paulo si está disponible                                       |
| Free tier insuficiente en algún momento                    | Monitorear uso mensual; el plan Pro es USD 25/mes y se evalúa solo si se llega   |
| Datos sensibles fuera del control físico del usuario       | Aceptado por el usuario; backups diarios automáticos de Supabase                 |
| n8n queda con credenciales fuertes (`service_role key`)    | Rotar key tras setup; almacenar en variables de entorno de n8n, no en flujos     |

## 8. Out of scope

- Refactor a `@supabase/supabase-js` (evaluación posterior).
- Migración a Supabase Auth con OAuth/Google.
- Uso de Supabase Storage para adjuntos de comprobantes.
- Realtime subscriptions.
- Esquemas de auth multi-tenant o por usuario.

## 9. Referencias

- `docs/PROJECT_TRACKING.md` — hallazgo D1 (TLS PostgREST).
- `docs/plans/2026-03-08-finanzas-rearchitecture-design.md` — diseño original.
- `src/config/api.ts` — cliente PostgREST a adaptar.
- `supabase/migrations/` — migrations existentes.
