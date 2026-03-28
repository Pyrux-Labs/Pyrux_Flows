# Pyrux OS — Internal Operations App

## Spec for Claude Code

---

## Overview

Internal web app for Pyrux agency (2 users only: Juanma + Gino).
Built with Next.js 14 (App Router) + Supabase + Shadcn/ui + Tailwind CSS.
Deployed on Vercel. Auth via Supabase Auth (email + password, invite-only).

**Goal:** Replace spreadsheets and scattered notes with a single internal tool.
Notion-like feel but purpose-built for a web dev agency: tables, kanbans, pipelines, and relational data across modules.

---

## Tech Stack

| Layer      | Choice                           |
| ---------- | -------------------------------- |
| Framework  | Next.js 14 (App Router)          |
| Database   | Supabase (PostgreSQL)            |
| Auth       | Supabase Auth — email + password |
| UI         | Shadcn/ui + Tailwind CSS         |
| Deployment | Vercel                           |
| Language   | TypeScript                       |

**Notes for Claude:**

- Use `@supabase/ssr` for server-side auth (not the deprecated `auth-helpers`).
- Use Shadcn/ui components wherever possible to minimize custom CSS and token waste.
- Prefer server components + server actions over API routes.
- Use `shadcn/ui` table, kanban cards, badge, select, dialog, sheet, and tabs components.

---

## Auth & Access Control

- **Only 2 users allowed.** No public registration.
- Both users are pre-seeded in Supabase Auth (Juanma + Gino).
- Middleware protects all routes — unauthenticated users redirect to `/login`.
- `/login` page: email + password form using Supabase Auth.
- No password reset flow needed for now (can be added later).
- Both users have identical access — no role differentiation.

### Supabase RLS

- Enable RLS on all tables.
- Policy: authenticated users can SELECT, INSERT, UPDATE, DELETE on all rows.

---

## App Structure

```
/app
  /login              → Login page (public)
  /(dashboard)        → Protected layout with sidebar
    /page.tsx         → Dashboard home (summary widgets)
    /prospectos       → CRM / Prospects module
    /proyectos        → Active clients & projects
    /finanzas         → Income tracking
    /gastos           → Expenses tracking
    /tarifas          → Services & pricing catalog
```

### Shared Layout (dashboard)

- Left sidebar with navigation links to each module.
- Top bar with current user avatar + logout button.
- Sidebar shows module name + icon (use Lucide icons).
- Responsive: sidebar collapses to icon-only on smaller screens.

---

## Database Schema

### `prospects` table

```sql
id            uuid primary key default gen_random_uuid()
created_at    timestamptz default now()
name          text not null
business      text
sector        text  -- 'contabilidad' | 'legal' | 'medico' | 'estetica' | 'gastronomia' | 'fitness' | 'dental' | 'otro'
email         text
phone         text
source        text  -- 'word_of_mouth' | 'instagram' | 'linkedin' | 'cold_email' | 'whatsapp' | 'otro'
status        text  -- 'nuevo' | 'contactado' | 'en_negociacion' | 'cerrado' | 'perdido'
notes         text
assigned_to   text  -- 'juanma' | 'gino'
last_contact  date
```

### `projects` table

```sql
id            uuid primary key default gen_random_uuid()
created_at    timestamptz default now()
name          text not null
client_name   text not null
prospect_id   uuid references prospects(id)  -- optional link to prospect
status        text  -- 'activo' | 'pausado' | 'completado' | 'cancelado'
start_date    date
end_date      date
budget        numeric
paid          boolean default false
notes         text
assigned_to   text  -- 'juanma' | 'gino' | 'ambos'
```

### `income` table

```sql
id            uuid primary key default gen_random_uuid()
created_at    timestamptz default now()
project_id    uuid references projects(id)
description   text not null
amount        numeric not null
currency      text default 'ARS'  -- 'ARS' | 'USD'
date          date not null
category      text  -- 'proyecto' | 'mantenimiento' | 'consultoria' | 'otro'
invoice_sent  boolean default false
paid          boolean default false
```

### `expenses` table

