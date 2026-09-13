import Link from "next/link";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Zap, ShieldCheck, LineChart } from "lucide-react";

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
