export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProspectStatus =
  | "nuevo"
  | "contactado"
  | "en_negociacion"
  | "cerrado"
  | "perdido";

export type ProspectSector =
  | "contabilidad"
  | "legal"
  | "medico"
  | "estetica"
  | "gastronomia"
  | "fitness"
  | "dental"
  | "otro";

export type ProspectSource =
  | "word_of_mouth"
  | "instagram"
  | "linkedin"
  | "cold_email"
  | "whatsapp"
  | "otro";

export type ProjectStatus = "activo" | "pausado" | "completado" | "cancelado";

export type AssignedTo = "juanma" | "gino" | "ambos";

export type Currency = "ARS" | "USD";

export type IncomeCategory =
  | "proyecto"
  | "mantenimiento"
  | "consultoria"
  | "otro";

export type ExpenseCategory =
  | "herramientas"
  | "hosting"
  | "marketing"
  | "servicios"
  | "impuestos"
  | "otro";

export type ExpenseFrequency = "semanal" | "mensual" | "anual";

export type ServiceUnit = "proyecto" | "hora" | "mes";

export type ServiceCategory =
  | "web"
  | "cms"
  | "automatizacion"
  | "mantenimiento"
  | "consultoria";

export interface Prospect {
  id: string;
  created_at: string;
  name: string;
  business: string | null;
  sector: ProspectSector | null;
  email: string | null;
  phone: string | null;
  source: ProspectSource | null;
  status: ProspectStatus;
  notes: string | null;
  assigned_to: "juanma" | "gino" | null;
  last_contact: string | null;
}

export interface Project {
  id: string;
  created_at: string;
  name: string;
  client_name: string;
  prospect_id: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  paid: boolean;
  notes: string | null;
  assigned_to: AssignedTo | null;
}

export interface Income {
  id: string;
  created_at: string;
  project_id: string | null;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  category: IncomeCategory | null;
  invoice_sent: boolean;
  paid: boolean;
}

export interface Expense {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  category: ExpenseCategory | null;
  recurrent: boolean;
  frequency: ExpenseFrequency | null;
  generated_from_id: string | null;
  notes: string | null;
}

export interface Service {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: Currency;
  unit: ServiceUnit | null;
  category: ServiceCategory | null;
  active: boolean;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}
