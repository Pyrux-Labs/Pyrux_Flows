-- ============================================================
-- Pyrux OS — Database Schema
-- Paste and run this in the Supabase SQL Editor
-- ============================================================

-- ─── TABLES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prospects (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text not null,
  business      text,
  sector        text check (sector in ('contabilidad','legal','medico','estetica','gastronomia','fitness','dental','otro')),
  email         text,
  phone         text,
  source        text check (source in ('word_of_mouth','instagram','linkedin','cold_email','whatsapp','otro')),
  status        text not null default 'nuevo' check (status in ('nuevo','contactado','en_negociacion','cerrado','perdido')),
  notes         text,
  assigned_to   text check (assigned_to in ('juanma','gino')),
  last_contact  date
);

CREATE TABLE IF NOT EXISTS projects (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text not null,
  client_name   text not null,
  prospect_id   uuid references prospects(id) on delete set null,
  status        text not null default 'activo' check (status in ('activo','pausado','completado','cancelado')),
  start_date    date,
  end_date      date,
  budget        numeric,
  paid          boolean default false,
  notes         text,
  assigned_to   text check (assigned_to in ('juanma','gino','ambos'))
);

CREATE TABLE IF NOT EXISTS income (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  project_id    uuid references projects(id) on delete set null,
  description   text not null,
  amount        numeric not null,
  currency      text not null default 'ARS' check (currency in ('ARS','USD')),
  date          date not null,
  category      text check (category in ('proyecto','mantenimiento','consultoria','otro')),
  invoice_sent  boolean default false,
  paid          boolean default false
);

CREATE TABLE IF NOT EXISTS expenses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  description   text not null,
  amount        numeric not null,
  currency      text not null default 'ARS' check (currency in ('ARS','USD')),
  date          date not null,
  category      text check (category in ('herramientas','hosting','marketing','servicios','impuestos','otro')),
  recurrent     boolean default false,
  notes         text
);

CREATE TABLE IF NOT EXISTS services (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text not null,
  description   text,
  price         numeric,
  currency      text not null default 'USD' check (currency in ('ARS','USD')),
  unit          text check (unit in ('proyecto','hora','mes')),
  category      text check (category in ('web','cms','automatizacion','mantenimiento','consultoria')),
  active        boolean default true
);

-- Settings table for app-level configuration (e.g. USD→ARS exchange rate)
CREATE TABLE IF NOT EXISTS settings (
  key           text primary key,
  value         text not null,
  updated_at    timestamptz default now()
);

-- Seed the default exchange rate (update this value in /configuracion)
INSERT INTO settings (key, value) VALUES ('usd_ars_rate', '1200')
  ON CONFLICT (key) DO NOTHING;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

ALTER TABLE prospects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE income     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings   ENABLE ROW LEVEL SECURITY;

-- Policy: any authenticated user can do everything
CREATE POLICY "authenticated_all" ON prospects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON income
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── INDEXES ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_prospects_status      ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_status       ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_prospect_id  ON projects(prospect_id);
CREATE INDEX IF NOT EXISTS idx_income_project_id     ON income(project_id);
CREATE INDEX IF NOT EXISTS idx_income_date           ON income(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date         ON expenses(date);
