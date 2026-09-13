import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function TermsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold text-foreground">Conditions d&apos;utilisation</h1>
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <strong>Contenu provisoire — action requise avant le lancement.</strong> Cette page doit être remplacée
          par de véritables conditions rédigées ou vérifiées par un avocat avant d&apos;accepter des clients
          payants, couvrant l&apos;usage autorisé, la facturation/les remboursements, les limites de
          responsabilité et la résiliation de compte.
        </div>
        <p className="mt-6 text-sm text-muted">
          Contactez <a href="mailto:legal@quotefox.example" className="underline">legal@quotefox.example</a> pour
          toute question en attendant.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
