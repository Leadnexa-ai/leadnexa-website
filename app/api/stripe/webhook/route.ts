import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  insertClientSubscriptionFromCheckout,
  updateClientSubscriptionFromStripeSubscription
} from "../../../../lib/subscription-records";
import { activatePendingSignupFromCheckout } from "../../../../lib/pending-signups";
import { stripe } from "../../../../lib/stripe";

export const runtime = "nodejs";

function getWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
  }
  return webhookSecret;
}

export async function POST(request: Request) {
  const signature = headers().get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, getWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook signature verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      const stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      const pendingSignupId = String(session.metadata?.pending_signup_id ?? "").trim();
      let explicitClientId = String(session.metadata?.client_id ?? "").trim();
      const customerName = session.customer_details?.name ?? undefined;
      const customerEmail = session.customer_details?.email ?? undefined;

      if (!stripeCustomerId || !stripeSubscriptionId) {
        return NextResponse.json(
          { error: "Missing customer/subscription on checkout session." },
          { status: 400 }
        );
      }

      if (!explicitClientId && pendingSignupId) {
        const activation = await activatePendingSignupFromCheckout({
          pendingSignupId,
          checkoutSessionId: session.id,
          customerName,
          customerEmail
        });
        explicitClientId = activation.clientId;
      }

      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
        expand: ["items.data.price"]
      });

      await insertClientSubscriptionFromCheckout({
        checkoutSessionId: session.id,
        explicitClientId,
        customerName,
        customerEmail,
        stripeCustomerId,
        stripeSubscription: subscription
      });
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      await updateClientSubscriptionFromStripeSubscription(subscription);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await updateClientSubscriptionFromStripeSubscription(subscription);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
