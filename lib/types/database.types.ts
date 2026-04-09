export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// -------------------------------------------------------------------
// Enums
// -------------------------------------------------------------------

export type ProspectStatus =
  | "sin_contactar"
  | "contactado"
  | "en_negociacion"
  | "cerrado"
  | "perdido";

export type ProjectStatus =
  | "desarrollo"
  | "pausado"
  | "completado"
  | "cancelado"
  | "mantenimiento";

export type Currency = "ARS" | "USD";

export type ServiceCategory =
  | "web"
  | "automatizacion"
  | "mantenimiento"
  | "consultoria";

export type ServiceUnit = "proyecto" | "hora" | "mes";

export type PaymentStatus = "pendiente" | "pagado";

export type MovementType = "credit" | "debit";

export type ContactType =
  | "email"
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "telefono"
  | "linkedin"
  | "otro";

// -------------------------------------------------------------------
// Tables
// -------------------------------------------------------------------

export interface Sector {
  id: string;
  label: string;
}

export interface Prospect {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string | null;
  sector: string | null;
  status: ProspectStatus;
  notes: string | null;
}

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  prospect_id: string | null;
  name: string;
  phone: string | null;
  sector: string | null;
  started_at: string;
  notes: string | null;
}

export interface Contact {
  id: string;
  created_at: string;
  prospect_id: string | null;
  client_id: string | null;
  type: ContactType;
  value: string;
}

export interface Service {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  base_price: number | null;
  currency: Currency;
  unit: ServiceUnit | null;
  category: ServiceCategory | null;
  active: boolean;
}

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  service_id: string | null;
  name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  price: number | null;
  currency: Currency;
  notes: string | null;
  maintenance_amount: number | null;
  maintenance_currency: Currency;
  maintenance_since: string | null;
  maintenance_price_updated_at: string | null;
}

export interface ProjectPayment {
  id: string;
  created_at: string;
  project_id: string;
  description: string;
  amount: number;
  currency: Currency;
  due_date: string | null;
  paid_date: string | null;
  status: PaymentStatus;
  notes: string | null;
  movement_id: string | null;
}

export interface Movement {
  id: string;
  created_at: string;
  mp_id: string;
  type: MovementType;
  amount: number;
  currency: Currency;
  description: string | null;
  date: string;
  project_id: string | null;
  category: string | null;
  is_recurring: boolean;
  notes: string | null;
  exchange_rate: number | null;
  counterpart_id: string | null;
  counterpart_name: string | null;
}

export interface MpRule {
  id: string;
  created_at: string;
  counterpart_id: string;
  counterpart_name: string | null;
  type: MovementType;
  project_id: string | null;
  category: string | null;
  is_recurring: boolean;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// -------------------------------------------------------------------
// Joined / extended types for UI
// -------------------------------------------------------------------

export interface ProjectWithClient extends Project {
  client: Pick<Client, "id" | "name">;
}

export interface MovementWithProject extends Movement {
  project: Pick<Project, "id" | "name"> | null;
}
