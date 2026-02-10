import { createHash } from "crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getTierForAgentCount } from "../../../../lib/leadnexa-pricing";
import { stripe } from "../../../../lib/stripe";

export const runtime = "nodejs";

function getCheckoutUrls() {
  const successUrl = process.env.STRIPE_SUCCESS_URL;
  const cancelUrl = process.env.STRIPE_CANCEL_URL;

  if (!successUrl || !cancelUrl) {
    throw new Error("Missing STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL.");
  }

  return { successUrl, cancelUrl };
}

function getCouponId() {
  const couponId = process.env.STRIPE_COUPON_25_OFF_ID;
  if (!couponId) {
    throw new Error("Missing STRIPE_COUPON_25_OFF_ID.");
  }
  return couponId;
}

function getRequestIdempotencyKey(request: Request, clientId: string, agents: number) {
  const headerValue = request.headers.get("x-idempotency-key")?.trim();
  if (headerValue) {
    return `checkout_${headerValue}`;
  }

  const fallbackRaw = `${clientId}:${agents}:${request.headers.get("x-forwarded-for") ?? "unknown"}`;
  const fallbackHash = createHash("sha256").update(fallbackRaw).digest("hex").slice(0, 32);
  return `checkout_${fallbackHash}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const agents = Number(body?.agents);
    const clientId = String(body?.clientId ?? "").trim();

    if (!Number.isInteger(agents) || agents < 1 || agents > 30) {
      return NextResponse.json(
        { error: "agents must be an integer between 1 and 30." },
        { status: 400 }
      );
    }
    const { priceId } = getTierForAgentCount(agents);
    const { successUrl, cancelUrl } = getCheckoutUrls();
    const couponId = getCouponId();
    const idempotencyKey = getRequestIdempotencyKey(request, clientId || "new-client", agents);
    const metadata: Record<string, string> = {
      agents: String(agents),
      recurring_price_id: priceId
    };
    if (clientId) {
      metadata.client_id = clientId;
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: priceId,
          quantity: agents
        }
      ],
      subscription_data: { metadata },
      discounts: [{ coupon: couponId }],
      metadata
    };

    const session = await stripe.checkout.sessions.create(params, { idempotencyKey });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe session URL missing." }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
