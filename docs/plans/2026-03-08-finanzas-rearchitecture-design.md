# Finanzas 2.0 — Design Document

## 1. Overview and Goals
A complete revamp of the Finanzas application to move away from Firebase and connect to an existing PostgreSQL database managed via n8n on a VPS. The goal is to create a comprehensive financial hub that handles not only expense tracking but also incomes, debts, credit profiles, projections, and FX tracking (ARS/USD, ARS/BRL).

## 2. Architecture
*   **Frontend:** React 19 + TypeScript + Vite (existing stack).
*   **Backend:** PostgREST deployed via Coolify on the VPS, exposing the PostgreSQL database as a REST API. This allows rapid development without writing server boilerplate, while keeping the door open for a custom Node.js/Fastify API in the future for complex logic.
*   **External APIs:** CriptoYa API for real-time and historical FX rates.

## 3. Data Model Enhancements
The schema will extend the existing `movimientos`, `medios_pago`, and `categorias_maestras` tables.

To handle the variability of incomes, services, and budgets, we adopt a **Period-Based Model**:
*   **Definitions (Templates):** `servicios_definicion`, `ingresos_definicion`, `presupuestos_definicion`. These store the recurring nature (e.g., "EPEC", "Honorarios") without locking in fixed amounts.
*   **Executions (Monthly Occurrences):** A scheduled process (n8n or SQL trigger) generates `movimientos_previstos_mes` records based on the definitions. These start as "Pending" and are updated with real amounts as they occur, providing both a historical record of variations and flexible month-to-month budgeting.
*   **New Tables:** `cuotas_tarjeta` (purchases in installments), `prestamos` (bank loans), `cotizaciones_fx` (cached from CriptoYa).

## 4. Modules and Navigation
The app will serve two distinct contexts: mobile for rapid data entry, and desktop for in-depth analysis.

1.  **Dashboard:** Daily summary (balance, alerts, FX). Desktop gets a full BI panel.
2.  **Movimientos:** Feed + rapid entry (FAB). Desktop gets filterable tables & charts.
3.  **Tarjetas & Crédito:** Pending installments, loan progress. Desktop gets full credit profile & projections.
4.  **Servicios:** Monthly checklist of due dates.
5.  **Análisis (Desktop Focus):** Full BI, comparative analysis, trends.
6.  **Cotizaciones FX:** Real-time rates and history (ARS/USD, ARS/BRL).

## 5. UI/UX Aesthetic Direction
**Theme: "Editorial Orgánico" (Calm & Clear)**
*   **Vibe:** Acts more as a relaxed personal assistant than a technical trading app.
*   **Colors:** Warm pastel tones, light beige or dark stone gray backgrounds. Accents in terracotta, sage green, and navy blue.
*   **Details:** Very soft shadows, highly rounded borders, and typography with personality (e.g., modern serifs like *Lora* for headings, clean sans-serifs for numbers).
*   **Goal:** To provide a calming, clear, and trustworthy environment for financial management.

## 6. Next Steps
1.  Set up PostgREST on the VPS.
2.  Draft the structural implementation plan following the `frontend-design` and `vercel-react-best-practices` guidelines.
3.  Begin iterative component development.
