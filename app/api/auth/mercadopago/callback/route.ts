import { NextRequest, NextResponse } from "next/server";
import { exchangeMpCode } from "@/lib/mp/token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?mp_auth=error`,
    );
  }

  try {
    await exchangeMpCode(code);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?mp_auth=success`,
    );
  } catch (err) {
    console.error("[mp-oauth-callback]", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?mp_auth=error`,
    );
  }
}
