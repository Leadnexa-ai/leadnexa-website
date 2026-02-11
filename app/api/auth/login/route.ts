import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setSessionCookie, signSessionToken } from "../../../../lib/auth-session";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginBody;
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const supabase = createServerSupabase();
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
        .select("id, email, password_hash, status, created_at")
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
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