```sql
id            uuid primary key default gen_random_uuid()
created_at    timestamptz default now()
description   text not null
amount        numeric not null
currency      text default 'ARS'
date          date not null
category      text  -- 'herramientas' | 'hosting' | 'marketing' | 'servicios' | 'impuestos' | 'otro'
recurrent     boolean default false
notes         text
```

### `services` table (tarifas)

```sql
id            uuid primary key default gen_random_uuid()
created_at    timestamptz default now()
name          text not null
description   text
price         numeric
currency      text default 'USD'
unit          text  -- 'proyecto' | 'hora' | 'mes'
category      text  -- 'web' | 'cms' | 'automatizacion' | 'mantenimiento' | 'consultoria'
active        boolean default true
```

---

## Modules

---

### 1. Dashboard (Home `/`)

Summary widgets at the top:

- Total ingresos del mes (ARS + USD separados)
- Total gastos del mes
- Prospectos nuevos esta semana
- Proyectos activos

Below widgets: recent activity — last 5 prospects added, last 5 income entries.

---

### 2. Prospectos / CRM (`/prospectos`)

**Views (tabs at top of page):**

- **Tabla** — default view, all prospects in a data table with columns: Nombre, Empresa, Sector, Estado, Fuente, Asignado, Último contacto, Acciones.
- **Kanban** — prospects grouped by `status` in columns: Nuevo → Contactado → En negociación → Cerrado / Perdido.
- **Pipeline** — same as kanban but horizontal, with count + total value per stage.

**Features:**

- Add new prospect via slide-over sheet (Sheet component from shadcn).
- Edit prospect inline or via sheet.
- Delete with confirmation dialog.
- Filter by: sector, status, assigned_to, source.
- Search by name or business.
- Drag-and-drop cards in kanban to change status (use `@dnd-kit/core`).
- Click a prospect card/row → opens detail sheet with all fields + linked projects.

**Relation:** A prospect can be linked to one or more projects.

---

### 3. Proyectos / Clientes activos (`/proyectos`)

**Views (tabs):**

- **Tabla** — all projects with columns: Nombre, Cliente, Estado, Inicio, Fin, Presupuesto, Pagado, Asignado.
- **Kanban** — grouped by status: Activo / Pausado / Completado / Cancelado.

**Features:**

- Add/edit project via sheet.
- Link project to an existing prospect (select dropdown showing prospects list).
- Click project → detail sheet showing: project info + linked income entries + prospect info.
- Filter by status, assigned_to, paid.

**Relation:** Projects link to prospects (optional) and to income entries.

---

### 4. Finanzas / Ingresos (`/finanzas`)

**Views (tabs):**

- **Tabla** — all income entries sorted by date desc. Columns: Descripción, Proyecto, Monto, Moneda, Fecha, Categoría, Factura, Pagado.
- **Resumen** — monthly summary: total ARS, total USD, breakdown by category, simple bar chart (use Recharts).

**Features:**

- Add/edit income via sheet.
- Link income to a project (optional).
- Toggle `invoice_sent` and `paid` inline with a checkbox.
- Filter by month, currency, category, paid status.
- Show totals at bottom of table.

**Relation:** Income entries link to projects.

---

### 5. Gastos (`/gastos`)

**Views (tabs):**

- **Tabla** — all expenses sorted by date desc. Columns: Descripción, Monto, Moneda, Fecha, Categoría, Recurrente.
- **Resumen** — monthly totals + breakdown by category (Recharts bar or pie chart).

**Features:**

- Add/edit expense via sheet.
- Filter by month, category, recurrent.
- Show monthly total at top.

---

### 6. Tarifas / Servicios (`/tarifas`)

**View:** Simple card grid — each service as a card showing name, description, price, unit, category, active/inactive badge.

**Features:**

- Add/edit service via sheet.
- Toggle active/inactive.
- No complex views needed — this is a reference catalog.

---

## UI / UX Guidelines

- **Color palette:** Use Pyrux brand colors as CSS variables:
  - Primary: `#ff7b3d`
  - Accent: `#d4a574
  - Background: dark warm (`#1a1612` or similar dark brown-black)
  - Use dark theme as default.
