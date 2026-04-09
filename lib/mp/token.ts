import { createAdminClient } from "@/lib/supabase/admin";

const MP_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

/** Returns the current MP access token: DB-stored (OAuth) → env var fallback */
export async function getMpAccessToken(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "mp_access_token")
      .single();
    if (data?.value) return data.value;
  } catch {
    // fall through to env var
  }
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("No MP access token configured");
  return token;
}

/** Exchanges a refresh token for a new access + refresh token pair and saves to DB */
export async function refreshMpToken(): Promise<string> {
  const supabase = createAdminClient();
  const { data: refreshRow } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "mp_refresh_token")
    .single();

  if (!refreshRow?.value) throw new Error("No refresh token stored — re-authorize via /api/auth/mercadopago");

  const res = await fetch(MP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshRow.value,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Token refresh failed ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { access_token: string; refresh_token: string };

  await supabase.from("settings").upsert(
    [
      { key: "mp_access_token", value: json.access_token, updated_at: new Date().toISOString() },
      { key: "mp_refresh_token", value: json.refresh_token, updated_at: new Date().toISOString() },
    ],
    { onConflict: "key" },
  );

  return json.access_token;
}

/** Exchanges an authorization code for access + refresh tokens and saves to DB */
export async function exchangeMpCode(code: string): Promise<string> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadopago/callback`;

  const res = await fetch(MP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Code exchange failed ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { access_token: string; refresh_token: string };

  const supabase = createAdminClient();
  await supabase.from("settings").upsert(
    [
      { key: "mp_access_token", value: json.access_token, updated_at: new Date().toISOString() },
      { key: "mp_refresh_token", value: json.refresh_token, updated_at: new Date().toISOString() },
    ],
    { onConflict: "key" },
  );

  return json.access_token;
}
