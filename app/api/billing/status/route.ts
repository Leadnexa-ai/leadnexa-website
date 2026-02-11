import { NextResponse } from "next/server";
import { getSessionFromCookie } from "../../../../lib/auth-session";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

type BillingRow = {
  status: string;
  current_period_end: string | null;
  agents: number;
  price_id: string | null;
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

export async function GET() {
  const session = getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.session_type !== "app") {
    return NextResponse.json({
      isSubscribed: false,
      status: "pending",
      current_period_end: null,
      agents: null,
      price_id: null
    });
  }

  try {
    const supabase = createServerSupabase();
    const result = await supabase
      .from("client_subscriptions")
      .select("status, current_period_end, agents, price_id, created_at")
      .eq("client_id", session.client_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (result.error) {
      throw new Error(`Failed to load billing status: ${result.error.message}`);
    }

    const rows = (result.data ?? []) as BillingRow[];
    const latest = pickMostRelevantSubscription(rows);
    if (!latest) {
      return NextResponse.json({
        isSubscribed: false,
        status: null,
        current_period_end: null,
        agents: null,
        price_id: null
      });
    }

    return NextResponse.json({
      isSubscribed: ACTIVE_STATUSES.has(latest.status),
      status: latest.status,
      current_period_end: latest.current_period_end,
      agents: latest.agents,
      price_id: latest.price_id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load billing status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
