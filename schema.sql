-- ============================================================
--  SCHEMA v3: Pyrux Flows — CRM + Finanzas
--  Compatible con Supabase (PostgreSQL 15+)
--  Incluye teardown completo — se puede correr desde cero.
--  Orden: 1) este archivo  2) seed.sql
-- ============================================================


-- ------------------------------------------------------------
-- TEARDOWN — limpia todo antes de recrear
-- ------------------------------------------------------------

DROP TABLE IF EXISTS contacts          CASCADE;
DROP TABLE IF EXISTS settings          CASCADE;
DROP TABLE IF EXISTS mp_rules          CASCADE;
DROP TABLE IF EXISTS movements         CASCADE;
DROP TABLE IF EXISTS project_payments  CASCADE;
DROP TABLE IF EXISTS projects          CASCADE;
DROP TABLE IF EXISTS services          CASCADE;
DROP TABLE IF EXISTS clients           CASCADE;
DROP TABLE IF EXISTS prospects         CASCADE;
DROP TABLE IF EXISTS sectors           CASCADE;

DROP FUNCTION IF EXISTS set_updated_at()     CASCADE;
DROP FUNCTION IF EXISTS prospect_to_client() CASCADE;

DROP TYPE IF EXISTS contact_type_enum       CASCADE;
DROP TYPE IF EXISTS movement_type_enum      CASCADE;
DROP TYPE IF EXISTS payment_status_enum     CASCADE;
DROP TYPE IF EXISTS service_unit_enum       CASCADE;
DROP TYPE IF EXISTS service_category_enum   CASCADE;
DROP TYPE IF EXISTS currency_enum           CASCADE;
DROP TYPE IF EXISTS project_status_enum     CASCADE;
DROP TYPE IF EXISTS sector_enum             CASCADE;
DROP TYPE IF EXISTS prospect_status_enum    CASCADE;


-- ------------------------------------------------------------
-- TIPOS ENUMERADOS
-- Solo para valores que llevan comportamiento acoplado en el
-- frontend (colores, orden, lógica). Los rubros van en tabla.
-- ------------------------------------------------------------

CREATE TYPE prospect_status_enum AS ENUM (
  'sin_contactar', 'contactado', 'en_negociacion', 'cerrado', 'perdido'
);

CREATE TYPE project_status_enum AS ENUM (
  'desarrollo', 'pausado', 'completado', 'cancelado', 'mantenimiento'
);

CREATE TYPE currency_enum AS ENUM ('ARS', 'USD');

CREATE TYPE service_category_enum AS ENUM (
  'web', 'automatizacion', 'mantenimiento', 'consultoria'
);

CREATE TYPE service_unit_enum AS ENUM ('proyecto', 'hora', 'mes');

CREATE TYPE payment_status_enum AS ENUM ('pendiente', 'pagado');

CREATE TYPE movement_type_enum AS ENUM ('credit', 'debit');

CREATE TYPE contact_type_enum AS ENUM (
  'email', 'instagram', 'facebook', 'whatsapp', 'telefono', 'linkedin', 'otro'
);


-- ------------------------------------------------------------
-- 1. SECTORS
-- Tabla de referencia para rubros. Se gestiona desde el
-- dashboard de Supabase — agregar una fila es suficiente para
-- que aparezca en todos los dropdowns del frontend.
-- ------------------------------------------------------------

CREATE TABLE sectors (
  id     text PRIMARY KEY,
  label  text NOT NULL
);

COMMENT ON TABLE sectors IS 'Rubros de clientes y prospectos. Se gestiona desde Supabase — no requiere cambios de código.';


-- ------------------------------------------------------------
-- 2. PROSPECTS
-- ------------------------------------------------------------

CREATE TABLE prospects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  name        text NOT NULL,
  phone       text,
  sector      text REFERENCES sectors (id) ON DELETE SET NULL,
  status      prospect_status_enum NOT NULL DEFAULT 'sin_contactar',
  notes       text
);

COMMENT ON TABLE prospects IS 'Contactos en proceso de venta. Al cerrarse generan un client automáticamente.';


-- ------------------------------------------------------------
-- 3. CLIENTS
-- ------------------------------------------------------------

CREATE TABLE clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  prospect_id uuid REFERENCES prospects (id) ON DELETE SET NULL,

  name        text NOT NULL,
  phone       text,
  sector      text REFERENCES sectors (id) ON DELETE SET NULL,
  started_at  date NOT NULL DEFAULT CURRENT_DATE,
  notes       text
);

