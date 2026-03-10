import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  clearInternalAdminSessionCookie,
  setInternalAdminSessionCookie,
  setSessionCookie,
  signSessionToken
} from "../../../../lib/auth-session";
import { sanitizeRedirectTarget } from "../../../../lib/auth-redirect";
import { authenticateInternalAdmin } from "../../../../lib/internal-admin";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
  next?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getDefaultPortalTarget(): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").trim().replace(/\/$/, "");
  return `${appUrl}/portal`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginBody;
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const nextTarget = sanitizeRedirectTarget(
      String(body.next ?? getDefaultPortalTarget()),
      new URL(request.url).origin
    );

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const internalAdmin = await authenticateInternalAdmin({ supabase, email, password });
    if (internalAdmin?.id) {
      const token = signSessionToken({
        session_type: "internal_admin",
        email: internalAdmin.email,
        internal_admin_user_id: internalAdmin.id,
        role: "support_admin"
      });
      const redirectTo = `/support/portal?next=${encodeURIComponent(nextTarget)}`;
      const response = NextResponse.json({ ok: true, redirect_to: redirectTo });
      setSessionCookie(response, token);
      setInternalAdminSessionCookie(response, token);
      return response;
    }

    const userLookup = await supabase
      .from("app_users")
      .select("id, client_id, email, password_hash, role, is_active, created_at")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (userLookup.error) {
      throw new Error(`Failed to lookup user: ${userLookup.error.message}`);
    }

    const user = userLookup.data;
    let token: string | null = null;

    if (user?.id && user.is_active) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (isMatch) {
        token = signSessionToken({
          session_type: "app",
          email: user.email,
          user_id: user.id,
          client_id: user.client_id,
          role: user.role
        });
      }
    }

    if (!token) {
      const pendingLookup = await supabase
        .from("pending_signups")
        .select("id, email, password_hash, status, email_verified_at, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingLookup.error) {
        throw new Error(`Failed to lookup pending signup: ${pendingLookup.error.message}`);
      }

      const pending = pendingLookup.data;
      if (!pending?.id || pending.status !== "pending") {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }

      if (!pending.email_verified_at) {
        return NextResponse.json(
          { error: "Please verify your email before logging in." },
          { status: 403 }
        );
      }

      const pendingMatch = await bcrypt.compare(password, pending.password_hash);
      if (!pendingMatch) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }

      token = signSessionToken({
        session_type: "pending",
        email: pending.email,
        pending_signup_id: pending.id
      });
    }

    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    clearInternalAdminSessionCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
