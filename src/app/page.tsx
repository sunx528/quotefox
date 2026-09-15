import Link from "next/link";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Zap, ShieldCheck, LineChart, ArrowRight, Check, X } from "lucide-react";

const DEMO_FUNNEL_URL = "/q/devis-remplacement-de-toiture-demo-y3ap3d";

const COMPARISON_ROWS: { label: string; quotefox: string; marketplace: string }[] = [
  { label: "Prix", quotefox: "Forfait mensuel fixe (0–199 $)", marketplace: "50–120 $+ par lead partagé" },
  { label: "Exclusivité du lead", quotefox: "100 % à vous, jamais revendu", marketplace: "Revendu à plusieurs artisans à la fois" },
  { label: "Où vit le tunnel", quotefox: "Sur votre propre site, à votre image", marketplace: "Sur leur marketplace, entourés de vos concurrents" },
  { label: "Estimation avant contact", quotefox: "Le visiteur voit une fourchette avant de soumettre", marketplace: "Formulaire de contact générique, sans prix" },
  { label: "Propriété des données", quotefox: "Vous appartiennent, exportables en CSV", marketplace: "Appartiennent à la marketplace" },
];

const TRADES = [
  "Toiture", "Plomberie", "Électricité", "Chauffage/Climatisation", "Peinture", "Aménagement paysager",
  "Nettoyage", "Lutte antiparasitaire", "Déménagement", "Rénovation", "Portes de garage", "Photographie",
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Arrêtez de payer 50–120 $ pour des leads qui ne répondent jamais.
            </h1>
            <p className="mt-6 text-lg text-muted sm:text-xl">
              Quotefox transforme le trafic de votre site en leads qualifiés et chiffrés grâce à un
              configurateur de devis à votre image — sans frais par lead, sans code, sans attendre une marketplace.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg">Essai gratuit — sans carte bancaire</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="secondary">Voir les tarifs</Button>
              </Link>
            </div>
            <a
              href={DEMO_FUNNEL_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Essayer un tunnel en direct, sans compte <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <p className="mt-6 text-xs text-muted">
              Sans carte bancaire · Annulez à tout moment · Configuration en 5 minutes
            </p>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-border bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Le modèle économique des marketplaces de leads ne fonctionne pas</h2>
                <p className="mt-3 text-muted">
                  Angi, Thumbtack et HomeAdvisor facturent 15 à 120 $ et plus par lead partagé — le même lead
                  vendu à plusieurs artisans à la fois. Les régulateurs ont infligé des millions de dollars
                  d&apos;amendes à ces marketplaces pour des allégations trompeuses sur la qualité des leads et
                  les revenus promis. Vous payez le prix d&apos;une marketplace pour des leads de qualité marketplace.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Un simple formulaire de contact fait fuir les visiteurs</h2>
                <p className="mt-3 text-muted">
                  Les visiteurs qui veulent un prix n&apos;appelleront pas, et ils ne rempliront pas un
                  formulaire vide sans bénéfice immédiat. Sans estimation de prix instantanée, la majorité de
                  votre trafic payant repart sans jamais vous dire ce dont il a besoin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison vs lead marketplaces */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
            Quotefox face aux marketplaces de leads
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            Angi, Thumbtack et HomeAdvisor vous mettent en concurrence pour le même lead. Quotefox vous appartient.
          </p>
          <div className="mt-10 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1.1fr_0.7fr_1.2fr] gap-2 bg-black/[0.02] text-xs font-medium text-foreground dark:bg-white/[0.03] sm:gap-0 sm:text-sm">
              <div className="px-3 py-3 sm:px-4">&nbsp;</div>
              <div className="flex items-center gap-1.5 px-3 py-3 text-brand-dark sm:px-4">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand text-[11px] text-brand-foreground">Q</span>
                <span className="hidden sm:inline">Quotefox</span>
              </div>
              <div className="px-3 py-3 sm:px-4">Marketplaces</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.1fr_0.7fr_1.2fr] items-start gap-2 border-t border-border text-xs sm:gap-0 sm:text-sm ${
                  i % 2 === 1 ? "bg-black/[0.01] dark:bg-white/[0.015]" : ""
                }`}
              >
                <div className="px-3 py-3 text-foreground sm:px-4">{row.label}</div>
                <div className="flex items-start gap-1 px-3 py-3 text-foreground sm:px-4">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{row.quotefox}</span>
                </div>
                <div className="flex items-start gap-1 px-3 py-3 text-muted sm:px-4">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{row.marketplace}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Solution / how it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
            Un tunnel que vos visiteurs vont réellement jusqu&apos;au bout
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-4">
            {[
              ["Répondre à quelques questions", "Des questions ramifiées et adaptées au métier — type de bien, taille, état, délai."],
              ["Voir une estimation instantanée", "Une fourchette de prix validée côté serveur apparaît dès qu'ils terminent."],
              ["Laisser leurs coordonnées", "Seuls les visiteurs qui perçoivent une vraie valeur vous laissent leur nom et leur numéro."],
              ["Vous recevez un lead chiffré", "Il arrive dans votre tableau de bord, avec une notification, prêt à être conclu."],
            ].map(([title, desc], i) => (
              <div key={title} className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-3 font-medium text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: Zap, title: "Logique conditionnelle sans code", desc: "Affichez ou masquez des questions selon les réponses précédentes — configuré visuellement, sans développeur." },
                { Icon: LineChart, title: "Un vrai moteur de tarification", desc: "Prix de base plus des modificateurs par question pour calculer une fourchette déterministe, validée côté serveur." },
                { Icon: CheckCircle2, title: "CRM de leads intégré", desc: "Chaque soumission arrive dans un pipeline : nouveau, contacté, qualifié, gagné, perdu." },
                { Icon: ShieldCheck, title: "Le tunnel vous appartient", desc: "Intégrez-le sur votre propre site. Aucun lead partagé, aucune enchère contre d'autres artisans." },
              ].map(({ Icon, title, desc }) => (
                <Card key={title}>
                  <CardContent className="pt-5">
                    <Icon className="h-6 w-6 text-brand" />
                    <h3 className="mt-3 font-medium text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-t border-border bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-foreground">Conçu pour les métiers des services à domicile</h2>
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
              {TRADES.map((trade) => (
                <span key={trade} className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-foreground">
                  {trade}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl bg-brand px-8 py-14 text-center text-brand-foreground">
            <h2 className="text-2xl font-semibold sm:text-3xl">Un seul chantier remporté paie une année de Quotefox.</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-foreground/90">
              Configurez votre premier tunnel de devis en quelques minutes. Gratuit pendant l&apos;essai —
              passez à un forfait payant une fois que ça fonctionne.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="mt-6">Commencer gratuitement</Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
