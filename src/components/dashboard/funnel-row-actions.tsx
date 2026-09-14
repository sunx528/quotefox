"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishFunnel, unpublishFunnel, duplicateFunnel, deleteFunnel } from "@/lib/actions/funnels";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, EyeOff, Copy, Trash2 } from "lucide-react";

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
    <div className="flex shrink-0 items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <DropdownMenu trigger={<MoreHorizontal className="h-4 w-4" />}>
        {status === "published" ? (
          <DropdownMenuItem disabled={isPending} onClick={() => run(() => unpublishFunnel(funnelId))}>
            <EyeOff className="h-4 w-4" /> Dépublier
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={isPending} onClick={() => run(() => publishFunnel(funnelId))}>
            <Eye className="h-4 w-4" /> Publier
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={isPending} onClick={() => run(() => duplicateFunnel(funnelId))}>
          <Copy className="h-4 w-4" /> Dupliquer
        </DropdownMenuItem>
        <DropdownMenuItem
          danger
          disabled={isPending}
          onClick={() => {
            if (confirm("Supprimer ce tunnel et tous ses prospects ? Cette action est irréversible.")) {
              run(() => deleteFunnel(funnelId));
            }
          }}
        >
          <Trash2 className="h-4 w-4" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  );
}
