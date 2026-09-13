"use client";

import { useState, useTransition } from "react";
import { openBillingPortal } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

export function PortalButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await openBillingPortal();
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'espace de facturation n'est pas disponible pour le moment.");
            }
          })
        }
      >
        {isPending ? "Ouverture…" : "Gérer la facturation"}
      </Button>
    </div>
  );
}
