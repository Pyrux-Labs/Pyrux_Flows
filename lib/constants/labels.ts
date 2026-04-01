// Centralized label maps for all enum values displayed in the UI.
// Keys match database enum values; values are the Spanish display strings.

export const PROSPECT_STATUS_LABELS: Record<string, string> = {
  contactado: "Contactado",
  en_negociacion: "En negociación",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

export const PROSPECT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
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
  construccion: "Construcción",
  consultoria: "Consultoría",
  dental: "Dental",
  educacion: "Educación",
  estetica: "Estética",
  fitness: "Fitness",
  gastronomia: "Gastronomía",
  inmobiliaria: "Inmobiliaria",
  legal: "Legal",
  logistica: "Logística",
  medico: "Médico",
  moda: "Moda",
  ong: "ONG",
  retail: "Retail",
  tecnologia: "Tecnología",
  turismo: "Turismo",
  otro: "Otro",
};

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  en_desarrollo: "En desarrollo",
  entregado: "Entregado",
  mantenimiento: "Mantenimiento",
  inactivo: "Inactivo",
};

export const CLIENT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  onboarding: {
    label: "Onboarding",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  en_desarrollo: {
    label: "En desarrollo",
    className: "bg-primary/15 text-primary border-primary/20",
  },
  entregado: {
    label: "Entregado",
    className: "bg-green-500/15 text-green-400 border-green-500/20",
  },
  mantenimiento: {
    label: "Mantenimiento",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  },
  inactivo: {
    label: "Inactivo",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  pausado: "Pausado",
  completado: "Completado",
  cancelado: "Cancelado",
  mantenimiento: "Mantenimiento",
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
  mantenimiento: {
    label: "Mantenimiento",
    className: "bg-primary/15 text-primary border-primary/20",
  },
};

// Movement categories — credits (ingresos)
export const MOVEMENT_CREDIT_CATEGORY_LABELS: Record<string, string> = {
  proyecto: "Proyecto",
  mantenimiento: "Mantenimiento",
  consultoria: "Consultoría",
  otro: "Otro",
};

// Movement categories — debits (egresos)
export const MOVEMENT_DEBIT_CATEGORY_LABELS: Record<string, string> = {
  herramientas: "Herramientas",
  hosting: "Hosting",
  marketing: "Marketing",
  servicios: "Servicios",
  impuestos: "Impuestos",
  otro: "Otro",
};

// Aliases for backwards compat with summary components
export const INCOME_CATEGORY_LABELS = MOVEMENT_CREDIT_CATEGORY_LABELS;
export const EXPENSE_CATEGORY_LABELS = MOVEMENT_DEBIT_CATEGORY_LABELS;

export const INCOME_CATEGORY_EXTENDED_LABELS: Record<string, string> = {
  ...MOVEMENT_CREDIT_CATEGORY_LABELS,
  sin_categoria: "Sin categoría",
};

export const EXPENSE_CATEGORY_EXTENDED_LABELS: Record<string, string> = {
  ...MOVEMENT_DEBIT_CATEGORY_LABELS,
  sin_categoria: "Sin categoría",
};

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  automatizacion: "Automatización",
  mantenimiento: "Mantenimiento",
  consultoria: "Consultoría",
};

export const SERVICE_UNIT_LABELS: Record<string, string> = {
  proyecto: "Por proyecto",
  hora: "Por hora",
  mes: "Por mes",
};

export const SERVICE_UNIT_SHORT_LABELS: Record<string, string> = {
  proyecto: "proyecto",
  hora: "hora",
  mes: "mes",
};
