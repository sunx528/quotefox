import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { Plan, SubscriptionStatus } from "@/lib/enums";

// Stripe webhook state is the source of truth for billing (see PRODUCT_SPEC.md
// section 32) — this handler is the ONLY place plan/status is ever written.

function planFromPriceId(priceId: string | undefined): Plan {
  if (priceId && priceId === process.env.STRIPE_PRICE_BUSINESS_MONTHLY) return "business";
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "pro";
  return "free";
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    default:
      return "incomplete";
  }
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured on this server." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe:webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency: Stripe may deliver the same event more than once.
  const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { id: event.id } });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        if (organizationId && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = subscription.items.data[0]?.price.id;
          await prisma.subscription.upsert({
            where: { organizationId },
            update: {
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: subscription.id,
              plan: planFromPriceId(priceId),
              status: mapStripeStatus(subscription.status),
              currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
            },
            create: {
              organizationId,
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: subscription.id,
              plan: planFromPriceId(priceId),
              status: mapStripeStatus(subscription.status),
              currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (existing) {
          await prisma.subscription.update({
            where: { organizationId: existing.organizationId },
            data: {
              plan: planFromPriceId(priceId),
              status: mapStripeStatus(subscription.status),
              currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (existing) {
          await prisma.subscription.update({
            where: { organizationId: existing.organizationId },
            data: { plan: "free", status: "canceled" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : undefined;
        if (subscriptionId) {
          const existing = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
          if (existing) {
            await prisma.subscription.update({
              where: { organizationId: existing.organizationId },
              data: { status: "past_due" },
            });
          }
        }
        break;
      }

      default:
        break;
    }

    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe:webhook] handler error", err);
    return NextResponse.json({ error: "Webhook handler error." }, { status: 500 });
  }
}
