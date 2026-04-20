# Contexto adicional — App de Finanzas Familiar
**Versión:** 1.0  
**Fecha:** Abril 2026  
**Relación con otros documentos:** Este documento complementa `finanzas_app_spec.md` (v1.0) y el prototipo UI `cauce-app-v2.jsx`. No reemplaza ni modifica ninguno de los dos. Su propósito es resolver divergencias, agregar especificaciones faltantes y dar instrucciones precisas al agente sobre cómo integrar ambos.

---

## Índice

1. [Cómo leer este documento](#1-cómo-leer-este-documento)
2. [Divergencias entre spec y prototipo](#2-divergencias-entre-spec-y-prototipo)
3. [Especificaciones faltantes en el spec](#3-especificaciones-faltantes-en-el-spec)
4. [Correcciones al prototipo UI](#4-correcciones-al-prototipo-ui)
5. [Instrucciones de integración para el agente](#5-instrucciones-de-integración-para-el-agente)

---

## 1. Cómo leer este documento

El agente debe procesar los tres documentos en este orden de precedencia:

1. **`finanzas_app_spec.md`** — fuente de verdad para modelo de datos, reglas de negocio, taxonomía completa y stack técnico.
2. **Este documento** — resuelve conflictos, agrega lo que falta en el spec, y define cómo reconciliar el prototipo con el spec.
3. **`cauce-app-v2.jsx`** — referencia de UI/UX, estética y flujos de interacción. No es fuente de verdad de datos ni de lógica de negocio.

Cuando haya contradicción entre el spec y el prototipo, **el spec prevalece**. Cuando el prototipo tenga algo que el spec no menciona, este documento define si se incluye o no.

---

## 2. Divergencias entre spec y prototipo

### 2.1 Taxonomía: el prototipo tiene 2 niveles, el spec define 3

**Spec define (§4):** Macro → Categoría → Concepto + campo Detalle libre.  
**Prototipo implementa:** Macro → Sub (que mezcla categoría y concepto en un solo nivel).

**Cómo resolverlo:**

Implementar los 3 niveles del spec. La constante `SUBCATS` del prototipo debe reemplazarse por la taxonomía completa:

```typescript
// REEMPLAZAR en el código
const SUBCATS = { ... }  // ← incompleto y mezclado

// USAR la taxonomía completa del spec §5.3:
const TAXONOMY = {
  VIVIR: {
    'Vivienda':    ['Alquiler', 'Mantenimiento hogar', 'Honorarios inmobiliaria'],
    'Alimentación':['Supermercado', 'Verdulería', 'Carnicería', 'Panadería',
                    'Mayorista (Becerra)', 'Agua Mite', 'Quesería / fiambrería'],
    'Servicios':   ['EPEC', 'Cooperativa', 'Personal (celular)', 'Nuevo Liniers',
                    'BancoRoela', 'Condominio', 'Celesc (luz Brasil)',
                    'Ambiental (residuos Brasil)', 'Cable CCS (Brasil)', 'IPTU (Brasil)'],
    'Animales':    ['Bocantino', 'Veterinaria', 'Guardería', 'Vacunas y antiparasitarios'],
    'Salud':       ['Médico / consulta', 'Medicamentos', 'Odontólogo', 'Obra social / prepaga'],
    'Movilidad':   ['Nafta', 'Peajes', 'Seguro auto', 'Mantenimiento auto', 'Uber / remis'],
    'Formación':   ['Matrícula / arancel', 'Materiales de estudio',
                    'Librería (académica)', 'Cursos / certificaciones'],
  },
  TRABAJAR: {
    'Obligaciones fiscales':           ['Monotributo Mauro', 'Monotributo Agos', 'Honorarios contador'],
    'Seguros y servicios profesionales':['Mala Práxis Mauro', 'Mala Práxis Agos', 'RESMA'],
    'Infraestructura digital':         ['Google Workspace', 'Dominio web', 'VPS / servidor',
                                        'Suscripciones de desarrollo', 'Software profesional'],
    'Equipamiento profesional':        ['Mobiliario consultorio', 'Material clínico',
                                        'Libros profesionales', 'Hardware'],
  },
  DEBER: {
    'Préstamos':  ['Préstamo BNA', 'Préstamo ANSES', 'AGIP'],
    'Deudas':     ['PF 2261551771', 'PF 1753009581', 'Otro plan de facilidades'],
  },
  DISFRUTAR: {
    'Ocio y salidas':    ['Restaurante', 'Bar / café', 'Delivery', 'Entradas / espectáculos',
                          'Salidas recreativas'],
    'Compras personales':['Ropa', 'Calzado', 'Accesorios', 'Libros personales',
                          'Electrónica personal', 'Hogar / decoración', 'Otros'],
    'Suscripciones':     ['Streaming (Netflix, Spotify, etc.)', 'Apps personales',
                          'Membresías', 'Otros'],
  },
}
```

El formulario de carga debe tener **tres selectores en cascada**: Macro → Categoría → Concepto. Al elegir Macro se filtra Categoría; al elegir Categoría se filtra Concepto. El campo `Detalle` es texto libre adicional (ej: "Shell autopista", "Bocantino enero").

El campo `concepto` del prototipo (actualmente un input de texto libre) debe convertirse en un selector con opción "Otro..." que habilite texto libre.

---

### 2.2 Campo "Quién" — ausente en el prototipo

**Spec define (§3.2):** campo obligatorio `quien` con valores `Mauro / Agos / Compartido`. Default: `Compartido`.  
**Prototipo:** no lo tiene ni en el formulario ni en las filas de la lista de transacciones.

**Cómo resolverlo:**

Agregar `quien` como campo requerido en el formulario de carga, visible y simple. En mobile debe ser prominente porque Agos lo usa para identificar sus propios gastos.

```typescript
// En el formulario de carga, agregar después de "Detalle":
<FormField label="Quién">
  <div style={{ display: 'flex', gap: 6 }}>
    {['Mauro', 'Agos', 'Compartido'].map(q => (
      <button key={q} onClick={() => setQuien(q)}
        style={{ flex: 1, ... activo si quien === q ... }}>
        {q}
      </button>
    ))}
  </div>
</FormField>
```

En la lista de transacciones, agregar `quien` en la línea secundaria de cada fila (junto a macro, método y unidad).

En el modelo de datos, `quien` es columna NOT NULL en la tabla `transactions`.

---

### 2.3 Orden del formulario de carga — prototipo tiene el orden invertido

**Spec define (§7.2):** el flujo es Monto → Detalle → Quién → Fecha → IA sugiere el resto.  
**Prototipo:** empieza con Concepto (texto), luego Monto. La IA sugiere mientras el usuario tipea el concepto.

**Cómo resolverlo:**

El orden correcto del formulario es el del spec. Ajustar el componente `AddTxModal`:

```
1. Tipo (Gasto / Ingreso) — toggle, arriba
2. Monto — campo grande, primer foco al abrir
3. Moneda — ARS / USD / USDT (default ARS)
4. Detalle — texto libre ("bocantino", "shell autopista")
   → aquí se dispara la sugerencia de IA en tiempo real
5. Quién — Mauro / Agos / Compartido
6. Fecha — default hoy
─── separador ───
7. Macro — pre-rellenado por IA, editable
8. Categoría — pre-rellenada por IA, editable
9. Concepto — pre-rellenado por IA, editable
10. Unidad — pre-rellenada por IA, editable
11. Medio de pago — pre-rellenado por IA, editable
    → si es tarjeta de crédito: selector de tarjeta + cuotas
12. Notas — texto libre opcional
```

Los campos 7 a 11 pueden estar colapsados por defecto con un "Ver detalle ▾" para no abrumar a Agos. Al expandir se ven todos.

---

### 2.4 Modelo de cuotas — el prototipo lo simplifica demasiado

**Spec define (§5, §6):** `installment_plans` como entidad separada que genera `cuotas` automáticamente. El plan tiene tipo (`prestamo`, `cuota_bien`, `deuda`), fecha de inicio, fecha de fin estimada, y genera una fila en `cuotas` por cada mes.  
**Prototipo:** las cuotas son un atributo simple `installments: 12` en la transacción. No genera compromisos futuros.

**Cómo resolverlo:**

El backend debe implementar el modelo de datos completo del spec §5. En el frontend, cuando el usuario registra una compra en cuotas, el flujo es:

```
1. Usuario registra gasto con "Es cuota: Sí"
2. El sistema crea un registro en installment_plans
3. El sistema genera automáticamente N filas en cuotas (una por mes)
4. La primera cuota del mes actual se vincula a la transacción original
5. Las cuotas futuras quedan en estado "pendiente" y aparecen en Horizonte y en la vista de Pasivos
```

El prototipo muestra correctamente el resultado final (cuotas activas en CardTile, proyección en DebtsView), pero la generación automática debe ocurrir en el backend, no en el estado React.

---

### 2.5 Medios de pago — nomenclatura inconsistente

**Spec define (§5.2):** lista canónica de valores para la columna `medio_pago`.  
**Prototipo:** usa nombres propios ("MP Mau", "MP Agos", "BNA Mau") que son correctos para la UI pero no para el modelo de datos.

**Cómo resolverlo:**

Separar el **instrumento** de **a quién pertenece**. En el modelo de datos:

```sql
medio_pago  TEXT  -- valor canónico del spec: 'Mercado Pago', 'Débito BNA', 'BBVA Visa', etc.
quien       TEXT  -- 'Mauro', 'Agos', 'Compartido'
```

En la UI, mostrar la combinación: "MP · Mauro", "Débito BNA · Agos". En el formulario, el selector de medio de pago puede mostrar etiquetas amigables pero guardar el valor canónico.

Tabla completa de valores canónicos (del spec §5.2):

```
Efectivo
Mercado Pago
Personal Pay
BNA
Tarjeta de crédito
BBVA Visa
BNA Mastercard
BNA Visa
Fiwind
Fiwind (USDT)
Brubank
Débito BNA
```

---

### 2.6 Monedas — ausente en el prototipo

**Spec define (§3.3, §11.4):** tres monedas (`ARS`, `USD`, `USDT`). Las transacciones en moneda extranjera se almacenan en su moneda original. Los totales en ARS excluyen moneda extranjera. Brasil siempre se muestra en USDT separado.  
**Prototipo:** no tiene campo de moneda. Todos los montos se tratan como ARS.

**Cómo resolverlo:**

Agregar `moneda` al formulario (selector `ARS / USD / USDT`, default `ARS`). Cuando `unidad === 'BRASIL'`, cambiar el default a `USDT`.

En los totales y KPIs del dashboard, seguir la regla §11.4:
- Los totales mensuales en ARS se calculan **solo** con transacciones `moneda = 'ARS'`.
- Las transacciones en `USD` y `USDT` se muestran en un bloque separado debajo, sin conversión automática.

En la vista de Unidades, la tarjeta de BRASIL muestra sus totales en USDT, no en ARS.

---

### 2.7 Layout mobile — el prototipo es desktop-only

**Spec define (§2.1):** mobile-first. La carga de gastos ocurre en el celular.  
**Prototipo:** layout `260px sidebar + 1fr main`. No funciona en pantallas menores a 900px.

**Cómo resolverlo:**

El agente debe implementar **dos layouts**:

**Mobile (< 768px):**
- Pantalla de carga de gastos como vista principal (no hay sidebar)
- Bottom navigation con 4 iconos: Inicio / Cargar / Deudas / Análisis
- El formulario de carga ocupa pantalla completa con teclado numérico prominente para el monto
- Las vistas de análisis son accesibles pero secundarias

**Desktop (≥ 768px):**
- Sidebar fijo de 260px como en el prototipo
- Todas las vistas disponibles con densidad informativa alta

El componente `AddTxModal` del prototipo debe convertirse en una ruta/pantalla propia en mobile (`/nuevo`), no un modal flotante.

---

### 2.8 Motor de sugerencia — el prototipo usa keywords locales, el spec define Gemini

**Spec define (§9):** Gemini 2.5 Flash como motor. Recibe `{detalle, monto, quien, historial_ultimos_30_dias}`. Devuelve JSON con `{macro, categoria, concepto, unidad, medio_pago, confianza}`. Si confianza < 0.85, marcar visualmente la sugerencia como incierta.  
**Prototipo:** matching local de keywords (`suggestFromRules()`), sin confianza, sin historial, sin Gemini.

**Cómo resolverlo:**

El sistema de keywords del prototipo es un **fallback síncrono válido** mientras Gemini no está disponible (sin conexión, error de API). La lógica final debe ser:

```
1. El usuario tipea el detalle
2. Se dispara matching local (instantáneo) → pre-rellena el formulario
3. En paralelo, se llama a POST /api/ai/suggest con detalle + monto + quien + historial
4. Cuando Gemini responde:
   - Si confianza > 0.85: reemplaza la sugerencia local silenciosamente
   - Si confianza < 0.85: muestra la sugerencia con indicador visual de incertidumbre
   - Si hay error: mantiene la sugerencia local sin mostrar error al usuario
5. Si el usuario corrige la clasificación: guardar el par (detalle → clasificación) para mejorar futuras sugerencias
```

El prompt base está definido en el spec §9.4. Reutilizar el cliente de Gemini ya implementado en Lumen.

---

## 3. Especificaciones faltantes en el spec

Las siguientes funcionalidades aparecen en el prototipo pero no están definidas en el spec. Se incluyen aquí como especificaciones adicionales para v1.

---

### 3.1 Posición de caja (nueva)

**Descripción:** Muestra el saldo disponible en cada cuenta de dinero en tiempo real. Visible en el Home como primera sección, antes del gauge de saldo.

**Modelo de datos — nueva tabla:**

```sql
CREATE TABLE cash_accounts (
  id          BIGSERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,          -- 'Efectivo', 'Mercado Pago Mauro', 'BNA Agos', etc.
  tipo        TEXT NOT NULL CHECK (tipo IN ('efectivo','billetera_digital','banco')),
  quien       TEXT NOT NULL CHECK (quien IN ('Mauro','Agos','Compartido')),
  saldo       NUMERIC(14,2) NOT NULL DEFAULT 0,
  moneda      TEXT NOT NULL DEFAULT 'ARS',
  activa      BOOLEAN DEFAULT TRUE,
  icono       TEXT,                   -- 'wallet', 'phone', 'bank'
  creada_en   TIMESTAMPTZ DEFAULT NOW()
);
```

**Cuentas iniciales a seedear:**

| nombre | tipo | quien | saldo inicial |
|--------|------|-------|---------------|
| Efectivo | efectivo | Compartido | 17.000 |
| Mercado Pago Mauro | billetera_digital | Mauro | 5.861 |
| Mercado Pago Agos | billetera_digital | Agos | 12.500 |
| BNA Mauro | banco | Mauro | 150.000 |
| BNA Agos | banco | Agos | 80.000 |

**Reglas de actualización:**
- Cuando se registra un gasto con método `Efectivo`, `Mercado Pago`, `Débito BNA` u otro instrumento de caja: el saldo de la cuenta correspondiente se reduce en el monto.
- Cuando se registra un ingreso: el saldo de la cuenta destino se incrementa.
- Cuando se registra un pago de tarjeta (evento de caja): el saldo de la cuenta de origen se reduce.
- Los saldos se recalculan desde cero a partir de la suma de transacciones para evitar deriva.

**UI:** tiles horizontales en el Home (como en el prototipo). En mobile, scrolleable horizontalmente.

---

### 3.2 Gastos recurrentes (nueva entidad)

**Descripción:** Lista de gastos que se repiten mensualmente. Permite ver el "gasto comprometido" antes de que ocurra y generar alertas de vencimiento. El spec menciona alertas por servicios (§11.3) pero no define la entidad.

**Modelo de datos — nueva tabla:**

```sql
CREATE TABLE recurring_expenses (
  id            BIGSERIAL PRIMARY KEY,
  concepto      TEXT NOT NULL,
  macro         TEXT NOT NULL,
  categoria     TEXT NOT NULL,
  concepto_tax  TEXT NOT NULL,        -- valor del tercer nivel de taxonomía
  unidad        TEXT NOT NULL,
  medio_pago    TEXT NOT NULL,
  quien         TEXT NOT NULL DEFAULT 'Compartido',
  monto_ref     NUMERIC(14,2),        -- monto de referencia (puede variar)
  dia_del_mes   INTEGER CHECK (dia_del_mes BETWEEN 1 AND 31),
  activo        BOOLEAN DEFAULT TRUE,
  notas         TEXT,
  creado_en     TIMESTAMPTZ DEFAULT NOW()
);
```

**Recurrentes iniciales a seedear:** los 12 del prototipo (alquiler, EPEC, Cooperativa, Personal, monotributos, RESMA/subscripciones, Bocantino, préstamos).

**Reglas:**
- Los recurrentes no generan transacciones automáticamente. Son una referencia y fuente de alertas.
- El sistema compara cada recurrente con las transacciones del mes en curso. Si no hay ninguna transacción con el mismo `concepto_tax` en el mes, genera una alerta de "pendiente" 3 días antes del `dia_del_mes`.
- El usuario puede marcar un recurrente como "ya cargado" o simplemente cargar el gasto normal; el sistema lo asocia automáticamente.

**UI:** vista "Recurrentes" como en el prototipo. Agregar indicador por fila: ✓ pagado / ⏰ pendiente / — no aplica este mes.

---

### 3.3 Metas de ahorro (nueva entidad)

**Descripción:** Objetivos financieros con monto objetivo, acumulado actual, fecha límite y ritmo de ahorro mensual necesario. No aparece en el spec.

**Modelo de datos — nueva tabla:**

```sql
CREATE TABLE savings_goals (
  id              BIGSERIAL PRIMARY KEY,
  nombre          TEXT NOT NULL,
  icono           TEXT,               -- emoji o identificador
  monto_objetivo  NUMERIC(14,2) NOT NULL,
  monto_actual    NUMERIC(14,2) DEFAULT 0,
  ritmo_mensual   NUMERIC(14,2),      -- cuánto aportar por mes para llegar a tiempo
  fecha_limite    DATE,
  notas           TEXT,
  activa          BOOLEAN DEFAULT TRUE,
  creada_en       TIMESTAMPTZ DEFAULT NOW()
);
```

**Metas iniciales a seedear:**

| nombre | objetivo | actual | ritmo | fecha |
|--------|----------|--------|-------|-------|
| Colchón de emergencia | 4.000.000 | 450.000 | 180.000 | 2027-12-31 |
| Pasaporte + traducciones (DE) | 800.000 | 120.000 | 80.000 | 2026-12-31 |
| Inversión Balneário | 3.500.000 | 850.000 | 200.000 | 2027-06-30 |
| Doctorado Alemania | 5.000.000 | 0 | 150.000 | 2028-06-30 |

**Reglas:**
- `monto_actual` se actualiza manualmente. En v1 no hay movimiento automático de dinero hacia metas.
- El sistema calcula `meses_restantes = CEIL((monto_objetivo - monto_actual) / ritmo_mensual)` y lo muestra en la UI.
- Si `meses_restantes > meses_hasta_fecha_limite`: mostrar alerta de "al ritmo actual no llegás".

**UI:** como en el prototipo. La meta principal (o la más urgente) aparece como card en el Home.

---

## 4. Correcciones al prototipo UI

El agente debe tomar el prototipo como referencia visual, aplicando las siguientes correcciones:

### 4.1 Correcciones al formulario de carga (`AddTxModal`)

| Elemento actual | Corrección |
|----------------|------------|
| Campo "Concepto" como texto libre primero | Reemplazar por "Detalle" como texto libre; Concepto pasa a ser selector cascada |
| Monto en segundo lugar | Mover Monto al primer campo, con focus automático al abrir |
| Sin campo "Quién" | Agregar selector Mauro / Agos / Compartido |
| Sin campo "Moneda" | Agregar selector ARS / USD / USDT, default ARS |
| `SUBCATS` con 2 niveles | Reemplazar por `TAXONOMY` con 3 niveles en cascada |
| Sin campo "Detalle" libre | Agregar como campo separado de "Concepto" |
| Sin campo "Fecha" | Agregar date picker con default hoy |

### 4.2 Correcciones a la lista de transacciones (`TxRow`)

| Elemento actual | Corrección |
|----------------|------------|
| Sin "Quién" visible | Mostrar en línea secundaria junto a macro/método/unidad |
| Moneda no visible | Mostrar símbolo de moneda junto al monto si no es ARS |
| Concepto como texto libre | Mostrar jerarquía: Categoría · Concepto |

### 4.3 Correcciones a la vista de Deudas y Tarjetas

El prototipo mezcla préstamos y tarjetas en una vista. El spec §7.3 y §7.4 las separa:

- **Vista "Pasivos"**: préstamos activos + cuotas de bienes + hitos de liberación con línea de tiempo. El prototipo tiene las primeras dos pero no la línea de tiempo.
- **Vista "Tarjetas"**: separada de Pasivos. Por tarjeta: gastos del ciclo actual (desglose por categoría), cuotas activas asociadas, proyección próximo resumen, historial de pagos realizados.

En el sidebar, separar en dos ítems de navegación: "Pasivos" y "Tarjetas".

### 4.4 Vista Análisis — falta en el prototipo

Agregar una vista "Análisis" (spec §7.6) con:

1. Gráfico de área apilada: evolución mes a mes de VIVIR / TRABAJAR / DEBER / DISFRUTAR
2. Comparativo mes actual vs mes anterior por categoría (tabla con Δ absoluto y Δ%)
3. Top 10 conceptos del mes por monto
4. Evolución histórica de DISFRUTAR (para visibilizar el patrón de ocio)

En mobile esta vista es la última en el bottom navigation (icono de gráfico). En desktop es un ítem del sidebar.

---

## 5. Instrucciones de integración para el agente

### 5.1 Prioridad de implementación

Implementar en este orden:

1. **Modelo de datos completo** (spec §5 + este doc §3): crear todas las tablas, incluyendo `cash_accounts`, `recurring_expenses`, `savings_goals`.
2. **API endpoints** (spec §10.4): implementar todos los listados, más los nuevos:
   ```
   GET  /api/cash-accounts
   PUT  /api/cash-accounts/:id/balance
   GET  /api/recurring
   POST /api/recurring
   GET  /api/goals
   POST /api/goals
   PUT  /api/goals/:id
   ```
3. **Formulario de carga** con el orden correcto (§2.3 de este doc) y campo `quien` (§2.2).
4. **Layout mobile** con bottom navigation y formulario como pantalla completa.
5. **Motor de sugerencia** con Gemini (§2.8) usando el pipeline de Lumen como referencia.
6. **Vistas de análisis y tarjetas** separadas (§4.3, §4.4).

### 5.2 Lo que el agente NO debe reimplementar desde cero

- El cliente de Gemini: reutilizar el implementado en Lumen (mismo stack TypeScript + React).
- La conexión a PostgreSQL en el VPS Hetzner: ya existe con datos desde enero 2026.
- El pipeline n8n: no modificarlo. La app lo reemplaza para carga manual, n8n sigue activo para automatizaciones batch.
- La estética y sistema de diseño: usar el prototipo `cauce-app-v2.jsx` como referencia visual exacta. Mismos colores (tokens `C`), mismas fuentes (Fraunces + IBM Plex), mismos componentes atómicos (`Card`, `KPI`, `Alert`, `TxRow`).

### 5.3 Migración de datos históricos

La BD existente tiene datos desde enero 2026 con el esquema anterior (spec §10.2). La migración debe:

1. Agregar columnas `macro`, `quien`, `cuota_id` a la tabla existente.
2. Ejecutar `POST /api/ai/suggest` en batch sobre las transacciones históricas para clasificarlas con la nueva taxonomía.
3. Marcar las migradas con `source = 'migration'` y `editado_por_ia = TRUE`.
4. Las que Gemini no pueda clasificar con confianza > 0.7 quedan en estado `validado = FALSE` para revisión manual.

### 5.4 Supuestos a documentar en el Horizonte (spec §7.5)

El módulo de Horizonte debe mostrar explícitamente los supuestos del modelo (spec §7.5, punto 4). En la UI, agregar una sección colapsable "Supuestos del modelo" con este contenido generado dinámicamente:

```
· Ingresos: $3.000.000/mes constantes (último valor registrado)
· Alquiler: $957.661/mes actual → ajuste +9,5% estimado en [fecha próximo ajuste]
· Préstamo BNA: se cancela en octubre 2027 → libera $149.771/mes
· ANSES: se cancela en febrero 2027 → libera $54.289/mes
· PF 2261551771: se cancela en julio 2026 → libera $14.702/mes
· PF 1753009581: se cancela en septiembre 2026 → libera $14.530/mes
· Gastos variables: promedio de los últimos 3 meses
· Sin gastos extraordinarios proyectados
```

---

*Fin del documento. Versión 1.0 — Abril 2026.*  
*Complementa: `finanzas_app_spec.md` v1.0 y `cauce-app-v2.jsx`*
