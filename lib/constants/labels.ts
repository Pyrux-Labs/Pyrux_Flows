// Centralized label maps for all enum values displayed in the UI.
// Keys match database enum values; values are the Spanish display strings.

export const PROSPECT_STATUS_LABELS: Record<string, string> = {
  sin_contactar: "Sin contactar",
  contactado: "Contactado",
  en_negociacion: "En negociación",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

export const PROSPECT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  sin_contactar: {
    label: "Sin contactar",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/20",
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

export const SECTOR_VALUES = [
  "contabilidad",
  "construccion",
  "consultoria",
  "dental",
  "educacion",
  "estetica",
  "fitness",
  "gastronomia",
  "inmobiliaria",
  "legal",
  "logistica",
  "medico",
  "moda",
  "ong",
  "retail",
  "tecnologia",
  "turismo",
  "otro",
] as const;

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


export const PROJECT_STATUS_LABELS: Record<string, string> = {
  desarrollo: "Desarrollo",
  pausado: "Pausado",
  completado: "Completado",
  cancelado: "Cancelado",
  mantenimiento: "Mantenimiento",
};

export const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  desarrollo: {
    label: "Desarrollo",
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
