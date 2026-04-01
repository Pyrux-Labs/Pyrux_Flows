import { NextRequest, NextResponse } from "next/server";
import { runMercadoPagoSync } from "@/lib/sync/sync-mercadopago";

async function handler(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMercadoPagoSync();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[sync-mercadopago]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;