- **Language:** All UI text in Spanish.
- **Date format:** `dd/MM/yyyy` throughout.
- **Currency display:** Always show currency symbol — `$` for ARS, `U$D` for USD.
- **Shadcn theme:** Customize `globals.css` CSS variables to match Pyrux palette.
- **Icons:** Lucide React exclusively.
- **Transitions:** Subtle — use Shadcn's built-in sheet/dialog animations only.
- **Tables:** Use Shadcn `Table` component. Add hover highlight on rows.
- **Empty states:** Each module shows a simple empty state illustration (text + icon) when no data.

---

## File Structure

```
/app
  /(auth)
    /login/page.tsx
  /(dashboard)
    layout.tsx              ← sidebar + topbar
    page.tsx                ← dashboard home
    /prospectos/page.tsx
    /proyectos/page.tsx
    /finanzas/page.tsx
    /gastos/page.tsx
    /tarifas/page.tsx
/components
  /ui/                      ← shadcn components (auto-generated)
  /layout/
    sidebar.tsx
    topbar.tsx
  /modules/
    /prospectos/
      prospect-table.tsx
      prospect-kanban.tsx
      prospect-pipeline.tsx
      prospect-sheet.tsx    ← add/edit form
      prospect-card.tsx     ← kanban card
    /proyectos/
      project-table.tsx
      project-kanban.tsx
      project-sheet.tsx
    /finanzas/
      income-table.tsx
      income-summary.tsx
      income-sheet.tsx
    /gastos/
      expense-table.tsx
      expense-summary.tsx
      expense-sheet.tsx
    /tarifas/
      service-grid.tsx
      service-card.tsx
      service-sheet.tsx
  /shared/
    data-table.tsx          ← reusable table wrapper
    empty-state.tsx
    currency-badge.tsx
    status-badge.tsx
    confirm-dialog.tsx
/lib
  /supabase/
    client.ts               ← browser client
    server.ts               ← server client
  /types/
    database.types.ts       ← generated from Supabase
    index.ts                ← app types
  utils.ts
/hooks
  use-prospects.ts
  use-projects.ts
  use-income.ts
  use-expenses.ts
  use-services.ts
/middleware.ts              ← auth protection
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xelxhbrcyoxvjjbzlfip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbHhoYnJjeW94dmpqYnpsZmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDQ5NjgsImV4cCI6MjA5MDI4MDk2OH0.OeX5Q1w2TZUAkN4AQgYtY8WJoE9p7sHuX-RZ5L1nT7o
SUPABASE_SERVICE_ROLE_KEY=   # only for seeding users server-side
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_gUFhI7Kc9nFrXpLNaKfH-A_eszJvgmo
```

---

## Setup Steps for Claude

1. Initialize the project with the official Supabase + Next.js template:

   ```bash
   npx create-next-app -e with-supabase .
   ```

   This sets up Next.js 14 (App Router) + Supabase SSR + auth middleware + env variables out of the box. No manual Supabase client configuration needed.

2. Install and configure Shadcn/ui (use `zinc` base, then override with Pyrux colors).
3. Install dependencies:
   - `@supabase/ssr`
   - `@supabase/supabase-js`
   - `@dnd-kit/core` `@dnd-kit/sortable` `@dnd-kit/utilities`
   - `recharts`
   - `lucide-react`
   - `date-fns`
   - `zod`
   - `react-hook-form`
   - `@hookform/resolvers`
4. Create Supabase project and run the SQL schema above.
5. Enable RLS and add authenticated-user policies on all tables.
6. Configure middleware for auth protection.
7. Build modules in this order: Auth → Layout → Tarifas (simplest) → Gastos → Finanzas → Proyectos → Prospectos (most complex, has kanban + dnd).

---

## Out of Scope (for now)

- Mobile app
- Notifications / email alerts
- File uploads / attachments
- Multi-tenancy
- Password reset flow
- Activity log / audit trail
- Automations

---

## Notes

- This is an internal tool, not client-facing. Prioritize functionality over polish.
- Both users (Juanma + Gino) should be seeded directly in Supabase dashboard — no signup flow.
- Keep components small and focused. One responsibility per file.
- Use server actions for mutations (insert, update, delete) — avoid client-side fetch to Supabase where possible.
- All forms use `react-hook-form` + `zod` validation.
