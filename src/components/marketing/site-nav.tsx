import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
          Quotefox
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted sm:flex">
          <Link href="/pricing" className="hover:text-foreground">Tarifs</Link>
          <Link href="/faq" className="hover:text-foreground">FAQ</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-muted hover:text-foreground sm:inline">
            Se connecter
          </Link>
          <Link href="/signup">
            <Button size="sm">Commencer gratuitement</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
