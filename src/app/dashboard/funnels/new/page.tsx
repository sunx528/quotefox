import { createFunnel } from "@/lib/actions/funnels";
import { FUNNEL_TEMPLATES } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewFunnelPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/funnels" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux tunnels
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Créer un tunnel</h1>
      <p className="mt-1 text-sm text-muted">Partez d&apos;un modèle métier avec des questions et une tarification prêtes à l&apos;emploi, ou d&apos;un tunnel vierge.</p>

      <form action={createFunnel} className="mt-8 space-y-6">
        <div>
          <Label htmlFor="name">Nom du tunnel</Label>
          <Input id="name" name="name" required placeholder="ex. Devis remplacement de toiture" />
        </div>

        <div>
          <Label>Point de départ</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {FUNNEL_TEMPLATES.map((t, i) => (
              <label
                key={t.key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 has-[:checked]:border-brand has-[:checked]:ring-1 has-[:checked]:ring-brand"
              >
                <input type="radio" name="templateKey" value={t.key} defaultChecked={i === 0} className="mt-1" />
                <div>
                  <p className="font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted">{t.questions.length} questions prêtes à l&apos;emploi</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit">Créer le tunnel</Button>
      </form>
    </div>
  );
}
