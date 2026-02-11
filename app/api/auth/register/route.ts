import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setSessionCookie, signSessionToken } from "../../../../lib/auth-session";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

type RegisterBody = {
  email?: string;
  password?: string;
  companyName?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RegisterBody;
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const companyName = String(body.companyName ?? "").trim();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const passwordHash = await bcrypt.hash(password, 12);
    const existingAppUser = await supabase
      .from("app_users")
      .select("id")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAppUser.error) {
      throw new Error(`Failed to check existing app user: ${existingAppUser.error.message}`);
    }

    if (existingAppUser.data?.id) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const existingPending = await supabase
      .from("pending_signups")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existingPending.error) {
      throw new Error(`Failed to check pending signup: ${existingPending.error.message}`);
    }

    if (existingPending.data?.status === "activated") {
      return NextResponse.json(
        { error: "Account already activated. Please log in." },
        { status: 409 }
      );
    }

    const pendingUpsert = await supabase
      .from("pending_signups")
      .upsert(
        {
          email,
          password_hash: passwordHash,
          company_name: companyName || null,
          status: "pending",
          client_id: null,
          stripe_checkout_session_id: null,
          activated_at: null
        },
        { onConflict: "email" }
      )
      .select("id, email")
      .single();

    if (pendingUpsert.error || !pendingUpsert.data?.id) {
      throw new Error(
        `Failed to create pending signup: ${pendingUpsert.error?.message ?? "unknown error"}`
      );
    }

    const token = signSessionToken({
      session_type: "pending",
      pending_signup_id: pendingUpsert.data.id,
      email: pendingUpsert.data.email
    });

    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
