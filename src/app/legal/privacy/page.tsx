import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold text-foreground">Politique de confidentialité</h1>
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <strong>Contenu provisoire — action requise avant le lancement.</strong> Cette page doit être remplacée
          par une véritable politique de confidentialité rédigée ou vérifiée par un avocat avant d&apos;accepter
          des données clients réelles. Elle doit préciser quelles données sont collectées auprès des titulaires
          de compte et des visiteurs des tunnels (y compris les photos envoyées), comment elles sont stockées,
          avec qui elles sont partagées (Stripe, Resend), leur durée de conservation, et comment un utilisateur
          peut demander leur suppression ou leur export.
        </div>
        <p className="mt-6 text-sm text-muted">
          Contactez <a href="mailto:privacy@quotefox.example" className="underline">privacy@quotefox.example</a>{" "}
          pour toute question relative aux données en attendant.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
