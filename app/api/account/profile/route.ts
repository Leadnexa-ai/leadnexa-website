import { NextResponse } from "next/server";
import {
  type AppSessionClaims,
  getInternalAdminSessionFromCookie,
  getSessionFromCookie,
  setSessionCookie,
  signSessionToken,
  verifySessionToken
} from "../../../../lib/auth-session";
import { getInternalAdminById } from "../../../../lib/internal-admin";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

type ProfilePayload = {
  accountName?: string;
};

type BillingRow = {
  status: string;
  current_period_end: string | null;
  agents: number | null;
  price_id: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function pickMostRelevantSubscription(rows: BillingRow[]): BillingRow | null {
  if (rows.length === 0) {
    return null;
  }
  const activeFirst = rows.find((row) => ACTIVE_STATUSES.has(row.status));
  return activeFirst ?? rows[0];
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value?.trim()) {
    return null;
  }
  return value.trim();
}

function getSessionFromRequest(request: Request) {
  const bearer = extractBearerToken(request);
  if (bearer) {
    return verifySessionToken(bearer);
  }
  return getInternalAdminSessionFromCookie() ?? getSessionFromCookie();
}

async function promotePendingSessionIfActivated(input: {
  session: ReturnType<typeof getSessionFromRequest>;
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

function sanitizeAccountName(value: unknown): string {
  const accountName = String(value ?? "").trim();
  if (accountName.length < 2) {
    throw new Error("Account name must be at least 2 characters.");
  }
  if (accountName.length > 80) {
    throw new Error("Account name must be at most 80 characters.");
  }
  return accountName;
}

export async function GET(request: Request) {
  let session = getSessionFromRequest(request);
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
      account_name: internalAdmin.full_name ?? "LeadNexa Support",
      subscription: {
        is_subscribed: false,
        status: null,
        agents: null,
        price_id: null,
        current_period_end: null,
        cancel_at_period_end: false
      }
    });
  }

  if (session.session_type === "app") {
    const profileResult = await supabase
      .from("clients")
      .select("name")
      .eq("id", session.client_id)
      .maybeSingle();

    if (profileResult.error) {
      return NextResponse.json({ error: "Failed to load account profile." }, { status: 500 });
    }

    const billingResult = await supabase
      .from("client_subscriptions")
      .select("status, current_period_end, agents, price_id, cancel_at_period_end, created_at")
      .eq("client_id", session.client_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (billingResult.error) {
      return NextResponse.json({ error: "Failed to load subscription details." }, { status: 500 });
    }

    const billingRows = (billingResult.data ?? []) as BillingRow[];
    const latest = pickMostRelevantSubscription(billingRows);

    const response = NextResponse.json({
      session_type: "app",
      email: session.email,
      account_name: profileResult.data?.name ?? null,
      subscription: latest
        ? {
            is_subscribed: ACTIVE_STATUSES.has(latest.status),
            status: latest.status,
            agents: latest.agents,
            price_id: latest.price_id,
            current_period_end: latest.current_period_end,
            cancel_at_period_end: Boolean(latest.cancel_at_period_end)
          }
        : {
            is_subscribed: false,
            status: null,
            agents: null,
            price_id: null,
            current_period_end: null,
            cancel_at_period_end: false
          }
    });

    if (promotedSession) {
      setSessionCookie(response, signSessionToken(promotedSession));
    }

    return response;
  }

  const result = await supabase
    .from("pending_signups")
    .select("company_name")
    .eq("id", session.pending_signup_id)
    .maybeSingle();

  if (result.error) {
    return NextResponse.json({ error: "Failed to load account profile." }, { status: 500 });
  }

  return NextResponse.json({
    session_type: "pending",
    email: session.email,
    account_name: result.data?.company_name ?? null,
    subscription: {
      is_subscribed: false,
      status: "pending",
      agents: null,
      price_id: null,
      current_period_end: null
    }
  });
}

export async function PATCH(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.session_type === "internal_admin") {
    return NextResponse.json(
      { error: "Internal admin profiles are managed separately." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ProfilePayload;
    const accountName = sanitizeAccountName(body.accountName);
    const supabase = createServerSupabase();

    if (session.session_type === "app") {
      const result = await supabase
        .from("clients")
        .update({ name: accountName, updated_at: new Date().toISOString() })
        .eq("id", session.client_id)
        .select("name")
        .maybeSingle();

      if (result.error) {
        throw new Error(`Failed to update account name: ${result.error.message}`);
      }

      return NextResponse.json({ ok: true, account_name: result.data?.name ?? accountName });
    }

    const result = await supabase
      .from("pending_signups")
      .update({ company_name: accountName, updated_at: new Date().toISOString() })
      .eq("id", session.pending_signup_id)
      .select("company_name")
      .maybeSingle();

    if (result.error) {
      throw new Error(`Failed to update account name: ${result.error.message}`);
    }

    return NextResponse.json({ ok: true, account_name: result.data?.company_name ?? accountName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update account profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
