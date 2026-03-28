import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Formats a numeric amount with the correct Pyrux currency symbol */
export function formatCurrency(amount: number, currency: "ARS" | "USD"): string {
  const symbol = currency === "USD" ? "U$D" : "$";
  return `${symbol} ${amount.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a date-only string (YYYY-MM-DD) as dd/MM/yyyy.
 * Appends T00:00:00 to avoid UTC-offset shifting the date.
 */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr + "T00:00:00"), "dd/MM/yyyy");
}

/** Returns today as YYYY-MM-DD for use in date inputs */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
