"use client";

import { useState, useTransition } from "react";
import { updateFunnelSettings } from "@/lib/actions/funnels";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { BuilderFunnel } from "./types";

export function SettingsPanel({ funnel }: { funnel: BuilderFunnel }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateFunnelSettings(funnel.id, formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Enregistré.</p>}

          <div>
            <Label htmlFor="name">Nom interne du tunnel</Label>
            <Input id="name" name="name" defaultValue={funnel.name} required />
          </div>
          <div>
            <Label htmlFor="headline">Titre (affiché aux visiteurs)</Label>
            <Input id="headline" name="headline" defaultValue={funnel.headline} required />
          </div>
          <div>
            <Label htmlFor="subheadline">Sous-titre (optionnel)</Label>
            <Textarea id="subheadline" name="subheadline" defaultValue={funnel.subheadline ?? ""} rows={2} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="basePrice">Prix de base ($)</Label>
              <Input id="basePrice" name="basePrice" type="number" min={0} step="0.01" defaultValue={funnel.basePrice} required />
              <p className="mt-1 text-xs text-muted">Point de départ avant application des modificateurs de question.</p>
            </div>
            <div>
              <Label htmlFor="primaryColor">Couleur de marque</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue={funnel.primaryColor}
                  className="h-10 w-10 rounded border border-border"
                  onChange={(e) => {
                    const input = document.getElementById("primaryColor") as HTMLInputElement | null;
                    if (input) input.value = e.target.value;
                  }}
                />
                <Input id="primaryColor" name="primaryColor" defaultValue={funnel.primaryColor} required className="flex-1" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="logoUrl">URL du logo (optionnel)</Label>
            <Input id="logoUrl" name="logoUrl" type="url" defaultValue={funnel.logoUrl ?? ""} placeholder="https://…" />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer les paramètres"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
