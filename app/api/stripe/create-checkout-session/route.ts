import { createHash } from "crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSessionFromCookie } from "../../../../lib/auth-session";
import { getTierForAgentCount } from "../../../../lib/leadnexa-pricing";
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

function getRequestIdempotencyKey(request: Request, principalId: string, agents: number) {
  const headerValue = request.headers.get("x-idempotency-key")?.trim();
  if (headerValue) {
    return `checkout_${headerValue}`;
  }

  const fallbackRaw = `${principalId}:${agents}:${request.headers.get("x-forwarded-for") ?? "unknown"}`;
  const fallbackHash = createHash("sha256").update(fallbackRaw).digest("hex").slice(0, 32);
  return `checkout_${fallbackHash}`;
}

function buildCancelUrlWithAgents(cancelUrl: string, agents: number): string {
  try {
    const url = new URL(cancelUrl);
    url.searchParams.set("agents", String(agents));
    return url.toString();
  } catch {
    const separator = cancelUrl.includes("?") ? "&" : "?";
    return `${cancelUrl}${separator}agents=${encodeURIComponent(String(agents))}`;
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

export async function POST(request: Request) {
  try {
    const authSession = getSessionFromCookie();
    if (!authSession) {
      return NextResponse.json({ error: "You must be logged in to start checkout." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const agents = Number(body?.agents);

    if (!Number.isInteger(agents) || agents < 1 || agents > 30) {
      return NextResponse.json(
        { error: "agents must be an integer between 1 and 30." },
        { status: 400 }
      );
    }

    const { priceId } = getTierForAgentCount(agents);
    const { successUrl, cancelUrl } = getCheckoutUrls();
    const couponId = getCouponId();
    const metadata: Record<string, string> = { agents: String(agents), recurring_price_id: priceId };
    let idempotencyPrincipal = "";

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

      metadata.pending_signup_id = pendingSignup.id;
      metadata.pending_signup_email = pendingSignup.email;
      idempotencyPrincipal = `pending_${pendingSignup.id}`;
    }

    const idempotencyKey = getRequestIdempotencyKey(request, idempotencyPrincipal, agents);
    const cancelUrlWithAgents = buildCancelUrlWithAgents(cancelUrl, agents);

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrlWithAgents,
      line_items: [
        {
          price: priceId,
          quantity: agents
        }
      ],
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
