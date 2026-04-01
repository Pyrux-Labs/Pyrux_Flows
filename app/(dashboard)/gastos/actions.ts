"use server";

// Gastos shares the same actions as finanzas — both operate on the movements table.
export { enrichMovement, syncMovements } from "@/app/(dashboard)/finanzas/actions";
export type { EnrichPayload } from "@/app/(dashboard)/finanzas/actions";
