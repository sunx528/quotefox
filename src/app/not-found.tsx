import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="secondary">Retour à l&apos;accueil</Button>
      </Link>
    </div>
  );
}
