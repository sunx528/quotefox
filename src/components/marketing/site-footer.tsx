import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-brand-foreground text-sm">Q</span>
              Quotefox
            </div>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Le tunnel de devis qui se rembourse dès le premier chantier.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <div className="font-medium text-foreground">Produit</div>
              <ul className="mt-3 space-y-2 text-muted">
                <li><Link href="/pricing" className="hover:text-foreground">Tarifs</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Commencer gratuitement</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-foreground">Mentions légales</div>
              <ul className="mt-3 space-y-2 text-muted">
                <li><Link href="/legal/privacy" className="hover:text-foreground">Confidentialité</Link></li>
                <li><Link href="/legal/terms" className="hover:text-foreground">Conditions d&apos;utilisation</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-foreground">Support</div>
              <ul className="mt-3 space-y-2 text-muted">
                <li><a href="mailto:support@quotefox.example" className="hover:text-foreground">support@quotefox.example</a></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-muted">© {new Date().getFullYear()} Quotefox. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
