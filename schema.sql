-- ============================================================
-- Pyrux OS — Database Schema
-- Paste and run this in the Supabase SQL Editor
-- ============================================================

-- ─── TYPES ──────────────────────────────────────────────────

CREATE TYPE expense_frequency AS ENUM ('semanal', 'mensual', 'anual');

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
  notes         text
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
  paid          boolean default false,
  exchange_rate numeric null
);

CREATE TABLE IF NOT EXISTS expenses (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  description         text not null,
  amount              numeric not null,
  currency            text not null default 'ARS' check (currency in ('ARS','USD')),
  date                date not null,
  category            text check (category in ('herramientas','hosting','marketing','servicios','impuestos','otro')),
  recurrent           boolean default false,
  frequency           expense_frequency null,
  generated_from_id   uuid references expenses(id) on delete set null,
  notes               text,
  exchange_rate       numeric null
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

-- Seed the default exchange rate; override in seed.sql as needed
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

CREATE INDEX IF NOT EXISTS idx_prospects_status        ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_projects_status         ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_prospect_id    ON projects(prospect_id);
CREATE INDEX IF NOT EXISTS idx_income_project_id       ON income(project_id);
CREATE INDEX IF NOT EXISTS idx_income_date             ON income(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date           ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_generated_from ON expenses(generated_from_id)
  WHERE generated_from_id IS NOT NULL;

-- ─── RECURRING EXPENSES FUNCTION ────────────────────────────
-- Generates copies for all missing periods from template.date → NOW.
-- Templates: recurrent = true, frequency IS NOT NULL, generated_from_id IS NULL
-- Copies:    recurrent = false, generated_from_id = <template id>

CREATE OR REPLACE FUNCTION generate_recurring_expenses()
RETURNS void AS $$
DECLARE
  tmpl          RECORD;
  check_date    DATE;
  period_start  DATE;
  period_end    DATE;
  already_exists BOOLEAN;
BEGIN
  FOR tmpl IN
    SELECT *
    FROM   expenses
    WHERE  recurrent          = true
      AND  frequency          IS NOT NULL
      AND  generated_from_id  IS NULL
  LOOP
    CASE tmpl.frequency

      WHEN 'semanal' THEN
        check_date := (date_trunc('week', tmpl.date) + INTERVAL '1 week')::DATE;
        WHILE check_date <= CURRENT_DATE LOOP
          period_start := date_trunc('week', check_date)::DATE;
          period_end   := (period_start + INTERVAL '6 days')::DATE;
          SELECT EXISTS (
            SELECT 1 FROM expenses
            WHERE  generated_from_id = tmpl.id
              AND  date >= period_start AND date <= period_end
          ) INTO already_exists;
          IF NOT already_exists THEN
            INSERT INTO expenses (description, amount, currency, date, category, recurrent, notes, generated_from_id, frequency)
            VALUES (tmpl.description, tmpl.amount, tmpl.currency, period_start, tmpl.category, false, tmpl.notes, tmpl.id, NULL);
          END IF;
          check_date := (check_date + INTERVAL '1 week')::DATE;
        END LOOP;

      WHEN 'mensual' THEN
        check_date := (date_trunc('month', tmpl.date) + INTERVAL '1 month')::DATE;
        WHILE check_date <= CURRENT_DATE LOOP
          period_start := date_trunc('month', check_date)::DATE;
          period_end   := (period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
          SELECT EXISTS (
            SELECT 1 FROM expenses
            WHERE  generated_from_id = tmpl.id
              AND  date >= period_start AND date <= period_end
          ) INTO already_exists;
          IF NOT already_exists THEN
            INSERT INTO expenses (description, amount, currency, date, category, recurrent, notes, generated_from_id, frequency)
            VALUES (tmpl.description, tmpl.amount, tmpl.currency, period_start, tmpl.category, false, tmpl.notes, tmpl.id, NULL);
          END IF;
          check_date := (check_date + INTERVAL '1 month')::DATE;
        END LOOP;

      WHEN 'anual' THEN
        check_date := (date_trunc('year', tmpl.date) + INTERVAL '1 year')::DATE;
        WHILE check_date <= CURRENT_DATE LOOP
          period_start := date_trunc('year', check_date)::DATE;
          period_end   := (period_start + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
          SELECT EXISTS (
            SELECT 1 FROM expenses
            WHERE  generated_from_id = tmpl.id
              AND  date >= period_start AND date <= period_end
          ) INTO already_exists;
          IF NOT already_exists THEN
            INSERT INTO expenses (description, amount, currency, date, category, recurrent, notes, generated_from_id, frequency)
            VALUES (tmpl.description, tmpl.amount, tmpl.currency, period_start, tmpl.category, false, tmpl.notes, tmpl.id, NULL);
          END IF;
          check_date := (check_date + INTERVAL '1 year')::DATE;
        END LOOP;

    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── pg_cron: schedule weekly generation ────────────────────
-- Prerequisites:
--   1. Enable pg_cron in Supabase: Database → Extensions → pg_cron
--   2. Then run the SELECT below to register the job
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule(
--   'generate-recurring-expenses',
--   '0 6 * * 1',
--   'SELECT generate_recurring_expenses();'
-- );