COMMENT ON TABLE clients IS 'Clientes activos o históricos. Se puede crear directo o desde un prospect cerrado.';
COMMENT ON COLUMN clients.prospect_id IS 'Nullable: algunos clientes entran directo sin haber sido prospects.';


-- ------------------------------------------------------------
-- 4. CONTACTS
-- Reemplaza el campo email. Un prospecto o cliente puede tener
-- N contactos de distintos tipos (email, instagram, etc).
-- Solo uno de prospect_id / client_id puede estar seteado.
-- ------------------------------------------------------------

CREATE TABLE contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),

  prospect_id  uuid REFERENCES prospects (id) ON DELETE CASCADE,
  client_id    uuid REFERENCES clients (id) ON DELETE CASCADE,

  type         contact_type_enum NOT NULL,
  value        text NOT NULL,

  CONSTRAINT contacts_one_parent CHECK (
    (prospect_id IS NOT NULL AND client_id IS NULL) OR
    (prospect_id IS NULL AND client_id IS NOT NULL)
  )
);

COMMENT ON TABLE contacts IS 'Medios de contacto de prospectos y clientes. Reemplaza el campo email — soporta email, instagram, whatsapp, etc.';


-- ------------------------------------------------------------
-- 5. SERVICES
-- ------------------------------------------------------------

CREATE TABLE services (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  name        text NOT NULL,
  description text,
  base_price  numeric(12, 2),
  currency    currency_enum NOT NULL DEFAULT 'USD',
  unit        service_unit_enum,
  category    service_category_enum,
  active      boolean NOT NULL DEFAULT true
);

COMMENT ON TABLE services IS 'Catálogo de servicios. base_price es orientativo; el precio real va en projects o maintenance.';


-- ------------------------------------------------------------
-- 6. PROJECTS
-- ------------------------------------------------------------

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  client_id   uuid NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  service_id  uuid REFERENCES services (id) ON DELETE SET NULL,

  name        text NOT NULL,
  status      project_status_enum NOT NULL DEFAULT 'desarrollo',
  start_date  date,
  end_date    date,
  price       numeric(12, 2),
  currency    currency_enum NOT NULL DEFAULT 'USD',
  notes       text,

  maintenance_amount            numeric(12, 2),
  maintenance_currency          currency_enum NOT NULL DEFAULT 'USD',
  maintenance_since             date,
  maintenance_price_updated_at  date,

  CONSTRAINT projects_dates_check CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT projects_maintenance_check CHECK (
    (maintenance_amount IS NULL) OR (maintenance_since IS NOT NULL)
  )
);

COMMENT ON TABLE projects IS 'Proyectos por cliente. Si deriva en mantenimiento, los campos maintenance_* se completan al cambiar el status.';
COMMENT ON COLUMN projects.maintenance_amount IS 'Precio mensual del mantenimiento. Null si el proyecto no tiene mantenimiento.';
COMMENT ON COLUMN projects.maintenance_since IS 'Fecha desde la que corre el mantenimiento. Obligatoria si maintenance_amount no es null.';
COMMENT ON COLUMN projects.maintenance_price_updated_at IS 'Fecha del último ajuste de precio de mantenimiento.';


-- ------------------------------------------------------------
-- 7. PROJECT_PAYMENTS
-- ------------------------------------------------------------

CREATE TABLE project_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),

  project_id  uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,

  description text NOT NULL,
  amount      numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency    currency_enum NOT NULL DEFAULT 'USD',
  due_date    date,
  paid_date   date,
  status      payment_status_enum NOT NULL DEFAULT 'pendiente',
  notes       text,

  movement_id uuid
);

COMMENT ON TABLE project_payments IS 'Hitos de pago por proyecto (anticipo, entrega, etc). Las cuotas de mantenimiento mensual se rastrean via movements.';
COMMENT ON COLUMN project_payments.movement_id IS 'Movimiento de MP que confirmó este pago. Se linkea manualmente.';


-- ------------------------------------------------------------
-- 8. MOVEMENTS
-- ------------------------------------------------------------

CREATE TABLE movements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),

  mp_id               text UNIQUE NOT NULL,
  type                movement_type_enum NOT NULL,
  amount              numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency            currency_enum NOT NULL DEFAULT 'ARS',
  description         text,
  date                timestamptz NOT NULL,

  project_id          uuid REFERENCES projects (id) ON DELETE SET NULL,
  category            text,
  is_recurring        boolean NOT NULL DEFAULT false,
  notes               text,
  exchange_rate       numeric(12, 2),

  counterpart_id      text,
  counterpart_name    text
);

