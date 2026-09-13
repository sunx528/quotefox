"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import type { BuilderFunnel } from "./types";

function CopyBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-black/[0.04] p-4 text-xs text-foreground dark:bg-white/[0.06]">
        <code>{value}</code>
      </pre>
      <Button
        size="sm"
        variant="secondary"
        className="absolute right-2 top-2"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copié" : "Copier"}
      </Button>
    </div>
  );
}

export function SharePanel({ funnel }: { funnel: BuilderFunnel }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const publicUrl = `${appUrl}/q/${funnel.slug}`;
  const embed = `<iframe src="${publicUrl}?embed=1" style="width:100%;max-width:640px;height:720px;border:0;" title="Formulaire de devis ${funnel.name}"></iframe>`;

  if (funnel.status !== "published") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted">
          Publiez ce tunnel pour obtenir son lien public et son extrait à intégrer.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-medium text-foreground">Lien public</h3>
          <p className="mt-1 text-sm text-muted">Partagez-le directement, dans des publicités, ou depuis votre site.</p>
          <div className="mt-3">
            <CopyBlock value={publicUrl} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-medium text-foreground">Intégrer sur votre site</h3>
          <p className="mt-1 text-sm text-muted">Collez cet extrait n&apos;importe où dans le HTML de votre site.</p>
          <div className="mt-3">
            <CopyBlock value={embed} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
