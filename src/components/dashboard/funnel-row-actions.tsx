"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishFunnel, unpublishFunnel, duplicateFunnel, deleteFunnel } from "@/lib/actions/funnels";
import { Button } from "@/components/ui/button";

export function FunnelRowActions({ funnelId, status }: { funnelId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      {status === "published" ? (
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => run(() => unpublishFunnel(funnelId))}>
          Dépublier
        </Button>
      ) : (
        <Button size="sm" disabled={isPending} onClick={() => run(() => publishFunnel(funnelId))}>
          Publier
        </Button>
      )}
      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => run(() => duplicateFunnel(funnelId))}>
        Dupliquer
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={isPending}
        onClick={() => {
          if (confirm("Supprimer ce tunnel et tous ses prospects ? Cette action est irréversible.")) {
            run(() => deleteFunnel(funnelId));
          }
        }}
      >
        Supprimer
      </Button>
    </div>
  );
}
