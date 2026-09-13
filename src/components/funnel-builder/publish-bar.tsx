"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishFunnel, unpublishFunnel } from "@/lib/actions/funnels";
import { Button } from "@/components/ui/button";

export function PublishBar({
  funnelId,
  status,
  questionCount,
}: {
  funnelId: string;
  status: string;
  questionCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggle() {
    setError(null);
    startTransition(async () => {
      try {
        if (status === "published") {
          await unpublishFunnel(funnelId);
        } else {
          await publishFunnel(funnelId);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-600">{error}</span>}
      {status !== "published" && questionCount === 0 && (
        <span className="text-xs text-muted">Ajoutez une question pour publier</span>
      )}
      <Button
        variant={status === "published" ? "secondary" : "primary"}
        disabled={isPending || (status !== "published" && questionCount === 0)}
        onClick={toggle}
      >
        {status === "published" ? "Dépublier" : "Publier"}
      </Button>
    </div>
  );
}
