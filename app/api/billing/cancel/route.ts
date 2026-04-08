import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSessionFromCookie } from "../../../../lib/auth-session";
import { updateClientSubscriptionFromStripeSubscription } from "../../../../lib/subscription-records";
import { stripe } from "../../../../lib/stripe";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

type BillingRow = {
  stripe_subscription_id: string | null;
  status: string;
  cancel_at_period_end: boolean;
  created_at: string;
};

const CANCELLABLE_STATUSES = new Set(["active", "trialing"]);

function pickMostRelevantSubscription(rows: BillingRow[]): BillingRow | null {
  if (rows.length === 0) {
    return null;
  }

  const activeFirst = rows.find((row) => CANCELLABLE_STATUSES.has(row.status));
  return activeFirst ?? rows[0];
}

export async function POST() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.session_type !== "app") {
    return NextResponse.json({ error: "Only active app sessions can cancel subscriptions." }, { status: 403 });
  }

  try {
    const supabase = createServerSupabase();
    const result = await supabase
      .from("client_subscriptions")
      .select("stripe_subscription_id, status, cancel_at_period_end, created_at")
      .eq("client_id", session.client_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (result.error) {
      throw new Error(`Failed to load subscription: ${result.error.message}`);
    }

    const rows = (result.data ?? []) as BillingRow[];
    const latest = pickMostRelevantSubscription(rows);
    if (!latest || !latest.stripe_subscription_id) {
      return NextResponse.json({ error: "No subscription found for this account." }, { status: 404 });
    }

    if (!CANCELLABLE_STATUSES.has(latest.status)) {
      return NextResponse.json(
        { error: `Subscription is not cancellable in current status (${latest.status}).` },
        { status: 409 }
      );
    }

    if (latest.cancel_at_period_end) {
      return NextResponse.json({
        ok: true,
        alreadyScheduled: true,
        status: latest.status,
        cancel_at_period_end: true
      });
    }

    const updatedSubscription = (await stripe.subscriptions.update(latest.stripe_subscription_id, {
      cancel_at_period_end: true
    })) as Stripe.Subscription;

    await updateClientSubscriptionFromStripeSubscription(updatedSubscription);

    return NextResponse.json({
      ok: true,
      alreadyScheduled: false,
      status: updatedSubscription.status,
      cancel_at_period_end: Boolean(updatedSubscription.cancel_at_period_end)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
