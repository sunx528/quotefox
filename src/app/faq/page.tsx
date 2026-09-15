import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Ai-je besoin de savoir coder ?",
    a: "Non. Les tunnels, les questions, la logique conditionnelle et les règles de tarification se configurent visuellement depuis le tableau de bord.",
  },
  {
    q: "Comment fonctionne le moteur de tarification ?",
    a: "Chaque tunnel a un prix de base. Chaque réponse peut ajouter un montant fixe, un pourcentage ou un montant par unité (par ex. $/m²). La fourchette finale affichée aux visiteurs est calculée et validée sur notre serveur — jamais approuvée depuis le navigateur du visiteur.",
  },
  {
    q: "Puis-je l'intégrer à mon site existant ?",
    a: "Oui — chaque tunnel publié vous donne un extrait de code à copier-coller pour l'afficher sur votre propre site, ainsi qu'un lien public autonome que vous pouvez partager directement.",
  },
  {
    q: "Que deviennent les leads ?",
    a: "Chaque soumission devient un lead dans votre tableau de bord, avec l'ensemble des réponses, les photos éventuellement envoyées et l'estimation calculée. Vous pouvez suivre le statut (nouveau, contacté, qualifié, gagné, perdu), rechercher, filtrer et exporter en CSV.",
  },
  {
    q: "Que se passe-t-il si je dépasse la limite de leads de mon forfait ?",
    a: "Votre tunnel continue de fonctionner, mais les nouvelles soumissions au-delà de votre plafond mensuel sont poliment refusées, avec un message invitant le visiteur à vous contacter directement, jusqu'à ce que vous passiez à un forfait supérieur ou que le mois recommence.",
  },
  {
    q: "Mes données sont-elles exportables ?",
    a: "Oui. Vous pouvez exporter tous vos leads en CSV à tout moment depuis votre tableau de bord.",
  },
  {
    q: "Dois-je entrer ma carte bancaire pour l'essai gratuit ?",
    a: "Non. Le forfait Gratuit ne demande aucune carte bancaire et n'expire pas — vous passez à un forfait payant uniquement quand vous êtes prêt.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, en un clic depuis Paramètres → Facturation → Gérer la facturation. Aucun engagement, aucun frais de résiliation.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-semibold text-foreground">Questions fréquentes</h1>
          <div className="mt-10 divide-y divide-border">
            {FAQS.map((item) => (
              <div key={item.q} className="py-6">
                <h2 className="font-medium text-foreground">{item.q}</h2>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
