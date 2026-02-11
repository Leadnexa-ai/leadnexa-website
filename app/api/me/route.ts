import { NextResponse } from "next/server";
import { getSessionFromCookie } from "../../../lib/auth-session";
import { createServerSupabase } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const session = getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabase();

  if (session.session_type === "app") {
    const clientResult = await supabase
      .from("clients")
      .select("name")
      .eq("id", session.client_id)
      .maybeSingle();

    if (clientResult.error) {
      return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
    }

    return NextResponse.json({
      session_type: "app",
      email: session.email,
      user_id: session.user_id,
      client_id: session.client_id,
      role: session.role,
      company_name: clientResult.data?.name ?? null
    });
  }

  const pendingResult = await supabase
    .from("pending_signups")
    .select("company_name")
    .eq("id", session.pending_signup_id)
    .maybeSingle();

  if (pendingResult.error) {
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }

  return NextResponse.json({
    session_type: "pending",
    email: session.email,
    pending_signup_id: session.pending_signup_id,
    company_name: pendingResult.data?.company_name ?? null
  });
}
