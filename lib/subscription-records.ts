import type Stripe from "stripe";
import { createServerSupabase } from "./supabase-admin";

type ClientSubscriptionInsert = {
  client_id: string;
  client_email: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_checkout_session_id: string;
  price_id: string;
  unit_price_cents: number | null;
  agents: number;
  currency: string;
  billing_cycle_anchor: string;
  current_period_start: string;
  current_period_end: string;
  status: string;
  cancel_at_period_end: boolean;
};

type ClientSubscriptionUpdate = {
  current_period_start: string;
  current_period_end: string;
  status: string;
  cancel_at_period_end: boolean;
};

function getSupabaseAdmin() {
  return createServerSupabase();
}

function toIsoFromUnixSeconds(value: number): string {
  return new Date(value * 1000).toISOString();
}

function getPrimaryItem(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  if (!item || !item.price?.id) {
    throw new Error("Subscription item/price is missing.");
  }
  return item;
}

export async function insertClientSubscriptionFromCheckout(input: {
  checkoutSessionId: string;
  explicitClientId?: string;
  customerName?: string;
  customerEmail?: string;
  stripeCustomerId: string;
  stripeSubscription: Stripe.Subscription;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Idempotency guard: if checkout session already persisted, do nothing.
  const existing = await supabase
    .from("client_subscriptions")
    .select("id")
    .eq("stripe_checkout_session_id", input.checkoutSessionId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to check existing subscription row: ${existing.error.message}`);
  }

  if (existing.data) {
    return;
  }

  const clientId = await resolveClientId({
    supabase,
    explicitClientId: input.explicitClientId,
    stripeCustomerId: input.stripeCustomerId,
    customerName: input.customerName,
    customerEmail: input.customerEmail
  });

  const primaryItem = getPrimaryItem(input.stripeSubscription);
  const effectiveBillingAnchor =
    input.stripeSubscription.trial_end ?? input.stripeSubscription.billing_cycle_anchor;
  const payload: ClientSubscriptionInsert = {
    client_id: clientId,
    client_email: input.customerEmail?.trim() || null,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscription.id,
    stripe_checkout_session_id: input.checkoutSessionId,
    price_id: primaryItem.price.id,
    unit_price_cents: primaryItem.price.unit_amount ?? null,
    agents: primaryItem.quantity ?? 1,
    currency: primaryItem.price.currency ?? "usd",
    // In this flow, trial_end is used as the first renewal anchor (Day 45).
    billing_cycle_anchor: toIsoFromUnixSeconds(effectiveBillingAnchor),
    current_period_start: toIsoFromUnixSeconds(primaryItem.current_period_start),
    current_period_end: toIsoFromUnixSeconds(primaryItem.current_period_end),
    status: input.stripeSubscription.status,
    cancel_at_period_end: Boolean(input.stripeSubscription.cancel_at_period_end)
  };

  const insertResult = await supabase.from("client_subscriptions").insert(payload);

  if (!insertResult.error) {
    return;
  }

  // Safe retry: concurrent duplicate webhook may hit unique constraint after pre-check.
  const isUniqueViolation = insertResult.error.code === "23505";
  if (isUniqueViolation) {
    return;
  }

  throw new Error(`Failed to insert client_subscriptions row: ${insertResult.error.message}`);
}

export async function updateClientSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const primaryItem = getPrimaryItem(subscription);

  const payload: ClientSubscriptionUpdate = {
    current_period_start: toIsoFromUnixSeconds(primaryItem.current_period_start),
    current_period_end: toIsoFromUnixSeconds(primaryItem.current_period_end),
    status: subscription.status,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end)
  };

  const updateResult = await supabase
    .from("client_subscriptions")
    .update(payload)
    .eq("stripe_subscription_id", subscription.id);

  if (updateResult.error) {
    throw new Error(`Failed to update client_subscriptions row: ${updateResult.error.message}`);
  }
}

async function resolveClientId(input: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  explicitClientId?: string;
  stripeCustomerId: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<string> {
  const explicitClientId = input.explicitClientId?.trim();
  if (explicitClientId) {
    const explicitClient = await input.supabase
      .from("clients")
      .select("id")
      .eq("id", explicitClientId)
      .maybeSingle();

    if (explicitClient.error) {
      throw new Error(`Failed to validate explicit client_id: ${explicitClient.error.message}`);
    }

    if (explicitClient.data?.id) {
      return explicitClient.data.id;
    }
  }

  const existingByCustomer = await input.supabase
    .from("client_subscriptions")
    .select("client_id")
    .eq("stripe_customer_id", input.stripeCustomerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingByCustomer.error) {
    throw new Error(
      `Failed to lookup existing client by stripe_customer_id: ${existingByCustomer.error.message}`
    );
  }

  if (existingByCustomer.data?.client_id) {
    return existingByCustomer.data.client_id;
  }

  const fallbackName =
    input.customerName?.trim() ||
    input.customerEmail?.trim() ||
    `Stripe Customer ${input.stripeCustomerId.slice(-8)}`;
  const createdClient = await input.supabase
    .from("clients")
    .insert({ name: fallbackName, status: "active" })
    .select("id")
    .single();

  if (createdClient.error || !createdClient.data?.id) {
    throw new Error(`Failed to create client row: ${createdClient.error?.message ?? "unknown error"}`);
  }

  return createdClient.data.id;
}
