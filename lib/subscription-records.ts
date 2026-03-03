import type Stripe from "stripe";
import { createServerSupabase } from "./supabase-admin";

type PlanCode = "linkedin_scale" | "multichannel_scale";

type ClientSubscriptionInsert = {
  client_id: string;
  client_email: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_checkout_session_id: string;
  plan_code: PlanCode | null;
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
  plan_code: PlanCode | null;
  agents: number;
};

function getSupabaseAdmin() {
  return createServerSupabase();
}

function toIsoFromUnixSeconds(value: number): string {
  return new Date(value * 1000).toISOString();
}

function parseMetadataAgents(value: string | undefined): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

function parsePlanCode(value: string | undefined): PlanCode | null {
  if (value === "linkedin_scale" || value === "multichannel_scale") {
    return value;
  }
  return null;
}

function resolvePlanCodeFromItems(subscription: Stripe.Subscription): PlanCode | null {
  const linkedinPriceIds = new Set(
    [
      process.env.PRICE_ID_LINKEDIN_BASE_2?.trim(),
      process.env.PRICE_ID_LINKEDIN_ADDL_AGENT?.trim()
    ].filter((value): value is string => Boolean(value))
  );
  const multichannelPriceIds = new Set(
    [
      process.env.PRICE_ID_MULTICHANNEL_BASE_2?.trim(),
      process.env.PRICE_ID_MULTICHANNEL_ADDL_AGENT?.trim()
    ].filter((value): value is string => Boolean(value))
  );

  for (const item of subscription.items.data) {
    const priceId = item.price?.id?.trim();
    if (!priceId) {
      continue;
    }
    if (linkedinPriceIds.has(priceId)) {
      return "linkedin_scale";
    }
    if (multichannelPriceIds.has(priceId)) {
      return "multichannel_scale";
    }
  }

  return null;
}

function resolvePlanCode(subscription: Stripe.Subscription): PlanCode | null {
  const metadataPlan = parsePlanCode(subscription.metadata?.plan_code);
  if (metadataPlan) {
    return metadataPlan;
  }
  return resolvePlanCodeFromItems(subscription);
}

function resolveAgentsFromItems(subscription: Stripe.Subscription): number | null {
  // Each base plan item includes 2 agents; additional line item quantity adds extra agents.
  const BASE_INCLUDED_AGENTS = 2;
  const basePriceIds = new Set(
    [
      process.env.PRICE_ID_LINKEDIN_BASE_2?.trim(),
      process.env.PRICE_ID_MULTICHANNEL_BASE_2?.trim()
    ].filter((value): value is string => Boolean(value))
  );
  const additionalPriceIds = new Set(
    [
      process.env.PRICE_ID_LINKEDIN_ADDL_AGENT?.trim(),
      process.env.PRICE_ID_MULTICHANNEL_ADDL_AGENT?.trim()
    ].filter((value): value is string => Boolean(value))
  );

  let hasBaseItem = false;
  let additionalAgents = 0;

  for (const item of subscription.items.data) {
    const priceId = item.price?.id?.trim();
    if (!priceId) {
      continue;
    }
    if (basePriceIds.has(priceId)) {
      hasBaseItem = true;
      continue;
    }
    if (additionalPriceIds.has(priceId)) {
      additionalAgents += item.quantity ?? 0;
    }
  }

  if (!hasBaseItem) {
    return null;
  }

  const totalAgents = BASE_INCLUDED_AGENTS + additionalAgents;
  return Number.isInteger(totalAgents) && totalAgents >= BASE_INCLUDED_AGENTS ? totalAgents : null;
}

function resolveAgentCount(subscription: Stripe.Subscription): number {
  const metadataAgents = parseMetadataAgents(subscription.metadata?.agents);
  if (metadataAgents) {
    return metadataAgents;
  }

  const derivedFromItems = resolveAgentsFromItems(subscription);
  if (derivedFromItems) {
    return derivedFromItems;
  }

  // Fallback for legacy subscriptions.
  return subscription.items.data[0]?.quantity ?? 1;
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
}): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Idempotency guard: if checkout session already persisted, do nothing.
  const existing = await supabase
    .from("client_subscriptions")
    .select("id, client_id")
    .eq("stripe_checkout_session_id", input.checkoutSessionId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to check existing subscription row: ${existing.error.message}`);
  }

  if (existing.data?.client_id) {
    return String(existing.data.client_id);
  }

  const clientId = await resolveClientId({
    supabase,
    explicitClientId: input.explicitClientId,
    stripeCustomerId: input.stripeCustomerId,
    customerName: input.customerName,
    customerEmail: input.customerEmail
  });

  const primaryItem = getPrimaryItem(input.stripeSubscription);
  const planCode = resolvePlanCode(input.stripeSubscription);
  const agents = resolveAgentCount(input.stripeSubscription);
  const effectiveBillingAnchor =
    input.stripeSubscription.trial_end ?? input.stripeSubscription.billing_cycle_anchor;
  const payload: ClientSubscriptionInsert = {
    client_id: clientId,
    client_email: input.customerEmail?.trim() || null,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscription.id,
    stripe_checkout_session_id: input.checkoutSessionId,
    plan_code: planCode,
    price_id: primaryItem.price.id,
    unit_price_cents: primaryItem.price.unit_amount ?? null,
    agents,
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
    return clientId;
  }

  // Safe retry: concurrent duplicate webhook may hit unique constraint after pre-check.
  const isUniqueViolation = insertResult.error.code === "23505";
  if (isUniqueViolation) {
    const existingAfterConflict = await supabase
      .from("client_subscriptions")
      .select("client_id")
      .eq("stripe_checkout_session_id", input.checkoutSessionId)
      .maybeSingle();

    if (existingAfterConflict.error) {
      throw new Error(
        `Failed to resolve subscription row after unique violation: ${existingAfterConflict.error.message}`
      );
    }

    const conflictClientId = String(existingAfterConflict.data?.client_id ?? "").trim();
    if (conflictClientId) {
      return conflictClientId;
    }

    throw new Error("Subscription row exists but client_id is missing after unique violation.");
  }

  throw new Error(`Failed to insert client_subscriptions row: ${insertResult.error.message}`);
}

export async function updateClientSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const primaryItem = getPrimaryItem(subscription);
  const planCode = resolvePlanCode(subscription);
  const agents = resolveAgentCount(subscription);

  const payload: ClientSubscriptionUpdate = {
    current_period_start: toIsoFromUnixSeconds(primaryItem.current_period_start),
    current_period_end: toIsoFromUnixSeconds(primaryItem.current_period_end),
    status: subscription.status,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    plan_code: planCode,
    agents
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
