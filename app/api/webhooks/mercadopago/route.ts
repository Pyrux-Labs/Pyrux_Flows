import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MP_API = "https://api.mercadopago.com";
const ML_API = "https://api.mercadolibre.com";

interface MpPayment {
  id: number;
  status: string;
  transaction_amount: number;
  currency_id: string;
  description: string | null;
  date_approved: string | null;
  date_created: string;
  operation_type: string;
  collector_id: number | null;
  payer: { id?: number; first_name?: string; last_name?: string } | null;
}

interface MpUser {
  id: number;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`MP API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

function validateSignature(req: NextRequest, _body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // skip validation if not configured yet

  const signatureHeader = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const dataId = new URL(req.url).searchParams.get("data.id") ?? "";

  const tsMatch = signatureHeader.match(/ts=([^,]+)/);
  const v1Match = signatureHeader.match(/v1=([^,]+)/);
  if (!tsMatch || !v1Match) return false;

  const ts = tsMatch[1];
  const v1 = v1Match[1];
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export async function POST(req: NextRequest) {
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!validateSignature(req, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { type?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle payment notifications
  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  try {
    const [payment, me] = await Promise.all([
      apiFetch<MpPayment>(`/v1/payments/${payload.data.id}`),
      fetch(`${ML_API}/users/me`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      }).then((r) => r.json() as Promise<MpUser>),
    ]);

    if (payment.status !== "approved") {
      return NextResponse.json({ received: true, skipped: "not approved" });
    }

    const myUserId = me.id;
    const isDebit = payment.payer?.id === myUserId && payment.collector_id !== myUserId;
    const isCredit = payment.collector_id === myUserId && payment.payer?.id != null;

    if (!isDebit && !isCredit) {
      return NextResponse.json({ received: true, skipped: "unrelated payment" });
    }

    const supabase = createAdminClient();

    const { data: rules } = await supabase.from("mp_rules").select("*");
    const ruleMap = new Map((rules ?? []).map((r) => [`${r.counterpart_id}:${r.type}`, r]));

    const type = isCredit ? "credit" : "debit";
    const counterpartId = isCredit
      ? String(payment.payer!.id)
      : payment.collector_id != null ? String(payment.collector_id) : null;
    const counterpartName = isCredit
      ? [payment.payer!.first_name, payment.payer!.last_name].filter(Boolean).join(" ") || null
      : null;
    const rule = counterpartId ? ruleMap.get(`${counterpartId}:${type}`) : undefined;

    const movement = {
      mp_id: String(payment.id),
      type,
      amount: payment.transaction_amount,
      currency: payment.currency_id === "ARS" ? "ARS" : "USD",
      description: payment.description ?? null,
      date: (payment.date_approved ?? payment.date_created).split("T")[0],
      counterpart_id: counterpartId,
      counterpart_name: counterpartName,
      project_id: rule?.project_id ?? null,
      category: rule?.category ?? null,
      is_recurring: rule?.is_recurring ?? false,
    };

    const { error } = await supabase
      .from("movements")
      .upsert(movement, { onConflict: "mp_id", ignoreDuplicates: false });

    if (error) throw error;

    return NextResponse.json({ received: true, type, mp_id: movement.mp_id });
  } catch (err) {
    console.error("[webhook-mp]", err);
    // Return 200 so MP doesn't retry — we'll debug from logs
    return NextResponse.json({ received: true, error: String(err) });
  }
}

// MP pings the URL with GET to verify it's alive before activating the webhook
export function GET() {
  return NextResponse.json({ ok: true });
}
