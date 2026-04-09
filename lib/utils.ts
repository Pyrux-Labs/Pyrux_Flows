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
 * Formats a date string as dd/MM/yyyy.
 * Always slices the YYYY-MM-DD part and parses as local time to avoid
 * UTC-offset shifting (e.g. timestamptz from Supabase arriving as midnight UTC
 * would otherwise render as the previous day in Argentina UTC-3).
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  return format(d, "dd/MM/yyyy");
}

/** Returns today as YYYY-MM-DD for use in date inputs */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
