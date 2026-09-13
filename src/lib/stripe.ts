import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/** Throws a clear, catchable error rather than crashing at import time when Stripe isn't configured yet. */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Billing is not configured yet. Set STRIPE_SECRET_KEY (and related env vars) to enable checkout."
    );
  }
  cached = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
