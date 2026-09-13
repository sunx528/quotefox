import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import { PLAN_LIMITS, type Plan } from "@/lib/enums";
import { PLAN_LABELS, SUBSCRIPTION_STATUS_LABELS, label } from "@/lib/labels";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { CheckoutButton } from "@/components/dashboard/checkout-button";
import { PortalButton } from "@/components/dashboard/portal-button";
import { WebhookSettings } from "@/components/dashboard/webhook-settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Facturation" };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [sub, funnelCount, org, deliveries] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: user.organizationId } }),
    prisma.funnel.count({ where: { organizationId: user.organizationId } }),
    prisma.organization.findUnique({ where: { id: user.organizationId } }),
    prisma.webhookDelivery.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const plan = (sub?.plan as Plan) ?? "free";
  const limits = PLAN_LIMITS[plan];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const leadsThisMonth = await prisma.lead.count({
    where: { organizationId: user.organizationId, createdAt: { gte: startOfMonth } },
  });

  const configured = isStripeConfigured();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">Facturation</h1>

      {!configured && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Stripe n&apos;est pas encore configuré dans cet environnement. Ajoutez STRIPE_SECRET_KEY,
          STRIPE_WEBHOOK_SECRET et STRIPE_PRICE_* à votre environnement pour activer le paiement réel (voir
          .env.example). Votre compte se comporte actuellement comme s&apos;il était sur le forfait Gratuit.
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="flex items-center justify-between pt-5">
          <div>
            <p className="text-sm text-muted">Forfait actuel</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{label(PLAN_LABELS, plan)}</p>
            <Badge tone={sub?.status === "past_due" ? "danger" : "success"} className="mt-2">
              {label(SUBSCRIPTION_STATUS_LABELS, sub?.status ?? "active")}
            </Badge>
          </div>
          {sub?.stripeCustomerId && <PortalButton />}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-foreground">Utilisation ce mois-ci</p>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <div className="flex justify-between text-muted">
                <span>Tunnels</span>
                <span>
                  {funnelCount} / {limits.funnels === Infinity ? "∞" : limits.funnels}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${limits.funnels === Infinity ? 5 : Math.min(100, (funnelCount / limits.funnels) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-muted">
                <span>Prospects</span>
                <span>
                  {leadsThisMonth} / {limits.leadsPerMonth === Infinity ? "∞" : limits.leadsPerMonth}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{
                    width: `${limits.leadsPerMonth === Infinity ? 5 : Math.min(100, (leadsThisMonth / limits.leadsPerMonth) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {plan === "business" && (
        <div className="mt-6">
          <WebhookSettings
            webhookUrl={org?.webhookUrl ?? null}
            webhookSecret={org?.webhookSecret ?? null}
            recentDeliveries={deliveries.map((d) => ({
              id: d.id,
              success: d.success,
              statusCode: d.statusCode,
              error: d.error,
              createdAt: d.createdAt.toISOString(),
            }))}
          />
        </div>
      )}

      {plan !== "business" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {plan === "free" && (
            <Card>
              <CardContent className="pt-5">
                <p className="font-medium text-foreground">Pro — 79 $/mois</p>
                <p className="mt-1 text-sm text-muted">5 tunnels, 500 leads/mois, retrait de la marque, export CSV.</p>
                <div className="mt-4">
                  <CheckoutButton plan="pro" disabled={!configured} />
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-5">
              <p className="font-medium text-foreground">Business — 199 $/mois</p>
              <p className="mt-1 text-sm text-muted">Tunnels illimités, 3 000 leads/mois, webhooks, support prioritaire.</p>
              <div className="mt-4">
                <CheckoutButton plan="business" disabled={!configured} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
