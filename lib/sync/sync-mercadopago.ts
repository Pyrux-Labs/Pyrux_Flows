import { createAdminClient } from "@/lib/supabase/admin";
import { getMpAccessToken } from "@/lib/mp/token";

const MP_API = "https://api.mercadopago.com";
const ML_API = "https://api.mercadolibre.com";
const AR_TZ = "America/Argentina/Buenos_Aires";

function toArgentinaDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-CA", { timeZone: AR_TZ });
}

interface MpUser {
  id: number;
}

interface MpPayment {
  id: number;
  date_created: string;
  date_approved: string | null;
  status: string;
  transaction_amount: number;
  currency_id: string;
  description: string | null;
  collector_id: number | null;
  payer: { id?: number; first_name?: string; last_name?: string } | null;
}

interface MpSearchResponse {
  results: MpPayment[];
  paging: { total: number; limit: number; offset: number };
}

interface ReportListItem {
  id: number;
  status: "processed" | "enabled" | string;
  file_name: string;
  date_created: string;
}

interface MpRule {
  counterpart_id: string;
  type: string;
  project_id: string | null;
  category: string | null;
  is_recurring: boolean;
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MP API error ${res.status}: ${path} — ${body}`);
  }
  return res.json() as Promise<T>;
}

function buildRuleMap(rules: MpRule[]): Map<string, MpRule> {
  const map = new Map<string, MpRule>();
  for (const rule of rules) {
    map.set(`${rule.counterpart_id}:${rule.type}`, rule);
  }
  return map;
}

// ── Settlement report (todas las transacciones) ───────────────────────────────

/** Fire-and-forget: triggers a new settlement report for the next sync cycle */
function triggerSettlementReport(begin: Date, end: Date, token: string): void {
  fetch(`${MP_API}/v1/account/settlement_report`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      begin_date: begin.toISOString(),
      end_date: end.toISOString(),
    }),
    cache: "no-store",
  }).catch(() => {});
}

/** Returns the most recently created processed settlement report file name, or null */
async function getLatestSettlementReport(token: string): Promise<string | null> {
  try {
    const list = await apiFetch<ReportListItem[]>("/v1/account/settlement_report/list", token);
    const processed = list
      .filter((r) => r.status === "processed" && r.file_name)
      .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
    return processed[0]?.file_name ?? null;
  } catch {
    return null;
  }
}

async function downloadSettlementCsv(fileName: string, token: string): Promise<string> {
  const res = await fetch(`${MP_API}/v1/account/settlement_report/${fileName}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Settlement CSV download failed: ${res.status}`);
  return res.text();
}

interface CsvMovement {
  mp_id: string;
  type: "credit" | "debit";
  amount: number;
  currency: "ARS" | "USD";
  date: string;
}

/**
 * Parses the settlement report CSV (todas las transacciones).
 * Format: SOURCE_ID;PAYMENT_METHOD_TYPE;TRANSACTION_TYPE;TRANSACTION_AMOUNT;TRANSACTION_DATE;...
 *
 * Filter rules:
 * - Keep PAYOUTS (P2P transfers) regardless of PAYMENT_METHOD_TYPE
 * - Keep SETTLEMENT rows that have a PAYMENT_METHOD_TYPE (real payments)
 * - Skip SETTLEMENT rows with empty PAYMENT_METHOD_TYPE (rendimientos/interest)
 */
function parseSettlementCsv(csv: string): CsvMovement[] {
  const lines = csv.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(";").map((h) => h.trim());
  const iSource = headers.indexOf("SOURCE_ID");
  const iPaymentMethod = headers.indexOf("PAYMENT_METHOD_TYPE");
  const iTransactionType = headers.indexOf("TRANSACTION_TYPE");
  const iAmount = headers.indexOf("TRANSACTION_AMOUNT");
  const iDate = headers.indexOf("TRANSACTION_DATE");

  if (iSource === -1 || iAmount === -1 || iDate === -1) return [];

  const movements: CsvMovement[] = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(";");

    const sourceId = (cols[iSource] ?? "").trim();
    const dateStr = (cols[iDate] ?? "").trim();
    const rawAmount = parseFloat(cols[iAmount] ?? "0");
    const paymentMethod = iPaymentMethod !== -1 ? (cols[iPaymentMethod] ?? "").trim() : "";
    const transactionType = iTransactionType !== -1 ? (cols[iTransactionType] ?? "").trim() : "";

    if (!sourceId || !dateStr || rawAmount === 0) continue;

    const isSettlement = transactionType === "SETTLEMENT";
    const isPayout = transactionType === "PAYOUTS";

    // Skip interest/rendimiento: SETTLEMENT rows with no payment method
    if (isSettlement && !paymentMethod) continue;

    // Keep PAYOUTS (P2P transfers) and SETTLEMENT with a payment method
    if (!isSettlement && !isPayout) continue;

    movements.push({
      mp_id: sourceId,
      type: rawAmount > 0 ? "credit" : "debit",
      amount: Math.abs(rawAmount),
      currency: "ARS",
      date: toArgentinaDate(dateStr),
    });
  }

  return movements;
}

// ── Bank report (liquidaciones — for balance) ─────────────────────────────────

/** Fire-and-forget: triggers a new bank report for the next sync cycle */
function triggerBankReport(begin: Date, end: Date, token: string): void {
  fetch(`${MP_API}/v1/account/bank_report`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      begin_date: begin.toISOString(),
      end_date: end.toISOString(),
    }),
    cache: "no-store",
  }).catch(() => {});
}

/** Returns the most recently created bank report file name, or null */
async function getLatestBankReport(token: string): Promise<string | null> {
  try {
    const list = await apiFetch<ReportListItem[]>("/v1/account/bank_report/list", token);
    const available = list
      .filter((r) => r.file_name)
      .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
    return available[0]?.file_name ?? null;
  } catch {
    return null;
  }
}

async function downloadBankCsv(fileName: string, token: string): Promise<string> {
  const res = await fetch(`${MP_API}/v1/account/bank_report/${fileName}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bank CSV download failed: ${res.status}`);
  return res.text();
}

/**
 * Parses the bank report CSV (liquidaciones) and returns the closing balance.
 * Format: DATE;SOURCE_ID;DESCRIPTION;NET_CREDIT_AMOUNT;...;BALANCE_AMOUNT;...
 * The last row with a non-empty DATE holds the most recent BALANCE_AMOUNT.
 */
function parseBankReportBalance(csv: string): number | null {
  const lines = csv.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) return null;

  const headers = lines[0].split(";").map((h) => h.trim());
  const iDate = headers.indexOf("DATE");
  const iBalance = headers.indexOf("BALANCE_AMOUNT");

  if (iDate === -1 || iBalance === -1) return null;

  let lastBalance: number | null = null;

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(";");
    const dateStr = (cols[iDate] ?? "").trim();
    const balanceStr = (cols[iBalance] ?? "").trim();
    if (!dateStr || !balanceStr) continue;
    const balance = parseFloat(balanceStr);
    if (!isNaN(balance)) lastBalance = balance;
  }

  return lastBalance;
}

// ── Main sync ─────────────────────────────────────────────────────────────────

export async function runMercadoPagoSync(): Promise<{ synced: number }> {
  const supabase = createAdminClient();
  const token = await getMpAccessToken();

  // 1. Get own MP user ID
  const me = await fetch(`${ML_API}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).then((r) => r.json() as Promise<MpUser>);
  const myUserId = me.id;

  // 2. Determine sync window
  const { data: lastSyncSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "last_sync_at")
    .single();

  const beginDate = lastSyncSetting?.value
    ? new Date(lastSyncSetting.value)
    : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days on first sync

  const endDate = new Date();

  const dateParams =
    `&range=date_created` +
    `&begin_date=${beginDate.toISOString()}` +
    `&end_date=${endDate.toISOString()}` +
    `&limit=300`;

  // 3. In parallel: payments/search + latest settlement report + latest bank report
  const [inbound, outbound, settlementFileName, bankFileName] = await Promise.all([
    apiFetch<MpSearchResponse>(
      `/v1/payments/search?sort=date_created&criteria=desc${dateParams}`,
      token,
    ),
    apiFetch<MpSearchResponse>(
      `/v1/payments/search?payer.id=${myUserId}&sort=date_created&criteria=desc${dateParams}`,
      token,
    ),
    getLatestSettlementReport(token),
    getLatestBankReport(token),
  ]);

  // 4. Load mp_rules
  const { data: rules } = await supabase.from("mp_rules").select("*");
  const ruleMap = buildRuleMap((rules ?? []) as MpRule[]);

  // 5. Build movements from payments/search (with descriptions — take priority)
  const creditMovements = inbound.results
    .filter(
      (p) =>
        p.status === "approved" &&
        p.collector_id === myUserId &&
        p.payer?.id != null,
    )
    .map((p) => {
      const counterpartId = String(p.payer!.id);
      const counterpartName =
        [p.payer!.first_name, p.payer!.last_name].filter(Boolean).join(" ") || null;
      const rule = ruleMap.get(`${counterpartId}:credit`);
      return {
        mp_id: String(p.id),
        type: "credit" as const,
        amount: p.transaction_amount,
        currency: (p.currency_id === "ARS" ? "ARS" : "USD") as "ARS" | "USD",
        description: p.description ?? null,
        date: toArgentinaDate(p.date_approved ?? p.date_created),
        counterpart_id: counterpartId,
        counterpart_name: counterpartName,
        project_id: rule?.project_id ?? null,
        category: rule?.category ?? null,
        is_recurring: rule?.is_recurring ?? false,
      };
    });

  const purchaseMovements = outbound.results
    .filter((p) => p.status === "approved" && p.transaction_amount > 0)
    .map((p) => {
      const counterpartId = p.collector_id != null ? String(p.collector_id) : null;
      const rule = counterpartId ? ruleMap.get(`${counterpartId}:debit`) : undefined;
      return {
        mp_id: String(p.id),
        type: "debit" as const,
        amount: p.transaction_amount,
        currency: (p.currency_id === "ARS" ? "ARS" : "USD") as "ARS" | "USD",
        description: p.description ?? null,
        date: toArgentinaDate(p.date_approved ?? p.date_created),
        counterpart_id: counterpartId,
        counterpart_name: null,
        project_id: rule?.project_id ?? null,
        category: rule?.category ?? null,
        is_recurring: false,
      };
    });

  // 6. Upsert payments/search movements first
  const paymentsMovements = [...creditMovements, ...purchaseMovements];
  if (paymentsMovements.length > 0) {
    const { error } = await supabase
      .from("movements")
      .upsert(paymentsMovements, { onConflict: "mp_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  // 7. Process settlement report (adds PAYOUTS not captured by payments/search)
  let settlementCount = 0;
  if (settlementFileName) {
    const csv = await downloadSettlementCsv(settlementFileName, token);
    const csvMovements = parseSettlementCsv(csv);

    const knownMpIds = new Set(paymentsMovements.map((m) => m.mp_id));
    const settlementMovements = csvMovements
      .filter((m) => !knownMpIds.has(m.mp_id))
      .map((m) => ({
        mp_id: m.mp_id,
        type: m.type,
        amount: m.amount,
        currency: m.currency,
        description: null,
        date: m.date,
        counterpart_id: null,
        counterpart_name: null,
        project_id: null,
        category: null,
        is_recurring: false,
      }));

    if (settlementMovements.length > 0) {
      const { error } = await supabase
        .from("movements")
        .upsert(settlementMovements, { onConflict: "mp_id", ignoreDuplicates: true });
      if (error) throw error;
      settlementCount = settlementMovements.length;
    }
  }

  // 8. Get closing balance from bank report and save to settings
  if (bankFileName) {
    const bankCsv = await downloadBankCsv(bankFileName, token);
    const balance = parseBankReportBalance(bankCsv);
    if (balance !== null) {
      await supabase.from("settings").upsert(
        { key: "mp_balance_ars", value: String(balance), updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    }
  }

  // 9. Trigger new reports for next sync (fire and forget)
  triggerSettlementReport(beginDate, endDate, token);
  triggerBankReport(beginDate, endDate, token);

  // 10. Save sync timestamp
  await supabase.from("settings").upsert(
    { key: "last_sync_at", value: endDate.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  return { synced: paymentsMovements.length + settlementCount };
}
