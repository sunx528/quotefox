"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { Plan } from "@/lib/enums";

const PRICE_ENV_BY_PLAN: Record<Exclude<Plan, "free">, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
  business: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
};

export async function startCheckout(plan: "pro" | "business") {
  const user = await requireUser();

  if (!isStripeConfigured()) {
    throw new Error(
      "La facturation n'est pas encore configurée dans cet environnement. Ajoutez les variables d'environnement STRIPE_SECRET_KEY et STRIPE_PRICE_* pour activer le paiement (voir .env.example)."
    );
  }

  const priceId = PRICE_ENV_BY_PLAN[plan];
  if (!priceId) {
    throw new Error(`Aucun prix Stripe n'est encore configuré pour le forfait ${plan}.`);
  }

  const stripe = getStripe();
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: { subscription: true },
  });
  if (!org) throw new Error("Organisation introuvable.");

  let customerId = org.subscription?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { organizationId: org.id },
      update: { stripeCustomerId: customerId },
      create: { organizationId: org.id, stripeCustomerId: customerId, plan: "free", status: "active" },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
    subscription_data: { metadata: { organizationId: org.id, plan } },
    metadata: { organizationId: org.id, plan },
  });

  if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  redirect(session.url);
}

export async function openBillingPortal() {
  const user = await requireUser();

  if (!isStripeConfigured()) {
    throw new Error("La facturation n'est pas encore configurée dans cet environnement.");
  }

  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { organizationId: user.organizationId } });
  if (!sub?.stripeCustomerId) {
    throw new Error("Aucun compte de facturation pour l'instant — démarrez d'abord un abonnement.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  redirect(portal.url);
}
