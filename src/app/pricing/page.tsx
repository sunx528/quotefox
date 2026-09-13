import Link from "next/link";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tarifs" };

const PLANS = [
  {
    name: "Gratuit",
    price: "0 $",
    period: "à vie",
    description: "Essayez-le sur votre site sans aucun risque.",
    features: ["1 tunnel", "25 leads/mois", "Marque Quotefox sur le widget", "Notifications de leads par e-mail"],
    cta: "Commencer gratuitement",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "79 $",
    period: "/mois",
    description: "Pour une entreprise qui exploite sérieusement un tunnel de devis actif.",
    features: ["5 tunnels", "500 leads/mois", "Retirer la marque Quotefox", "Export CSV", "Notifications par e-mail"],
    cta: "Démarrer l'essai gratuit",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Business",
    price: "199 $",
    period: "/mois",
    description: "Pour les entreprises multi-services et agences qui gèrent plusieurs tunnels.",
    features: ["Tunnels illimités", "3 000 leads/mois", "Webhooks", "Support prioritaire", "Tout ce qui est inclus dans Pro"],
    cta: "Démarrer l'essai gratuit",
    href: "/signup",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-semibold text-foreground">Une tarification simple, remboursée dès le premier chantier</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Un seul lead Angi ou Thumbtack peut coûter 50 à 120 $, sans garantie qu&apos;il soit exclusif ou
            qu&apos;il réponde au téléphone. Quotefox, c&apos;est un prix mensuel fixe pour un tunnel qui vous appartient.
          </p>
        </section>
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan.name} className={plan.highlighted ? "border-brand shadow-md ring-1 ring-brand" : undefined}>
                <CardContent className="pt-6">
                  <h2 className="font-semibold text-foreground">{plan.name}</h2>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{plan.description}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="mt-6 block">
                    <Button className="w-full" variant={plan.highlighted ? "primary" : "secondary"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Facturation mensuelle. Annulez à tout moment depuis vos paramètres de facturation. Prix en dollars américains (USD).
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
