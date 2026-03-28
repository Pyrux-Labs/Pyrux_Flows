-- Migration: recurring expenses frequency + auto-generation
-- Run this in Supabase SQL editor (Database → SQL Editor)

-- 1. Add frequency enum
CREATE TYPE expense_frequency AS ENUM ('semanal', 'mensual', 'anual');

-- 2. Add frequency column (null = not recurring or not yet set)
ALTER TABLE expenses
  ADD COLUMN frequency expense_frequency NULL;

-- 3. Add generated_from_id — links auto-generated copies back to their template
--    ON DELETE SET NULL so copies survive if the template is manually deleted
ALTER TABLE expenses
  ADD COLUMN generated_from_id UUID REFERENCES expenses(id) ON DELETE SET NULL;

-- 4. Index for fast lookup of copies per template
CREATE INDEX idx_expenses_generated_from_id ON expenses(generated_from_id)
  WHERE generated_from_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- Function: generate_recurring_expenses()
-- Generates copies for all periods (from template.date → NOW) that are missing.
-- Templates: recurrent = true, frequency IS NOT NULL, generated_from_id IS NULL
-- Copies:    recurrent = false, generated_from_id = <template id>
-- ─────────────────────────────────────────────────────────────────────────────
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
      AND  generated_from_id  IS NULL   -- only process templates, not copies
  LOOP
    CASE tmpl.frequency

      -- ── Weekly ─────────────────────────────────────────────────────────────
      WHEN 'semanal' THEN
        -- Start from the week after the template was created
        check_date := (date_trunc('week', tmpl.date) + INTERVAL '1 week')::DATE;

        WHILE check_date <= CURRENT_DATE LOOP
          period_start := date_trunc('week', check_date)::DATE;
          period_end   := (period_start + INTERVAL '6 days')::DATE;

          SELECT EXISTS (
            SELECT 1 FROM expenses
            WHERE  generated_from_id = tmpl.id
              AND  date >= period_start
              AND  date <= period_end
          ) INTO already_exists;

          IF NOT already_exists THEN
            INSERT INTO expenses
              (description, amount, currency, date, category, recurrent, notes, generated_from_id, frequency)
            VALUES
              (tmpl.description, tmpl.amount, tmpl.currency, period_start,
               tmpl.category, false, tmpl.notes, tmpl.id, NULL);
          END IF;

          check_date := (check_date + INTERVAL '1 week')::DATE;
        END LOOP;

      -- ── Monthly ────────────────────────────────────────────────────────────
      WHEN 'mensual' THEN
        check_date := (date_trunc('month', tmpl.date) + INTERVAL '1 month')::DATE;

        WHILE check_date <= CURRENT_DATE LOOP
          period_start := date_trunc('month', check_date)::DATE;
          period_end   := (period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

          SELECT EXISTS (
            SELECT 1 FROM expenses
            WHERE  generated_from_id = tmpl.id
              AND  date >= period_start
              AND  date <= period_end
          ) INTO already_exists;

          IF NOT already_exists THEN
            INSERT INTO expenses
              (description, amount, currency, date, category, recurrent, notes, generated_from_id, frequency)
            VALUES
              (tmpl.description, tmpl.amount, tmpl.currency, period_start,
               tmpl.category, false, tmpl.notes, tmpl.id, NULL);
          END IF;

          check_date := (check_date + INTERVAL '1 month')::DATE;
        END LOOP;

      -- ── Annual ─────────────────────────────────────────────────────────────
      WHEN 'anual' THEN
        check_date := (date_trunc('year', tmpl.date) + INTERVAL '1 year')::DATE;

        WHILE check_date <= CURRENT_DATE LOOP
          period_start := date_trunc('year', check_date)::DATE;
          period_end   := (period_start + INTERVAL '1 year' - INTERVAL '1 day')::DATE;

          SELECT EXISTS (
            SELECT 1 FROM expenses
            WHERE  generated_from_id = tmpl.id
              AND  date >= period_start
              AND  date <= period_end
          ) INTO already_exists;

          IF NOT already_exists THEN
            INSERT INTO expenses
              (description, amount, currency, date, category, recurrent, notes, generated_from_id, frequency)
            VALUES
              (tmpl.description, tmpl.amount, tmpl.currency, period_start,
               tmpl.category, false, tmpl.notes, tmpl.id, NULL);
          END IF;

          check_date := (check_date + INTERVAL '1 year')::DATE;
        END LOOP;

    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron: schedule weekly generation (every Monday at 06:00 UTC)
-- Prerequisites:
--   1. Enable pg_cron extension in Supabase: Database → Extensions → pg_cron
--   2. Then run the SELECT below to register the job
-- ─────────────────────────────────────────────────────────────────────────────
-- Enable extension (run once):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job (run once after enabling the extension):
SELECT cron.schedule(
  'generate-recurring-expenses',   -- job name
  '0 6 * * 1',                     -- every Monday at 06:00 UTC
  'SELECT generate_recurring_expenses();'
);
