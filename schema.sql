-- ============================================================
--  SCHEMA v2: Pyrux Flows — CRM + Finanzas
--  Compatible con Supabase (PostgreSQL 15+)
--  Ejecutar en orden — las FK dependen de tablas anteriores.
-- ============================================================


-- ------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ------------------------------------------------------------

CREATE TYPE prospect_status_enum AS ENUM (
  'contactado', 'en_negociacion', 'cerrado', 'perdido'
);

CREATE TYPE sector_enum AS ENUM (
  'contabilidad',
  'construccion',
  'consultoria',
  'dental',
  'educacion',
  'estetica',
  'fitness',
  'gastronomia',
  'inmobiliaria',
  'legal',
  'logistica',
  'medico',
  'moda',
  'ong',
  'retail',
  'tecnologia',
  'turismo',
  'otro'
);

CREATE TYPE client_status_enum AS ENUM (
  'onboarding', 'en_desarrollo', 'entregado', 'mantenimiento', 'inactivo'
);

CREATE TYPE project_status_enum AS ENUM (
  'activo', 'pausado', 'completado', 'cancelado', 'mantenimiento'
);

CREATE TYPE currency_enum AS ENUM ('ARS', 'USD');

CREATE TYPE service_category_enum AS ENUM (
  'web', 'automatizacion', 'mantenimiento', 'consultoria'
);

CREATE TYPE service_unit_enum AS ENUM ('proyecto', 'hora', 'mes');

CREATE TYPE payment_status_enum AS ENUM (
  'pendiente', 'pagado'
);

CREATE TYPE movement_type_enum AS ENUM ('credit', 'debit');


-- ------------------------------------------------------------
-- 1. PROSPECTS
-- Contactos en etapa de venta. Al pasar a "cerrado" se crea
-- automáticamente un cliente (ver trigger más abajo).
-- ------------------------------------------------------------

CREATE TABLE prospects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  name        text NOT NULL,
  email       text,
  phone       text,
  sector      sector_enum,
  status      prospect_status_enum NOT NULL DEFAULT 'contactado',
  notes       text
);

COMMENT ON TABLE prospects IS 'Contactos en proceso de venta. Al cerrarse generan un client automáticamente.';
COMMENT ON COLUMN prospects.sector IS 'Rubro del negocio del prospecto.';


-- ------------------------------------------------------------
-- 2. CLIENTS
-- Se genera automáticamente cuando un prospect llega a "cerrado".
-- También se puede crear directo si entró sin pasar por prospects.
-- ------------------------------------------------------------

CREATE TABLE clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  prospect_id uuid REFERENCES prospects (id) ON DELETE SET NULL,

  name        text NOT NULL,
  email       text,
  phone       text,
  sector      sector_enum,
  status      client_status_enum NOT NULL DEFAULT 'onboarding',
  started_at  date NOT NULL DEFAULT CURRENT_DATE,
  notes       text
);

COMMENT ON TABLE clients IS 'Clientes activos o históricos. Se puede crear directo o desde un prospect cerrado.';
COMMENT ON COLUMN clients.prospect_id IS 'Nullable: algunos clientes entran directo sin haber sido prospects.';


-- ------------------------------------------------------------
-- 3. SERVICES
-- Catálogo de referencia. El precio real siempre va en el
-- proyecto o en el contrato de mantenimiento.
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
-- 4. PROJECTS
-- Un cliente puede tener N proyectos a lo largo del tiempo.
-- El precio total del proyecto va acá. Los pagos van en project_payments.
-- Si el proyecto deriva en mantenimiento, los campos maintenance_*
-- se completan cuando el status pasa a 'mantenimiento'.
-- ------------------------------------------------------------

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  client_id   uuid NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  service_id  uuid REFERENCES services (id) ON DELETE SET NULL,

  name        text NOT NULL,
  status      project_status_enum NOT NULL DEFAULT 'activo',
  start_date  date,
  end_date    date,
  price       numeric(12, 2),
  currency    currency_enum NOT NULL DEFAULT 'USD',
  notes       text,

  -- Mantenimiento (se completa solo si el proyecto deriva en mantenimiento)
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
-- 5. PROJECT_PAYMENTS
-- Hitos de pago de un proyecto (anticipo, entrega, etc).
-- No se usa para cuotas de mantenimiento mensual — eso se
-- controla via movements.
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

  -- Link opcional al movimiento de MP que confirmó el pago (FK se agrega abajo)
  movement_id uuid
);

COMMENT ON TABLE project_payments IS 'Hitos de pago por proyecto (anticipo, entrega, etc). Las cuotas de mantenimiento mensual se rastrean via movements.';
COMMENT ON COLUMN project_payments.movement_id IS 'Movimiento de MP que confirmó este pago. Se linkea manualmente.';


-- ------------------------------------------------------------
-- 6. MOVEMENTS
-- Todos los movimientos de la cuenta de Mercado Pago.
-- Credits = ingresos, debits = egresos.
-- Se sincronizan automáticamente via cron horario.
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

  -- Enriquecimiento manual o por regla
  project_id          uuid REFERENCES projects (id) ON DELETE SET NULL,
  category            text,
  is_recurring        boolean NOT NULL DEFAULT false,
  notes               text,
  exchange_rate       numeric(12, 2),

  -- Metadatos de MP
  counterpart_id      text,
  counterpart_name    text
);

COMMENT ON TABLE movements IS 'Movimientos reales de la cuenta MP. credits = ingresos, debits = egresos. Sincronización horaria vía cron.';
COMMENT ON COLUMN movements.mp_id IS 'ID único de MP. Usado para deduplicar en cada sync.';
COMMENT ON COLUMN movements.counterpart_id IS 'ID del pagador (credit) o destinatario (debit) en MP. Base para mp_rules.';
COMMENT ON COLUMN movements.is_recurring IS 'Si true, se incluye en el forecast del mes siguiente.';


-- FK de project_payments → movements (movements ya existe)
ALTER TABLE project_payments
  ADD CONSTRAINT fk_project_payments_movement
  FOREIGN KEY (movement_id) REFERENCES movements (id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 7. MP_RULES
-- Reglas de auto-asignación: cuando llega un movimiento de
-- cierto counterpart_id, se le asigna automáticamente el
-- proyecto y la categoría definidos en la regla.
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
-- 8. SETTINGS
-- Configuración general de la app.
-- ------------------------------------------------------------

CREATE TABLE settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE settings IS 'Configuración general. opening_balance_ars es el saldo de la cuenta MP al momento de activar la sincronización.';


-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------

CREATE INDEX idx_prospects_status           ON prospects (status);
CREATE INDEX idx_clients_status             ON clients (status);
CREATE INDEX idx_clients_prospect           ON clients (prospect_id);
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
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION prospect_to_client()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cerrado' AND OLD.status <> 'cerrado' THEN
    IF NOT EXISTS (
      SELECT 1 FROM clients WHERE prospect_id = NEW.id
    ) THEN
      INSERT INTO clients (prospect_id, name, email, phone, sector)
      VALUES (NEW.id, NEW.name, NEW.email, NEW.phone, NEW.sector);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prospect_to_client
  AFTER UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION prospect_to_client();


-- ------------------------------------------------------------
-- SEED: configuración inicial
-- Ajustar opening_balance_ars al saldo real antes del primer sync.
-- ------------------------------------------------------------

INSERT INTO settings (key, value, updated_at) VALUES
  ('opening_balance_ars', '36409.85', now()),
  ('opening_balance_date', '2026-04-01', now());
