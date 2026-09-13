"use client";

import { useState, useTransition } from "react";
import { startCheckout } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

export function CheckoutButton({ plan, disabled }: { plan: "pro" | "business"; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <Button
        className="w-full"
        disabled={isPending || disabled}
        onClick={() =>
          startTransition(async () => {
            try {
              await startCheckout(plan);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Le paiement n'est pas disponible pour le moment.");
            }
          })
        }
      >
        {isPending ? "Redirection…" : `Passer à ${plan === "pro" ? "Pro" : "Business"}`}
      </Button>
    </div>
  );
}
