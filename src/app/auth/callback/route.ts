import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const origin = url.origin;

  console.log("[OAuth Callback] code:", code, "origin:", origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("[OAuth Callback] exchangeCodeForSession error:", error);

    if (!error) {
      console.log("[OAuth Callback] Redirecting to:", `${origin}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  console.log("[OAuth Callback] Failed, redirecting to login");
  return NextResponse.redirect(`${origin}/auth/login?error=OAuthCallbackError`);
} 