COMMENT ON TABLE movements IS 'Movimientos reales de la cuenta MP. credits = ingresos, debits = egresos. Sincronización horaria vía cron.';
COMMENT ON COLUMN movements.mp_id IS 'ID único de MP. Usado para deduplicar en cada sync.';
COMMENT ON COLUMN movements.counterpart_id IS 'ID del pagador (credit) o destinatario (debit) en MP. Base para mp_rules.';
COMMENT ON COLUMN movements.is_recurring IS 'Si true, se incluye en el forecast del mes siguiente.';

ALTER TABLE project_payments
  ADD CONSTRAINT fk_project_payments_movement
  FOREIGN KEY (movement_id) REFERENCES movements (id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 9. MP_RULES
-- ------------------------------------------------------------

CREATE TABLE mp_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),

  counterpart_id   text NOT NULL,
  counterpart_name text,
  type             movement_type_enum NOT NULL,
  project_id       uuid REFERENCES projects (id) ON DELETE SET NULL,
  category         text,
  is_recurring     boolean NOT NULL DEFAULT false,

  UNIQUE (counterpart_id, type)
);

COMMENT ON TABLE mp_rules IS 'Reglas de auto-asignación para movimientos MP. Primera vez se linkea a mano; después se aplica solo.';
COMMENT ON COLUMN mp_rules.counterpart_id IS 'ID del payer (credit) o collector (debit) en MP.';


-- ------------------------------------------------------------
-- 10. SETTINGS
-- ------------------------------------------------------------

CREATE TABLE settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE settings IS 'Configuración general. opening_balance_ars es el saldo de la cuenta MP al momento de activar la sincronización.';


-- ------------------------------------------------------------
-- RLS — solo usuarios autenticados de Supabase Auth tienen acceso.
-- El sync de MP usa createAdminClient (service role) y lo bypasea.
-- ------------------------------------------------------------

ALTER TABLE sectors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_rules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_access" ON sectors          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON prospects        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON clients          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON contacts         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON services         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON projects         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON project_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON movements        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON mp_rules         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON settings         FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------

CREATE INDEX idx_prospects_status           ON prospects (status);
CREATE INDEX idx_prospects_sector           ON prospects (sector);
CREATE INDEX idx_clients_prospect           ON clients (prospect_id);
CREATE INDEX idx_clients_sector             ON clients (sector);
CREATE INDEX idx_contacts_prospect          ON contacts (prospect_id);
CREATE INDEX idx_contacts_client            ON contacts (client_id);
CREATE INDEX idx_projects_client            ON projects (client_id);
CREATE INDEX idx_projects_status            ON projects (status);
CREATE INDEX idx_project_payments_project   ON project_payments (project_id);
CREATE INDEX idx_project_payments_status    ON project_payments (status);
CREATE INDEX idx_movements_date             ON movements (date);
CREATE INDEX idx_movements_type             ON movements (type);
CREATE INDEX idx_movements_project          ON movements (project_id);
CREATE INDEX idx_movements_counterpart      ON movements (counterpart_id);
CREATE INDEX idx_movements_recurring        ON movements (is_recurring) WHERE is_recurring = true;
CREATE INDEX idx_mp_rules_counterpart       ON mp_rules (counterpart_id, type);


-- ------------------------------------------------------------
-- TRIGGER: updated_at automático
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- TRIGGER: prospect cerrado → crear client automáticamente
-- Al crear el cliente, migra los contactos del prospect.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION prospect_to_client()
RETURNS TRIGGER AS $$
DECLARE
  new_client_id uuid;
BEGIN
  IF NEW.status = 'cerrado' AND OLD.status <> 'cerrado' THEN
    IF NOT EXISTS (
      SELECT 1 FROM clients WHERE prospect_id = NEW.id
    ) THEN
      INSERT INTO clients (prospect_id, name, phone, sector)
      VALUES (NEW.id, NEW.name, NEW.phone, NEW.sector)
      RETURNING id INTO new_client_id;

      -- Migrar contactos del prospect al nuevo cliente
      UPDATE contacts
      SET client_id = new_client_id, prospect_id = NULL
      WHERE prospect_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prospect_to_client
  AFTER UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION prospect_to_client();
