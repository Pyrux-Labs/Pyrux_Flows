// Centralized label maps for all enum values displayed in the UI.
// Keys match database enum values; values are the Spanish display strings.

export const PROSPECT_STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  en_negociacion: "En negociación",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

// Badge styling config for prospect statuses (label + Tailwind classes)
export const PROSPECT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  nuevo: {
    label: "Nuevo",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  contactado: {
    label: "Contactado",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  },
  en_negociacion: {
    label: "En negociación",
    className: "bg-primary/15 text-primary border-primary/20",
  },
  cerrado: {
    label: "Cerrado",
    className: "bg-green-500/15 text-green-400 border-green-500/20",
  },
  perdido: {
    label: "Perdido",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export const SECTOR_LABELS: Record<string, string> = {
  contabilidad: "Contabilidad",
  legal: "Legal",
  medico: "Médico",
  estetica: "Estética",
  gastronomia: "Gastronomía",
  fitness: "Fitness",
  dental: "Dental",
  otro: "Otro",
};

export const SOURCE_LABELS: Record<string, string> = {
  word_of_mouth: "Boca a boca",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  cold_email: "Cold email",
  whatsapp: "WhatsApp",
  otro: "Otro",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  pausado: "Pausado",
  completado: "Completado",
  cancelado: "Cancelado",
};

export const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  activo: {
    label: "Activo",
    className: "bg-green-500/15 text-green-400 border-green-500/20",
  },
  pausado: {
    label: "Pausado",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  },
  completado: {
    label: "Completado",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
  },
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  herramientas: "Herramientas",
  hosting: "Hosting",
  marketing: "Marketing",
  servicios: "Servicios",
  impuestos: "Impuestos",
  otro: "Otro",
};

export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  proyecto: "Proyecto",
  mantenimiento: "Mantenimiento",
  consultoria: "Consultoría",
  otro: "Otro",
};

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  cms: "CMS",
  automatizacion: "Automatización",
  mantenimiento: "Mantenimiento",
  consultoria: "Consultoría",
};

export const SERVICE_UNIT_LABELS: Record<string, string> = {
  proyecto: "Por proyecto",
  hora: "Por hora",
  mes: "Por mes",
};

// Compact unit labels used in service cards (e.g. "U$D 500 / hora")
export const SERVICE_UNIT_SHORT_LABELS: Record<string, string> = {
  proyecto: "proyecto",
  hora: "hora",
  mes: "mes",
};

// Extended category labels that include the "no category" fallback key
export const EXPENSE_CATEGORY_EXTENDED_LABELS: Record<string, string> = {
  ...{ herramientas: "Herramientas", hosting: "Hosting", marketing: "Marketing", servicios: "Servicios", impuestos: "Impuestos", otro: "Otro" },
  sin_categoria: "Sin categoría",
};

export const INCOME_CATEGORY_EXTENDED_LABELS: Record<string, string> = {
  ...{ proyecto: "Proyecto", mantenimiento: "Mantenimiento", consultoria: "Consultoría", otro: "Otro" },
  sin_categoria: "Sin categoría",
};

export const EXPENSE_FREQUENCY_LABELS: Record<string, string> = {
  semanal: "Semanal",
  mensual: "Mensual",
  anual: "Anual",
};
