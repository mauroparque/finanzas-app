# Spec — App de Finanzas Familiar
**Versión:** 1.0  
**Fecha:** Abril 2026  
**Autores:** Mauro + Agos  
**Destino:** Agente de desarrollo (contexto completo para generación de código)

---

## Índice

1. [Contexto y propósito](#1-contexto-y-propósito)
2. [Principios de diseño](#2-principios-de-diseño)
3. [Arquitectura de la información](#3-arquitectura-de-la-información)
4. [Taxonomía de gastos](#4-taxonomía-de-gastos)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Modelo de cuotas y tarjetas](#6-modelo-de-cuotas-y-tarjetas)
7. [Módulos de la app](#7-módulos-de-la-app)
8. [Flujos de usuario](#8-flujos-de-usuario)
9. [Motor de sugerencia IA](#9-motor-de-sugerencia-ia)
10. [Stack técnico e integraciones](#10-stack-técnico-e-integraciones)
11. [Reglas de negocio](#11-reglas-de-negocio)
12. [Glosario](#12-glosario)

---

## 1. Contexto y propósito

### 1.1 Situación actual

El hogar opera con dos sistemas paralelos que capturan vistas distintas de la misma realidad económica:

- **Planilla Excel (`Seguimiento_Finanzas_Familiar.xlsx`):** base devengada. Registra gastos cuando ocurren (aunque aún no se haya pagado), con proyecciones a futuro. Tiene hojas por categoría, evolución histórica y seguimiento de deudas. Es el sistema estructural.
- **Base de datos PostgreSQL (VPS Hetzner):** base caja. Registra cuando la plata efectivamente sale. Los gastos ingresan vía bot de Telegram y automatización n8n. Es el sistema transaccional del día a día.

Ninguno está completo solo. La planilla no captura ocio ni gastos menores. La BD no tiene proyecciones ni estructura de deudas. Esta app unifica ambos en un flujo único.

### 1.2 Usuarios

| Usuario | Perfil | Uso esperado |
|---------|--------|--------------|
| **Mauro** | Psicólogo, desarrolla Lumen, estudia Ciencias de la Computación (UNC). Usuario técnico. | Carga ~85% de los gastos. Usuario principal de análisis y configuración. |
| **Agos** | Psicóloga. Usuaria no técnica. | Carga gastos del hogar y del consultorio compartido. Necesita flujo de carga simple, sin fricción. |

### 1.3 Problema central a resolver

> "¿Cuánto gastamos en vivir, en deber y en disfrutar?"

La app debe responder esa pregunta en menos de 3 segundos al abrirla. Todo lo demás (análisis, proyecciones, deudas) es secundario a esa respuesta inmediata.

### 1.4 Objetivos

1. **Reemplazar el bot de Telegram** como canal de carga de gastos.
2. **Unificar** la vista de la planilla (devengado + proyecciones) con la BD (transacciones reales).
3. **Hacer visible** el impacto de las deudas activas en el flujo mensual.
4. **Facilitar la carga de Agos** sin requerir conocimiento técnico de categorías.
5. **Proyectar** el flujo de caja a 6 meses incluyendo liberación de deudas.

### 1.5 Fuera de alcance (v1)

- Módulo de ingresos (los ingresos se registran manualmente como valor mensual).
- Inversiones y ahorro estructurado.
- Reportes exportables.
- Multi-perfil / multi-hogar.
- Módulo de ingresos del inmueble Brasil (actualmente es solo costo).

---

## 2. Principios de diseño

### 2.1 UX

- **Mobile-first, desktop-compatible.** La carga de gastos ocurre principalmente en el celular. El análisis se hace en desktop.
- **Carga en menos de 30 segundos.** Monto + concepto + quién. El resto lo sugiere la IA.
- **Sin fricción para Agos.** El formulario de carga no puede requerir conocimiento previo de la taxonomía. La IA categoriza; Agos confirma o corrige con un tap.
- **Densidad informativa en desktop.** En pantalla grande se puede mostrar más. En mobile se prioriza lo esencial.
- **Estética limpia y clara.** Fondo cálido (#F7F6F2), tipografía DM Sans, paleta terrosa con acentos de color por macro-grupo.

### 2.2 Datos

- **Base caja para transacciones, base devengada para proyecciones.** Son dos vistas complementarias de la misma realidad.
- **La categoría describe el propósito, el medio de pago describe el instrumento.** No se mezclan.
- **El pago de tarjeta no es un gasto.** Es un evento de caja que cancela deuda con el banco.
- **Las cuotas son atributos de una transacción, no categorías.**
- **Una sola fuente de verdad:** PostgreSQL es el master. La planilla Excel queda como referencia histórica hasta migración completa.

### 2.3 Modelo mental del usuario

Cuando el usuario registra un gasto, piensa instintivamente **"para qué es"** (propósito), no "en qué categoría va". La taxonomía está diseñada para alinearse con ese modelo mental: cuatro macros basados en propósito (Vivir, Trabajar, Deber, Disfrutar).

---

## 3. Arquitectura de la información

### 3.1 Unidades

Cada gasto pertenece a una **unidad**, que representa el centro de costo o contexto. La unidad no reemplaza a la categoría — la complementa dando contexto geográfico/funcional.

| Unidad | Descripción |
|--------|-------------|
| `HOGAR` | Gastos de la vida familiar en Alta Gracia. Es la unidad por defecto para la mayoría de los gastos. Incluye alquiler, alimentación, servicios, animales, ocio. |
| `BRASIL` | Gastos asociados al inmueble en Balneário Camboriú (Brasil). Incluye condominio, servicios públicos locales (Celesc, Ambiental, Cable CCS) e impuestos locales (IPTU). Los montos generalmente están en USDT. Actualmente es una unidad de puro costo (sin ingresos registrados). |
| `PROFESIONAL` | Gastos directamente vinculados al ejercicio profesional de Mauro y/o Agos como psicólogos. Incluye monotributos, honorarios del contador, seguros de mala praxis, RESMA, infraestructura digital del consultorio. |

### 3.2 Quién

Cada gasto tiene un campo `quién` que indica qué miembro del hogar lo realizó o a quién corresponde.

| Valor | Descripción |
|-------|-------------|
| `Mauro` | Gasto realizado o iniciado por Mauro. |
| `Agos` | Gasto realizado o iniciado por Agos. |
| `Compartido` | Gasto del hogar sin asignación individual (default cuando no aplica). |

### 3.3 Monedas

| Moneda | Uso |
|--------|-----|
| `ARS` | Pesos argentinos. Moneda principal. |
| `USD` | Dólares estadounidenses. Para servicios digitales internacionales (Google Workspace, dominios). |
| `USDT` | Tether (stablecoin). Para gastos del inmueble Brasil vía Fiwind. |

---

## 4. Taxonomía de gastos

La taxonomía tiene **tres niveles**: Macro → Categoría → Concepto.

- **Macro:** el propósito ("para qué es"). Hay 4: Vivir, Trabajar, Deber, Disfrutar.
- **Categoría:** el tipo de gasto dentro del macro. Hay 15 en total.
- **Concepto:** el gasto específico dentro de la categoría. Lista predefinida pero extensible. El usuario puede agregar conceptos nuevos.
- **Detalle:** texto libre. Descripción precisa del gasto individual (ej: "Shell Autopista", "Empanadas La Nona").

---

### 4.1 VIVIR

**Definición:** Todo gasto necesario para sostener la vida cotidiana del hogar. Incluye tanto los fijos (alquiler) como los variables necesarios (comida, servicios). La pregunta que define este macro es: *"¿Lo necesito para que el hogar funcione?"*

---

#### 4.1.1 Vivienda

**Descripción:** Gastos directamente asociados a tener y mantener el techo. Incluye el alquiler mensual, los costos de renovación del contrato y cualquier gasto de mantenimiento o reparación del hogar (plomero, electricista, pintura, arreglos varios). Si el hogar necesita una reparación para seguir siendo habitable, va acá, aunque sea imprevisto.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Alquiler | Pago mensual del alquiler de la vivienda en Alta Gracia. Sube un 9,5% por período según contrato vigente. Actualmente: $798.700/mes; proyectado mayo 2026: $874.577. | HOGAR | $798.700 | Fijo mensual |
| Mantenimiento hogar | Cualquier reparación o mejora de la vivienda alquilada: plomero, electricista, pintura, arreglos varios. No incluye compra de muebles o electrodomésticos (eso va en Equipamiento o como cuota en Deber). | HOGAR | Variable | Ocasional |
| Honorarios inmobiliaria | Comisión pagada a la inmobiliaria por renovación o gestión del contrato de alquiler. Históricamente: $129.500 (dividido en 3 cuotas de $38.500 aprox en Nov-Ene 2025). | HOGAR | $129.500 | Anual/Ocasional |

---

#### 4.1.2 Alimentación

**Descripción:** Todo lo que el hogar consume como alimento o bebida para preparar en casa. Incluye compras en supermercado, verdulería, carnicería, panadería, quesería, agua en bidones y mayoristas. No incluye comidas afuera ni delivery (eso es Ocio y Salidas en Disfrutar).

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Supermercado | Compras en supermercado o hipermercado. Incluye alimentos, limpieza e higiene del hogar. Medio de pago habitual: Personal Pay o efectivo. | HOGAR | Variable | Semanal |
| Verdulería | Frutas y verduras frescas. Efectivo. | HOGAR | ~$36.000 | Semanal |
| Carnicería | Cortes de carne. Efectivo. | HOGAR | ~$30.000 | Quincenal |
| Panadería | Pan, facturas, productos de panadería. Efectivo. | HOGAR | ~$1.300 | Semanal |
| Mayorista (Becerra) | Proveedor mayorista de alimentos secos y conservas. Personal Pay. | HOGAR | ~$96.700 | Mensual |
| Agua Mite | Bidones de agua para consumo. Efectivo. | HOGAR | ~$5.500 | Quincenal |
| Quesería / fiambrería | Quesos, fiambres y productos delicatessen. Efectivo. | HOGAR | ~$27.000 | Mensual |

---

#### 4.1.3 Servicios

**Descripción:** Servicios públicos y privados necesarios para el funcionamiento del hogar. Incluye luz, agua, gas, telefonía, expensas y todos los servicios del inmueble en Brasil. Nota: Cooperativa y Nuevo Liniers son servicios del hogar, no vivienda. La distinción es que Vivienda = el techo en sí; Servicios = lo que lo hace funcionar.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| EPEC | Servicio de electricidad (Empresa Provincial de Energía de Córdoba). Vence aproximadamente el día 11 de cada mes. Medio de pago: Personal Pay. | HOGAR | $37.000–58.000 | Mensual |
| Cooperativa | Servicio de agua potable de la cooperativa local. Vence aproximadamente el día 12 de cada mes. Medio de pago: Mercado Pago. | HOGAR | $43.000–55.000 | Mensual |
| Personal (celular) | Plan de telefonía móvil (Personal). Incluye líneas del hogar. Vence aproximadamente el día 16 de cada mes. Medio de pago: Personal Pay. | HOGAR | $63.000–76.000 | Mensual |
| Nuevo Liniers (expensas) | Expensas del complejo o barrio donde se ubica la vivienda. Personal Pay. | HOGAR | $7.500 | Mensual |
| BancoRoela | Costo mensual de mantenimiento de cuenta bancaria (Banco Roela). | HOGAR | $7.500–8.200 | Mensual |
| Condominio | Gasto de administración del edificio del inmueble en Balneário Camboriú, Brasil. Se paga vía Fiwind en USDT. | BRASIL | ~277 USDT | Mensual |
| Celesc (luz Brasil) | Servicio de electricidad del inmueble en Brasil (Celesc Distribuição). Se paga vía Fiwind en USDT. | BRASIL | ~38 USDT | Mensual |
| Ambiental (residuos Brasil) | Tasa de recolección de residuos del municipio de Balneário Camboriú. Se paga vía Fiwind en USDT. | BRASIL | ~12 USDT | Mensual |
| Cable CCS (Brasil) | Servicio de cable/internet del inmueble en Brasil (CCS Camboriú Cable System). Se paga vía Fiwind en USDT. | BRASIL | ~20 USDT | Mensual |
| IPTU (Brasil) | Imposto Predial e Territorial Urbano: impuesto municipal sobre la propiedad inmobiliaria en Brasil, equivalente al ABL en Argentina. Se paga mensualmente vía Fiwind en USDT. | BRASIL | 22 USDT | Mensual |

---

#### 4.1.4 Animales

**Descripción:** Todos los gastos relacionados con el cuidado de las mascotas del hogar: dos perros y tres gatos adultos. Bocantino engloba toda la comida de las mascotas (tanto del perro como de los gatos). Los gastos veterinarios y de salud de los animales también van acá, diferenciados por concepto.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Bocantino | Toda la comida de las mascotas del hogar: comida del perro (pollo fresco Bocantino) y comida de los tres gatos. Es el gasto mensual más significativo de esta categoría. Medio de pago: Mercado Pago. | HOGAR | $380.000–402.000 | Mensual |
| Veterinaria | Consultas veterinarias, análisis y tratamientos de los animales. Tarjeta de crédito o efectivo según el caso. | HOGAR | Variable | Variable |
| Guardería | Estadías de los perros en guardería durante viajes o ausencias prolongadas del hogar. | HOGAR | $125.000–200.000 | Ocasional |
| Vacunas y antiparasitarios | Vacunación periódica y desparasitación de todos los animales. Incluye vacunas de temporada y antiparasitarios internos/externos. | HOGAR | $52.000–128.000 | Semestral |

---

#### 4.1.5 Salud

**Descripción:** Gastos de salud de los integrantes del hogar (Mauro y Agos). Incluye consultas médicas, odontología, farmacia y cobertura de salud. Se aplica a ambos sin distinción. Regla: siempre va en Vivir / Salud, sin excepciones. No importa si es preventivo, urgente, crónico o de bienestar.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Médico / consulta | Consultas con cualquier especialista médico. | AMBOS | Variable | Ocasional |
| Medicamentos | Compras en farmacia: medicamentos recetados, de venta libre, vitaminas. | AMBOS | Variable | Variable |
| Odontólogo | Consultas y tratamientos odontológicos. | AMBOS | Variable | Ocasional |
| Obra social / prepaga | Cuota mensual de cobertura de salud si aplica. Actualmente sin dato registrado. | AMBOS | — | Mensual |

---

#### 4.1.6 Movilidad

**Descripción:** Todos los gastos vinculados al uso y mantenimiento del vehículo familiar (Renault Clio Mio 2015) y al transporte en general. Incluye combustible, peajes, seguro del auto, mantenimiento mecánico y transporte alternativo (Uber, remis). No incluye compras de bienes duraderos del auto (eso va como cuota en Deber si se pagó en cuotas, o acá si fue un pago único de servicio).

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Nafta | Combustible para el Renault Clio Mio. Carga en Shell o YPF. Puede pagarse con tarjeta de crédito o efectivo. | HOGAR | $20.000–58.000 | Variable |
| Peajes | Peajes de autopistas en viajes. Efectivo o tarjeta. | HOGAR | ~$11.605 | Variable |
| Seguro auto | Cuota mensual del seguro del vehículo. Sin dato exacto actualmente en el sistema. | HOGAR | Sin dato | Mensual |
| Mantenimiento auto | Service periódico, repuestos, lavado, neumáticos. Es un gasto ocasional pero necesario para mantener el vehículo operativo. | HOGAR | Eventual | Ocasional |
| Uber / remis | Transporte alternativo cuando no se usa el auto propio. Mercado Pago. | HOGAR | $2.000–5.000 | Variable |

---

#### 4.1.7 Formación

**Descripción:** Gastos de estudio y capacitación personal o académica de Mauro y/o Agos, en tanto no sea capacitación directamente vinculada al ejercicio profesional (eso va en Trabajar / Equipamiento profesional). Incluye la carrera de Ciencias de la Computación de Mauro en UNC, cursos online de interés personal y materiales académicos. Regla de desempate: si el curso o material sirve para estudiar (no para atender pacientes o desarrollar Lumen), va acá.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Matrícula / arancel | Cuotas o aranceles de carreras universitarias (UNC, FCE u otras instituciones de educación formal). | AMBOS | Según período | Anual/Semestral |
| Materiales de estudio | Fotocopias, impresiones, apuntes, cuadernos de uso académico. | AMBOS | Variable | Variable |
| Librería (académica) | Compras en librería con propósito de estudio formal. Si la misma compra incluye material personal, registrar por separado o asignar según uso predominante. | AMBOS | Variable | Ocasional |
| Cursos / certificaciones | Cursos online (Udemy, Coursera, etc.), certificaciones técnicas, posgrados o especializaciones de interés personal no vinculado directamente a la práctica clínica. | AMBOS | Variable | Ocasional |

---

### 4.2 TRABAJAR

**Definición:** Todo gasto necesario para el ejercicio de la actividad profesional de Mauro y/o Agos como psicólogos, y de Mauro como desarrollador de Lumen. La pregunta que define este macro: *"¿Lo necesito para atender pacientes, facturar o desarrollar mi actividad profesional?"*

---

#### 4.2.1 Obligaciones fiscales

**Descripción:** Obligaciones tributarias y de asesoría fiscal derivadas del ejercicio profesional autónomo (monotributo) de ambos profesionales. Incluye los pagos mensuales de monotributo y los honorarios del contador que liquida, asesora y presenta declaraciones juradas.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Monotributo Mauro | Cuota mensual de monotributo de Mauro como profesional autónomo. Vence el día 16 de cada mes. Mercado Pago. | PROFESIONAL | $42.386 | Mensual |
| Monotributo Agos | Cuota mensual de monotributo de Agos como profesional autónomo. Vence el día 16 de cada mes. Mercado Pago. | PROFESIONAL | $37.606 | Mensual |
| Honorarios contador | Pago mensual al contador por liquidación de monotributos, asesoría fiscal y presentación de declaraciones juradas de ambos profesionales. Mercado Pago. | PROFESIONAL | $140.000 | Mensual |

---

#### 4.2.2 Seguros y servicios profesionales

**Descripción:** Coberturas de responsabilidad profesional (mala praxis) y servicios contratados para el ejercicio clínico. RESMA es una plataforma/servicio de derivación de pacientes, gestión de turnos, formaciones clínicas y supervisiones. Es un gasto mensual de ambos profesionales, no un gasto del auto.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Mala Práxis Mauro | Seguro de responsabilidad profesional (mala praxis) para Mauro. Cuota mensual obligatoria para el ejercicio clínico. | PROFESIONAL | $5.052 | Mensual |
| Mala Práxis Agos | Seguro de responsabilidad profesional (mala praxis) para Agos. Cuota mensual obligatoria para el ejercicio clínico. | PROFESIONAL | $5.052 | Mensual |
| RESMA | Servicio profesional contratado por ambos. Incluye: derivación de pacientes, acceso a formaciones clínicas continuas y espacios de supervisión profesional. Tarjeta de crédito. $17.999 cada uno. | PROFESIONAL | $17.999 × 2 = $35.998 | Mensual |

---

#### 4.2.3 Infraestructura digital

**Descripción:** Servicios digitales necesarios para el ejercicio profesional y el desarrollo de Lumen (app de historia clínica). Incluye el ecosistema Google para el consultorio, el dominio web y la infraestructura de servidor. Se diferencia de las suscripciones de consumo personal (Spotify, Netflix) que van en Disfrutar.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Google Workspace | Suite de herramientas Google para uso profesional del consultorio (Gmail, Drive, Docs, etc.). Asociado al dominio lumensal. Brubank. | PROFESIONAL | $17 USD | Mensual |
| Dominio Lumen | Renovación anual del dominio web lumensaludmental.com. Brubank. | PROFESIONAL | $11 USD | Anual |
| Google Cloud / Hetzner | Infraestructura de servidor para self-hosting de servicios de Lumen y automatizaciones (n8n, PostgreSQL). | PROFESIONAL | Variable | Mensual |

---

#### 4.2.4 Equipamiento profesional

**Descripción:** Compras de bienes o materiales necesarios para el ejercicio clínico o el desarrollo de Lumen. Incluye insumos del consultorio, tecnología de trabajo y libros técnicos de uso profesional directo. Si la compra es en cuotas, se registra aquí con su atributo de cuotas; el seguimiento mensual lo maneja el módulo de cuotas.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Insumos consultorio | Material clínico, papelería profesional, elementos de uso en sesión. | PROFESIONAL | Variable | Ocasional |
| Tecnología laboral | PC, pantallas, periféricos, dispositivos usados principalmente para trabajo. Regla: si el dispositivo es la herramienta principal de trabajo, va acá. Si es consumo personal, va en Disfrutar. | PROFESIONAL | Variable | Ocasional |
| Librería (laboral) | Libros técnicos, manuales diagnósticos (DSM, CIE), material de referencia clínica de uso profesional directo. | PROFESIONAL | Variable | Ocasional |

---

### 4.3 DEBER

**Definición:** Compromisos financieros ya contraídos. Deuda existente que genera un egreso mensual fijo independientemente de decisiones actuales. La pregunta que define este macro: *"¿Es plata que ya gasté (o que debía) y que ahora estoy devolviendo?"*

---

#### 4.3.1 Préstamos

**Descripción:** Créditos bancarios en cuotas. Cada préstamo tiene una cuota fija mensual hasta su cancelación. Se registran en el sistema una vez y generan compromisos automáticos hasta la fecha de cancelación estimada. El saldo pendiente total es la suma de cuotas restantes.

| Concepto | Descripción | Unidad | Cuota/mes | Fin estimado |
|----------|-------------|--------|-----------|--------------|
| Préstamo BNA | Crédito del Banco Nación Argentina. Cuota 18/36 al mes de referencia. El monto de cuota puede ajustarse por variaciones de tasa. | HOGAR | $151.611 | Oct 2027 |
| Préstamo ANSES | Crédito ANSES (ANSES CRECER o similar). Cuota 26/36. | HOGAR | $54.302 | Abr 2027 |
| PF 2261551771 | Préstamo personal identificado por número de operación. Aproximadamente 7 cuotas restantes. | HOGAR | $46.362 | Oct 2026 |
| PF 1753009581 | Préstamo personal identificado por número de operación. Aproximadamente 7 cuotas restantes. | HOGAR | $46.268 | Oct 2026 |
| Préstamo BBVA | ⚠ Detectado en la BD de transacciones ($50.641/mes) pero no registrado en la planilla de deudas. Estado y términos pendientes de confirmar y registrar correctamente. | HOGAR | $50.641 (?) | Sin confirmar |

---

#### 4.3.2 Deudas

**Descripción:** Deudas impositivas, multas administrativas u otras obligaciones de pago vencidas que se están pagando en cuotas o en un único pago. Se diferencia de Préstamos porque no son créditos bancarios propiamente dichos sino obligaciones derivadas de incumplimientos o situaciones específicas.

| Concepto | Descripción | Unidad | Cuota/mes | Fin estimado |
|----------|-------------|--------|-----------|--------------|
| Deuda AGIP | Deuda con AGIP (Administración Gubernamental de Ingresos Públicos, CABA). Se está pagando en dos planes simultáneos: $14.530/mes y $14.702/mes. | HOGAR | $29.232 total | 2026 |
| Multas / infracciones | Cualquier multa de tránsito, infracción administrativa u obligación derivada de resolución. Se registra cuando ocurre. | HOGAR | Eventual | Ocasional |

---

### 4.4 DISFRUTAR

**Definición:** Gastos discrecionales que mejoran la calidad de vida pero a los que se podría renunciar en caso de necesidad sin que el hogar deje de funcionar. La pregunta que define este macro: *"¿Podría prescindir de esto esta semana sin que se rompa algo?"*

---

#### 4.4.1 Ocio y salidas

**Descripción:** Gastos gastronómicos fuera del hogar, bebidas en salidas sociales, entradas a espectáculos o actividades de entretenimiento. Incluye tanto salidas afuera como compras de ocio para consumir en casa (cervezas para una reunión con amigos, por ejemplo). Históricamente es el gasto de Disfrutar más frecuente y visible.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Empanadas | Salidas o pedidos de empanadas. Efectivo. ~$17.000 por ocasión. Ocurre 3–4 veces por mes en períodos normales. | HOGAR | $17.000 | Frecuente |
| Hamburguesas | Salidas a comer hamburguesas. Efectivo. $11.500–16.000 por ocasión. | HOGAR | $11.500–16.000 | Frecuente |
| Cervezas / gaseosas | Bebidas para consumo en salidas o reuniones en casa. Efectivo. | HOGAR | $3.200–10.200 | Variable |
| Asado | Asados familiares o con amigos. Efectivo. Incluye carne, bebidas, carbón y adicionales. | HOGAR | ~$40.000 | Ocasional |
| Heladería / café | Salidas a heladera, café o confitería. Efectivo. | HOGAR | $10.000–20.000 | Ocasional |
| Restaurantes / otros | Cualquier otra salida gastronómica o de entretenimiento no cubierta por los conceptos anteriores. | HOGAR | Variable | Variable |

---

#### 4.4.2 Compras personales

**Descripción:** Compras discrecionales de bienes personales no vinculadas a necesidades del hogar, el trabajo o el estudio. Incluye ropa, regalos, artículos de estética personal y misceláneos. Regla: si no es necesario para vivir, trabajar ni estudiar, va acá.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Regalos | Obsequios para familiares, amigos o conocidos. Efectivo o MP. | AMBOS | Variable | Ocasional |
| Peluquería / estética | Peluquería, barbería, cuidado personal estético. Efectivo. | AMBOS | ~$17.000 | Mensual |
| Ropa y calzado | Indumentaria personal. Sin datos históricos en la BD actual. | AMBOS | Variable | Ocasional |
| Librería (personal) | Compras en librería sin propósito académico ni laboral (cuadernos personales, stickers, material de papelería de uso personal). | AMBOS | $6.000–9.500 | Ocasional |
| Consumibles varios | Gastos pequeños misceláneos que no encajan en otros conceptos: datos móviles adicionales, artículos de bazar, etc. | AMBOS | Variable | Ocasional |

---

#### 4.4.3 Suscripciones

**Descripción:** Servicios digitales de consumo personal con cobro recurrente. Se diferencia de Infraestructura digital (Trabajar) en que no son herramientas de trabajo sino servicios de entretenimiento o bienestar personal. El criterio es: si se usaría igual aunque no se trabajara, va acá.

| Concepto | Descripción | Unidad | Monto ref. | Frecuencia |
|----------|-------------|--------|------------|------------|
| Spotify | Suscripción de música en streaming. Efectivo (~$3 USD). | HOGAR | ~$3 USD | Mensual |
| Streaming (Netflix, etc.) | Plataformas de contenido audiovisual. Sin datos históricos registrados actualmente. | HOGAR | Variable | Mensual |
| Otras apps personales | Cualquier suscripción de app de uso personal: bienestar, productividad personal, entretenimiento. | HOGAR | Variable | Variable |

---

## 5. Modelo de datos

### 5.1 Entidades principales

#### `transaction` — Gasto individual

Representa un gasto real registrado por un usuario. Es la entidad central del sistema.

```sql
CREATE TABLE transactions (
  id                BIGSERIAL PRIMARY KEY,
  fecha_operacion   DATE NOT NULL,
  unidad            TEXT NOT NULL CHECK (unidad IN ('HOGAR','BRASIL','PROFESIONAL')),
  macro             TEXT NOT NULL CHECK (macro IN ('VIVIR','TRABAJAR','DEBER','DISFRUTAR')),
  categoria         TEXT NOT NULL,
  concepto          TEXT NOT NULL,
  detalle           TEXT,                        -- texto libre, descripción precisa
  monto             NUMERIC(14,2) NOT NULL,
  moneda            TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS','USD','USDT')),
  medio_pago        TEXT NOT NULL,               -- ver tabla medios_pago
  quien             TEXT NOT NULL DEFAULT 'Compartido' CHECK (quien IN ('Mauro','Agos','Compartido')),
  es_cuota          BOOLEAN DEFAULT FALSE,        -- TRUE si forma parte de un plan de cuotas
  cuota_id          BIGINT REFERENCES installment_plans(id),  -- FK al plan si es_cuota=TRUE
  numero_cuota      INTEGER,                      -- qué número de cuota es (1 de 24, etc.)
  validado          BOOLEAN DEFAULT FALSE,
  editado_por_ia    BOOLEAN DEFAULT FALSE,
  source            TEXT DEFAULT 'app',           -- 'app', 'n8n', 'migration'
  fecha_carga       TIMESTAMPTZ DEFAULT NOW(),
  id_usuario        BIGINT REFERENCES users(id),
  notas             TEXT
);
```

#### `installment_plans` — Plan de cuotas

Representa una compra en cuotas o préstamo. Se registra una vez y genera los compromisos mensuales automáticamente.

```sql
CREATE TABLE installment_plans (
  id                BIGSERIAL PRIMARY KEY,
  nombre            TEXT NOT NULL,               -- "Aspiradora BBVA", "Préstamo BNA"
  tipo              TEXT NOT NULL CHECK (tipo IN ('prestamo','cuota_bien','deuda')),
  macro             TEXT NOT NULL,               -- siempre DEBER para préstamos; para cuota_bien hereda del bien
  categoria         TEXT,                        -- categoría del bien (ej: Vivienda si es electrodoméstico)
  concepto          TEXT,                        -- concepto del bien
  unidad            TEXT NOT NULL,
  monto_total       NUMERIC(14,2),               -- valor total de la compra (puede ser NULL para préstamos)
  total_cuotas      INTEGER NOT NULL,
  monto_cuota       NUMERIC(14,2) NOT NULL,
  moneda            TEXT NOT NULL DEFAULT 'ARS',
  medio_pago        TEXT NOT NULL,               -- tarjeta o banco asociado
  fecha_inicio      DATE NOT NULL,               -- fecha de la primera cuota
  fecha_fin_est     DATE NOT NULL,               -- fecha estimada de cancelación
  estado            TEXT DEFAULT 'activo' CHECK (estado IN ('activo','cancelado','pausado')),
  notas             TEXT,
  creado_en         TIMESTAMPTZ DEFAULT NOW()
);
```

#### `cuotas` — Cuotas individuales de un plan

Cada cuota generada automáticamente a partir de un `installment_plan`.

```sql
CREATE TABLE cuotas (
  id                BIGSERIAL PRIMARY KEY,
  plan_id           BIGINT NOT NULL REFERENCES installment_plans(id),
  numero            INTEGER NOT NULL,            -- número de cuota (1, 2, 3...)
  fecha_vencimiento DATE NOT NULL,
  monto             NUMERIC(14,2) NOT NULL,
  estado            TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','vencido')),
  transaction_id    BIGINT REFERENCES transactions(id),  -- FK cuando se marca como pagada
  pagado_en         DATE
);
```

#### `monthly_income` — Ingresos mensuales

Registro simple del ingreso familiar mensual (sin gestión de fuentes en v1).

```sql
CREATE TABLE monthly_income (
  id          BIGSERIAL PRIMARY KEY,
  mes         DATE NOT NULL,                     -- primer día del mes (ej: 2026-04-01)
  monto       NUMERIC(14,2) NOT NULL,
  moneda      TEXT DEFAULT 'ARS',
  notas       TEXT
);
```

#### `alerts` — Alertas de vencimiento

Generadas automáticamente por el sistema a partir de servicios y cuotas con fecha conocida.

```sql
CREATE TABLE alerts (
  id            BIGSERIAL PRIMARY KEY,
  tipo          TEXT NOT NULL CHECK (tipo IN ('vencimiento_servicio','vencimiento_cuota','saldo_bajo')),
  referencia_id BIGINT,                          -- ID del servicio o cuota relacionado
  descripcion   TEXT NOT NULL,
  fecha_alerta  DATE NOT NULL,
  monto         NUMERIC(14,2),
  leida         BOOLEAN DEFAULT FALSE,
  creada_en     TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Valores válidos — Medios de pago

```
Efectivo
Mercado Pago
Personal Pay
BNA
Tarjeta de crédito (genérico)
BBVA Visa
BNA Mastercard
BNA Visa
Fiwind
Fiwind (USDT)
Brubank
Débito BNA
```

### 5.3 Valores válidos — Categorías por macro

```yaml
VIVIR:
  - Vivienda
  - Alimentación
  - Servicios
  - Animales
  - Salud
  - Movilidad
  - Formación

TRABAJAR:
  - Obligaciones fiscales
  - Seguros y servicios profesionales
  - Infraestructura digital
  - Equipamiento profesional

DEBER:
  - Préstamos
  - Deudas

DISFRUTAR:
  - Ocio y salidas
  - Compras personales
  - Suscripciones
```

---

## 6. Modelo de cuotas y tarjetas

### 6.1 Principio fundamental

> **La cuota es un atributo del pago, no una categoría.**

Cuando se compra algo en cuotas, el gasto se registra UNA SOLA VEZ con su categoría real (según el propósito de la compra). El sistema genera automáticamente los compromisos mensuales. El pago mensual a la tarjeta o al banco es un evento de caja — no es un gasto nuevo.

### 6.2 Ejemplo aplicado — Aspiradora en 24 cuotas

**Registro original (una vez, al momento de comprar):**
```
Macro:        VIVIR
Categoría:    Vivienda
Concepto:     Electrodoméstico
Detalle:      Aspiradora robot
Monto total:  $556.900
Medio de pago: BBVA Visa
En cuotas:    24
Cuota mensual: $23.209
Inicio:       Junio 2024
Fin est.:     Mayo 2026
```

**Lo que esto habilita automáticamente:**
1. El gasto queda categorizado como Vivienda (para análisis de "en qué gastamos").
2. Se generan 24 registros en `cuotas` con sus fechas y montos.
3. El módulo de Tarjetas muestra $23.209 como carga mensual de BBVA Visa.
4. El módulo de Horizonte incluye esta cuota en la proyección hasta mayo 2026.

### 6.3 Pago de tarjeta — Evento de caja

Cuando se paga el resumen de una tarjeta, el sistema registra:

```
Tipo:         evento_caja
Subtipo:      pago_tarjeta
Tarjeta:      BBVA Visa
Monto:        $114.410
Fecha:        15/04/2026
Medio:        BNA (débito)
```

Este registro NO suma a los gastos del período. Sirve para trazabilidad de cuándo y cuánto se pagó cada tarjeta.

### 6.4 Vista de tarjeta — Datos que muestra

Por cada tarjeta activa:

| Campo | Descripción |
|-------|-------------|
| Gastos del mes | Suma de todas las transacciones con ese `medio_pago` en el mes, agrupadas por categoría |
| Cuotas activas | Lista de planes activos asociados a esa tarjeta: nombre, cuota/mes, cuotas restantes, fecha de cancelación |
| Proyección próximo resumen | Gastos del mes + suma de cuotas activas |
| Pagos realizados | Historial de eventos de caja de pago de resumen |

### 6.5 Tarjetas activas

| Tarjeta | Cuotas activas | Carga mensual est. |
|---------|---------------|-------------------|
| BBVA Visa | Aspiradora (vence Oct 2026), RESMA | ~$58.000 |
| BNA Mastercard | RESMA | ~$5.052 |
| BNA Visa | — | Variable |
| BNA (cuenta) | Préstamo BNA, Préstamo ANSES | $205.913 |

---

## 7. Módulos de la app

### 7.1 Inicio (Home)

**Propósito:** Responder en menos de 3 segundos: "¿Cómo van las finanzas este mes?"

**Componentes:**

1. **Selector de unidad** — Pills: HOGAR / BRASIL / PROFESIONAL. Por defecto HOGAR. Filtra todos los datos mostrados debajo.

2. **Gauge de saldo** — Arco semicircular que muestra visualmente el porcentaje del ingreso comprometido. Números: Ingresos (verde), Comprometido (rojo), Libre (verde al pie). Porcentaje de uso del ingreso.

3. **Distribución por macro** — Barras horizontales proporcionales para VIVIR / TRABAJAR / DEBER / DISFRUTAR. Cada barra tiene: nombre del macro, barra de progreso con color de macro, porcentaje del total, monto.

4. **Distribución por categoría** — Dentro del mes actual, barras por categoría ordenadas de mayor a menor.

5. **Alertas de vencimiento** — Banner amarillo si hay servicios o cuotas con vencimiento en los próximos 7 días. Ejemplo: "EPEC vence el 11 abr · $45.000".

6. **Últimos movimientos** — Lista de las últimas 5 transacciones del mes con: ícono de categoría, nombre del concepto, fecha, quién cargó, monto.

---

### 7.2 Carga de gasto

**Propósito:** Reemplazar al bot de Telegram. Flujo de carga rápida, con sugerencia de IA.

**Flujo de carga:**

```
1. El usuario ingresa:
   - Monto (campo grande, numérico, primero)
   - Detalle libre (texto: "Shell autopista", "Bocantino mes", "EPEC")
   - Quién (Mauro / Agos / Compartido)
   - Fecha (default: hoy)

2. La IA sugiere automáticamente:
   - Macro
   - Categoría
   - Concepto
   - Unidad
   - Medio de pago (basado en historial)

3. El usuario revisa y confirma con un tap.
   Si algo está mal, toca el campo y lo corrige.

4. El sistema guarda y muestra confirmación.
```

**Campos del formulario completo:**

| Campo | Tipo | Requerido | Default |
|-------|------|-----------|---------|
| Monto | Numérico | Sí | — |
| Moneda | Select (ARS/USD/USDT) | Sí | ARS |
| Detalle | Texto libre | Sí | — |
| Quién | Select | Sí | Compartido |
| Fecha | Date | Sí | Hoy |
| Macro | Select (sugerido por IA) | Sí | — |
| Categoría | Select filtrado por macro | Sí | — |
| Concepto | Select + opción "otro" | Sí | — |
| Unidad | Select | Sí | HOGAR |
| Medio de pago | Select | Sí | Efectivo |
| Es cuota | Toggle | No | False |
| Plan de cuotas | Select (si es cuota) | Condicional | — |
| Notas | Texto libre | No | — |

---

### 7.3 Pasivos

**Propósito:** Vista clara de toda la deuda estructurada. Cuánto se debe, cuánto se paga por mes y cuándo termina.

**Componentes:**

1. **Resumen top:**
   - Carga mensual total de préstamos
   - Carga mensual de cuotas de bienes
   - Total pasivos / mes
   - Porcentaje del ingreso mensual que representa

2. **Préstamos activos** — Lista de todos los planes de tipo `prestamo` con:
   - Nombre del préstamo
   - Barra de progreso (% pagado)
   - Cuota actual / mes
   - Cuotas restantes
   - Fecha de cancelación estimada

3. **Cuotas de bienes activas** — Lista de planes de tipo `cuota_bien` con los mismos datos.

4. **Deudas** — Lista de planes de tipo `deuda`.

5. **Alerta BBVA** — Mientras exista el registro sin confirmar, mostrar banner rojo con acción "Registrar deuda".

6. **Hitos de liberación** — Línea de tiempo de cuándo se cancela cada deuda y cuánto flujo mensual libera.

---

### 7.4 Tarjetas

**Propósito:** Trazabilidad por tarjeta. Qué se cargó, cuánto debo este mes, cuándo vence.

**Componentes:**

1. **Selector de tarjeta** — Pills o dropdown con las tarjetas activas.

2. **Por tarjeta:**
   - Total cargado este mes (suma de transacciones con ese medio_pago)
   - Desglose por categoría de esos gastos
   - Cuotas activas vinculadas a esa tarjeta
   - Proyección del próximo resumen
   - Historial de pagos realizados (eventos de caja)

---

### 7.5 Horizonte

**Propósito:** Proyección a 6 meses. Qué pasa con el flujo si nada extraordinario ocurre.

**Componentes:**

1. **Gráfico de barras mensual** — Saldo libre proyectado para los próximos 6 meses. Verde si positivo, rojo si negativo.

2. **Gráfico de línea acumulado** — Ahorro acumulado proyectado mes a mes desde el mes actual.

3. **Hitos de cancelación** — Lista de eventos futuros que liberan flujo:
   - Qué deuda se cancela
   - En qué mes
   - Cuánto flujo mensual libera a partir de ese momento

4. **Supuestos del modelo** — Transparencia total sobre qué asumió el sistema para proyectar:
   - Ingresos constantes en $X/mes
   - Alquiler: valor actual + ajuste de porcentaje en fecha estimada
   - Deudas: se cancelan según calendario
   - Sin gastos extraordinarios proyectados

5. **Escenario Brasil** — Si el inmueble Brasil empieza a generar ingresos, el sistema permite ingresar un monto estimado de renta mensual (en USDT) y recalcula el horizonte con ese ingreso adicional.

---

### 7.6 Análisis (desktop)

**Propósito:** Vista detallada de tendencias históricas. Disponible principalmente en desktop.

**Componentes:**

1. **Evolución por macro** — Gráfico de área apilada mes a mes mostrando VIVIR / TRABAJAR / DEBER / DISFRUTAR.

2. **Comparativo mes actual vs anterior** — Por categoría, con diferencia absoluta y porcentual.

3. **Gastos en moneda extranjera** — Resumen mensual de egresos en USD y USDT con equivalente aproximado en ARS.

4. **Top conceptos del mes** — Los 10 conceptos con mayor gasto acumulado.

5. **Ocio y discrecional** — Evolución histórica exclusiva de Disfrutar para visibilizar el patrón.

---

## 8. Flujos de usuario

### 8.1 Carga rápida (mobile — Mauro)

```
Abre app → pantalla Carga de gasto
Escribe monto: "314000"
Escribe detalle: "bocantino"
La IA sugiere: VIVIR / Animales / Bocantino / HOGAR / MP
Toca "Confirmar"
→ Gasto guardado. Vuelve a Inicio.
Total: ~15 segundos.
```

### 8.2 Carga rápida (mobile — Agos)

```
Abre app → pantalla Carga de gasto
Escribe monto: "17000"
Escribe detalle: "empanadas"
Selecciona Quién: "Agos"
La IA sugiere: DISFRUTAR / Ocio y salidas / Empanadas / HOGAR / Efectivo
Revisa → todo bien → "Confirmar"
→ Guardado.
```

### 8.3 Revisión mensual (desktop — Mauro)

```
Abre app en desktop
Ve Inicio → gauge muestra 92% comprometido este mes
Navega a Análisis
Compara categorías vs mes anterior
Detecta que Animales subió $40.000 por vacunas
Navega a Horizonte → verifica que Oct 2026 libera $115.000/mes al cancelar PF y aspiradora
```

### 8.4 Alta de nuevo préstamo o cuota

```
Navega a Pasivos
"+ Nuevo plan de cuotas"
Completa: nombre, tipo (prestamo/cuota_bien/deuda), monto_cuota, total_cuotas, medio_pago, fecha_inicio
El sistema genera automáticamente todas las cuotas en la tabla `cuotas`
Aparece en la lista de Pasivos activos
Aparece en la proyección de Horizonte
```

---

## 9. Motor de sugerencia IA

### 9.1 Propósito

Reducir la fricción de carga. El usuario ingresa monto + detalle libre; la IA devuelve la clasificación sugerida. El usuario confirma o corrige. Cada corrección entrena el modelo para ese usuario.

### 9.2 Proveedor

**Gemini 2.5 Flash** — ya integrado en Lumen (app de historia clínica del mismo desarrollador). Usar el mismo pipeline.

### 9.3 Lógica de sugerencia

1. Se envía al modelo: `{detalle, monto, quien, historial_ultimos_30_dias}`
2. El modelo devuelve JSON con: `{macro, categoria, concepto, unidad, medio_pago, confianza}`
3. Si confianza > 0.85: se pre-rellena el formulario y se pide solo confirmación.
4. Si confianza < 0.85: se pre-rellena pero se destaca visualmente que la sugerencia es incierta.
5. Si el usuario corrige: se guarda la corrección como par `(detalle, clasificación_correcta)` para mejorar futuras sugerencias del mismo concepto.

### 9.4 Prompt base

```
Sos un asistente de finanzas personales para un hogar argentino.
Dado un gasto con detalle: "{detalle}" de ${monto} ARS,
clasifícalo según esta taxonomía:

Macros: VIVIR, TRABAJAR, DEBER, DISFRUTAR
Categorías por macro: [insertar taxonomía completa]
Unidades: HOGAR, BRASIL, PROFESIONAL

Contexto del usuario:
- Psicólogos autónomos en Alta Gracia, Córdoba
- Tienen un inmueble en Brasil (unidad BRASIL)
- Mascotas: perros y gatos (Bocantino = comida de mascotas)
- RESMA = servicio de derivación clínica (TRABAJAR, no movilidad)
- El pago de tarjeta NO es un gasto, no clasificar como tal

Historial reciente: {historial}

Devolvé SOLO JSON con: macro, categoria, concepto, unidad, medio_pago_sugerido, confianza (0–1)
```

### 9.5 Casos especiales con regla fija (no delegar a IA)

| Detalle detectado | Clasificación forzada |
|-------------------|-----------------------|
| Contiene "pago tarjeta", "resumen", "saldo tarjeta" | Rechazar como gasto. Sugerir registrar como evento de caja. |
| Contiene "bocantino" | VIVIR / Animales / Bocantino / HOGAR |
| Contiene "resma" | TRABAJAR / Seguros y servicios profesionales / RESMA / PROFESIONAL |
| Contiene "monotributo" | TRABAJAR / Obligaciones fiscales / Monotributo [quien] / PROFESIONAL |
| Contiene "epec" | VIVIR / Servicios / EPEC / HOGAR |
| Contiene "cooperativa" | VIVIR / Servicios / Cooperativa / HOGAR |

---

## 10. Stack técnico e integraciones

### 10.1 Stack

| Capa | Tecnología | Descripción |
|------|-----------|-------------|
| Frontend | React + TypeScript + Tailwind CSS | UI de la app. Mismo stack que Lumen. |
| Desktop wrapper | Tauri 2.0 | Si se integra como módulo del superapp. |
| Backend | Hono (Node.js/Deno) | API REST/JSON. Liviano, mismo enfoque que otras apps del ecosistema. |
| Base de datos | PostgreSQL (VPS Hetzner) | Ya existe. La BD de transacciones ya tiene datos desde ene 2026. |
| Estado global | Zustand | Mismo que Lumen y superapp. |
| IA | Gemini 2.5 Flash | Sugerencia de categorías. Ya integrado en Lumen. |
| Automatización | n8n (self-hosted en Hetzner) | Pipeline de ingesta de gastos. Ya existe. |

### 10.2 Base de datos existente

La BD PostgreSQL ya tiene una tabla de transacciones con el esquema actual:

```sql
-- Esquema existente (aproximado, basado en el CSV exportado)
id, fecha_operation, unidad, categoria, concepto, detalle,
monto, moneda, medio_pago, fecha_carga, id_telegram,
source, validado, mensaje_control_id, editado_por_ia, tipo
```

**Migración requerida:** agregar columnas `macro`, `quien` y `cuota_id` a la tabla existente. Migrar datos históricos aplicando la nueva taxonomía (la IA puede hacer el mapeo automático de categorías viejas a nuevas).

### 10.3 Integraciones

| Sistema | Tipo | Estado | Descripción |
|---------|------|--------|-------------|
| PostgreSQL Hetzner | Core | Existente | BD principal de transacciones. |
| n8n | Automatización | Existente | Orquesta la ingesta. La app lo reemplaza para carga manual; n8n sigue activo para automatizaciones batch. |
| Bot de Telegram | Entrada | A deprecar | Reemplazado por la app. n8n puede mantenerlo como canal alternativo para Agos si lo prefiere. |
| Gemini 2.5 Flash | IA | Existente en Lumen | Reutilizar el cliente ya implementado. |
| Fiwind | Consulta | No integrado | Los pagos en USDT se registran manualmente al ver el movimiento en Fiwind. No hay API disponible. |

### 10.4 Endpoints API (referencia)

```
GET  /api/transactions?mes=2026-04&unidad=HOGAR
POST /api/transactions
PUT  /api/transactions/:id
DELETE /api/transactions/:id

GET  /api/summary/month?mes=2026-04
GET  /api/summary/macros?mes=2026-04

GET  /api/installment-plans
POST /api/installment-plans
PUT  /api/installment-plans/:id

GET  /api/cards/:card_id/summary?mes=2026-04
GET  /api/horizon?meses=6

GET  /api/alerts/pending
PUT  /api/alerts/:id/read

POST /api/ai/suggest
     body: { detalle, monto, quien, historial_ids }
     returns: { macro, categoria, concepto, unidad, medio_pago, confianza }
```

---

## 11. Reglas de negocio

### 11.1 Reglas de clasificación

| Regla | Descripción |
|-------|-------------|
| Pago de tarjeta | NUNCA se registra como gasto. Es un evento de caja. Si el usuario intenta cargarlo, la app lo detecta y sugiere el flujo de evento de caja. |
| Librería | Depende del uso: estudio → Formación, trabajo → Equipamiento profesional, personal → Compras personales. La IA pregunta si hay ambigüedad. |
| Medicamentos y salud | SIEMPRE Vivir / Salud. Sin excepción. |
| Mantenimiento hogar | SIEMPRE Vivir / Vivienda. Aunque sea imprevisto. |
| RESMA | SIEMPRE Trabajar / Seguros y servicios profesionales. |
| Bocantino | SIEMPRE Vivir / Animales. Engloba toda la comida de mascotas. |
| IPTU Brasil | SIEMPRE Vivir / Servicios / unidad BRASIL. Es un servicio municipal, no una obligación laboral. |

### 11.2 Reglas de proyección (Horizonte)

1. Los ingresos se proyectan como constantes al último valor registrado.
2. El alquiler aumenta un 9,5% en la fecha estimada del próximo ajuste contractual.
3. Los préstamos se cancelan exactamente en su `fecha_fin_est`.
4. Los gastos variables (Alimentación, Ocio) se proyectan como promedio de los últimos 3 meses.
5. Los gastos fijos (Servicios, Monotributos) se proyectan con el último valor conocido.
6. Los gastos ocasionales (vacunas, honorarios inmobiliaria) no se proyectan salvo que exista una fecha futura registrada.

### 11.3 Reglas de alertas

| Condición | Alerta | Anticipación |
|-----------|--------|--------------|
| Servicio con fecha de vencimiento en los próximos 7 días | Banner amarillo en Inicio | 7 días antes |
| Cuota de tarjeta > 80% del estimado del resumen | Aviso en vista de tarjeta | Al superar umbral |
| Saldo libre proyectado negativo en algún mes del horizonte | Alerta en Horizonte | Al calcular |
| Préstamo BBVA sin confirmar | Banner rojo en Pasivos | Siempre hasta resolución |

### 11.4 Reglas de moneda

1. Las transacciones en USD y USDT se almacenan en su moneda original.
2. El tipo de cambio no se aplica automáticamente para no introducir datos incorrectos.
3. Los totales mensuales en ARS excluyen las transacciones en moneda extranjera (se muestran por separado).
4. El resumen de Brasil en USDT se muestra siempre separado del HOGAR en ARS.

---

## 12. Glosario

| Término | Definición |
|---------|------------|
| **Macro** | Nivel superior de clasificación de gastos. Representa el propósito: VIVIR, TRABAJAR, DEBER, DISFRUTAR. |
| **Categoría** | Segundo nivel de clasificación, dentro de un macro. Ej: Alimentación, Movilidad. |
| **Concepto** | Tercer nivel, tipo específico de gasto dentro de una categoría. Ej: Nafta, Supermercado. |
| **Detalle** | Texto libre del usuario describiendo el gasto exacto. Ej: "Shell autopista" o "Bocantino enero". |
| **Unidad** | Centro de costo o contexto geográfico/funcional: HOGAR, BRASIL, PROFESIONAL. |
| **Medio de pago** | Instrumento con el que se realizó el pago. No define la categoría. |
| **Base devengada** | Criterio contable donde el gasto se registra cuando ocurre, independientemente del pago. Usado en la planilla. |
| **Base caja** | Criterio contable donde el gasto se registra cuando el dinero efectivamente sale. Usado en la BD transaccional. |
| **Evento de caja** | Movimiento de dinero que no es un gasto nuevo: pago de tarjeta, transferencia entre cuentas. |
| **Plan de cuotas** | Estructura que representa una compra en cuotas o préstamo. Genera cuotas individuales automáticamente. |
| **Cuota** | Instancia mensual de pago de un plan de cuotas. Tiene fecha, monto y estado (pendiente/pagado/vencido). |
| **Horizonte** | Módulo de proyección a 6 meses del flujo de caja familiar. |
| **Bocantino** | Proveedor de comida para mascotas (pollo fresco). Por extensión, el concepto que engloba toda la comida de los animales del hogar. |
| **RESMA** | Servicio profesional de derivación de pacientes, formaciones y supervisiones clínicas. Gasto mensual de ambos psicólogos. |
| **AGIP** | Administración Gubernamental de Ingresos Públicos (CABA). La deuda con AGIP es un plan de pago de obligaciones impositivas. |
| **IPTU** | Imposto Predial e Territorial Urbano: impuesto municipal sobre la propiedad en Brasil. Equivalente al ABL en Argentina. Se paga en USDT. |
| **Condominio** | Gastos de administración del edificio en Balneário Camboriú. Equivalente a expensas en Argentina. Se paga en USDT. |
| **n8n** | Plataforma de automatización self-hosted. Orquesta la ingesta de datos y automatizaciones del ecosistema. |
| **Fiwind** | Billetera virtual para operar en USDT. Usada para todos los pagos del inmueble Brasil. |
| **Lumen** | App de historia clínica desarrollada por Mauro (TypeScript + React + Firestore + Gemini). Referencia para reutilizar stack e integraciones. |

---

*Fin del documento. Versión 1.0 — Abril 2026.*
