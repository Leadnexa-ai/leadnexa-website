import { NextResponse } from "next/server";
import {
  type AppSessionClaims,
  getInternalAdminSessionFromCookie,
  getSessionFromCookie,
  setSessionCookie,
  signSessionToken
} from "../../../lib/auth-session";
import { getInternalAdminById } from "../../../lib/internal-admin";
import { createServerSupabase } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

async function promotePendingSessionIfActivated(input: {
  session: ReturnType<typeof getSessionFromCookie>;
  supabase: ReturnType<typeof createServerSupabase>;
}): Promise<AppSessionClaims | null> {
  const { session, supabase } = input;
  if (!session || session.session_type !== "pending") {
    return null;
  }

  const pendingResult = await supabase
    .from("pending_signups")
    .select("email, status, client_id")
    .eq("id", session.pending_signup_id)
    .maybeSingle();

  if (pendingResult.error || !pendingResult.data) {
    return null;
  }

  if (pendingResult.data.status !== "activated" || !pendingResult.data.client_id) {
    return null;
  }

  const appUser = await supabase
    .from("app_users")
    .select("id, client_id, email, role, is_active, created_at")
    .eq("client_id", pendingResult.data.client_id)
    .ilike("email", String(pendingResult.data.email ?? session.email))
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (appUser.error || !appUser.data?.id) {
    return null;
  }

  return {
    session_type: "app",
    email: appUser.data.email,
    user_id: appUser.data.id,
    client_id: appUser.data.client_id,
    role: appUser.data.role
  };
}

export async function GET() {
  let session = getInternalAdminSessionFromCookie() ?? getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const promotedSession = await promotePendingSessionIfActivated({ session, supabase });
  if (promotedSession) {
    session = promotedSession;
  }

  if (session.session_type === "internal_admin") {
    const internalAdmin = await getInternalAdminById({
      supabase,
      internalAdminUserId: session.internal_admin_user_id
    });

    if (!internalAdmin?.id || !internalAdmin.is_active) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({
      session_type: "internal_admin",
      email: internalAdmin.email,
      company_name: internalAdmin.full_name ?? "LeadNexa Support",
      account_name: internalAdmin.full_name ?? "LeadNexa Support",
      role: session.role
    });
  }

  if (session.session_type === "app") {
    const clientResult = await supabase
      .from("clients")
      .select("name")
      .eq("id", session.client_id)
      .maybeSingle();

    if (clientResult.error) {
      return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
    }

    const response = NextResponse.json({
      session_type: "app",
      email: session.email,
      user_id: session.user_id,
      client_id: session.client_id,
      role: session.role,
      company_name: clientResult.data?.name ?? null,
      account_name: clientResult.data?.name ?? null
    });

    if (promotedSession) {
      setSessionCookie(response, signSessionToken(promotedSession));
    }

    return response;
  }

  const pendingResult = await supabase
    .from("pending_signups")
    .select("company_name, email_verified_at")
    .eq("id", session.pending_signup_id)
    .maybeSingle();

  if (pendingResult.error) {
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }

  return NextResponse.json({
    session_type: "pending",
    email: session.email,
    pending_signup_id: session.pending_signup_id,
    company_name: pendingResult.data?.company_name ?? null,
    account_name: pendingResult.data?.company_name ?? null,
    email_verified: Boolean(pendingResult.data?.email_verified_at)
  });
}
