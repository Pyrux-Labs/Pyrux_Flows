import { NextResponse } from "next/server";

export function GET() {
  const clientId = process.env.MP_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "MP_CLIENT_ID or NEXT_PUBLIC_APP_URL not configured" },
      { status: 500 },
    );
  }

  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/mercadopago/callback`);
  const scope = encodeURIComponent("read write offline_access");
  const authUrl =
    `https://auth.mercadopago.com.ar/authorization` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&platform_id=mp` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}`;

  return NextResponse.redirect(authUrl);
}
