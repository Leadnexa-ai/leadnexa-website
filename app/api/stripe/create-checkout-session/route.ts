import { createHash } from "crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSessionFromCookie } from "../../../../lib/auth-session";
import { getPlanPricing, isPlanCode, type PlanCode } from "../../../../lib/leadnexa-pricing";
import { getPendingSignupById } from "../../../../lib/pending-signups";
import { createServerSupabase } from "../../../../lib/supabase-admin";
import { stripe } from "../../../../lib/stripe";

export const runtime = "nodejs";
const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

function getCheckoutUrls() {
  const successUrl = process.env.STRIPE_SUCCESS_URL;
  const cancelUrl = process.env.STRIPE_CANCEL_URL;

  if (!successUrl || !cancelUrl) {
    throw new Error("Missing STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL.");
  }

  return { successUrl, cancelUrl };
}

function getCouponId(): string | null {
  const couponId = process.env.STRIPE_COUPON_25_OFF_ID?.trim();
  return couponId && couponId.length > 0 ? couponId : null;
}

function getRequestIdempotencyKey(
  request: Request,
  principalId: string,
  plan: PlanCode,
  agents: number
) {
  const headerValue = request.headers.get("x-idempotency-key")?.trim();
  if (headerValue) {
    return `checkout_${headerValue}`;
  }

  const fallbackRaw = `${principalId}:${plan}:${agents}:${
    request.headers.get("x-forwarded-for") ?? "unknown"
  }`;
  const fallbackHash = createHash("sha256").update(fallbackRaw).digest("hex").slice(0, 32);
  return `checkout_${fallbackHash}`;
}

function buildCancelUrlWithAgents(cancelUrl: string, plan: PlanCode, agents: number): string {
  try {
    const url = new URL(cancelUrl);
    url.searchParams.set("plan", plan);
    url.searchParams.set("agents", String(agents));
    return url.toString();
  } catch {
    const separator = cancelUrl.includes("?") ? "&" : "?";
    return `${cancelUrl}${separator}plan=${encodeURIComponent(plan)}&agents=${encodeURIComponent(
      String(agents)
    )}`;
  }
}

async function hasActiveSubscription(clientId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const result = await supabase
    .from("client_subscriptions")
    .select("id")
    .eq("client_id", clientId)
    .in("status", ACTIVE_SUBSCRIPTION_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to check existing subscription: ${result.error.message}`);
  }

  return Boolean(result.data?.id);
}

async function findLatestStripeCustomerIdByClientId(clientId: string): Promise<string | null> {
  const supabase = createServerSupabase();
  const result = await supabase
    .from("client_subscriptions")
    .select("stripe_customer_id")
    .eq("client_id", clientId)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to lookup existing stripe customer: ${result.error.message}`);
  }

  const customerId = String(result.data?.stripe_customer_id ?? "").trim();
  return customerId || null;
}

async function resolveCheckoutCustomerId(input: {
  clientId?: string;
  email: string;
  plan: PlanCode;
  agents: number;
}): Promise<string> {
  if (input.clientId) {
    const existingByClient = await findLatestStripeCustomerIdByClientId(input.clientId);
    if (existingByClient) {
      return existingByClient;
    }
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingByEmail = await stripe.customers.list({
    email: normalizedEmail,
    limit: 1
  });

  const existingCustomer = existingByEmail.data[0];
  if (existingCustomer?.id) {
    return existingCustomer.id;
  }

  const created = await stripe.customers.create({
    email: normalizedEmail,
    metadata: {
      source: "leadnexa_checkout",
      plan_code: input.plan,
      agents: String(input.agents)
    }
  });

  return created.id;
}

export async function POST(request: Request) {
  try {
    const authSession = getSessionFromCookie();
    if (!authSession) {
      return NextResponse.json({ error: "You must be logged in to start checkout." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan;
    const agents = Number(body?.agents);

    if (!isPlanCode(plan)) {
      return NextResponse.json(
        { error: "plan must be one of: linkedin_scale, multichannel_scale." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(agents) || agents < 2 || agents > 30) {
      return NextResponse.json(
        { error: "agents must be an integer between 2 and 30." },
        { status: 400 }
      );
    }

    const pricing = getPlanPricing(plan, agents);
    const { successUrl, cancelUrl } = getCheckoutUrls();
    const couponId = getCouponId();
    const metadata: Record<string, string> = {
      plan_code: plan,
      agents: String(agents),
      base_price_id: pricing.basePriceId,
      additional_price_id: pricing.additionalPriceId
    };
    let idempotencyPrincipal = "";
    let checkoutCustomerEmail = authSession.email;
    let checkoutCustomerClientId: string | undefined;

    if (authSession.session_type === "app") {
      const clientId = authSession.client_id;
      const alreadySubscribed = await hasActiveSubscription(clientId);
      if (alreadySubscribed) {
        return NextResponse.json(
          { error: "Your account already has an active subscription." },
          { status: 409 }
        );
      }

      metadata.client_id = clientId;
      idempotencyPrincipal = `client_${clientId}`;
      checkoutCustomerClientId = clientId;
    } else {
      const pendingSignup = await getPendingSignupById(authSession.pending_signup_id);
      if (!pendingSignup) {
        return NextResponse.json({ error: "Pending signup not found." }, { status: 401 });
      }

      if (pendingSignup.status === "expired") {
        return NextResponse.json(
          { error: "Signup has expired. Please register again." },
          { status: 409 }
        );
      }

      if (pendingSignup.status === "activated" && pendingSignup.client_id) {
        const alreadySubscribed = await hasActiveSubscription(pendingSignup.client_id);
        if (alreadySubscribed) {
          return NextResponse.json(
            { error: "Your account already has an active subscription." },
            { status: 409 }
          );
        }
        metadata.client_id = pendingSignup.client_id;
      }

      if (pendingSignup.status === "activated" && !pendingSignup.client_id) {
        return NextResponse.json(
          { error: "Activated signup is missing client linkage." },
          { status: 500 }
        );
      }

      if (pendingSignup.status === "pending" && !pendingSignup.email_verified_at) {
        return NextResponse.json(
          { error: "Please verify your email before starting checkout." },
          { status: 403 }
        );
      }

      metadata.pending_signup_id = pendingSignup.id;
      metadata.pending_signup_email = pendingSignup.email;
      idempotencyPrincipal = `pending_${pendingSignup.id}`;
      checkoutCustomerEmail = pendingSignup.email;
    }

    const idempotencyKey = getRequestIdempotencyKey(request, idempotencyPrincipal, plan, agents);
    const cancelUrlWithAgents = buildCancelUrlWithAgents(cancelUrl, plan, agents);
    const customerId = await resolveCheckoutCustomerId({
      clientId: checkoutCustomerClientId,
      email: checkoutCustomerEmail,
      plan,
      agents
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: pricing.basePriceId,
        quantity: 1
      }
    ];

    if (pricing.additionalAgents > 0) {
      lineItems.push({
        price: pricing.additionalPriceId,
        quantity: pricing.additionalAgents
      });
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrlWithAgents,
      customer: customerId,
      line_items: lineItems,
      subscription_data: { metadata },
      discounts: couponId ? [{ coupon: couponId }] : undefined,
      metadata
    };

    const checkoutSession = await stripe.checkout.sessions.create(params, { idempotencyKey });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Stripe session URL missing." }, { status: 500 });
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
