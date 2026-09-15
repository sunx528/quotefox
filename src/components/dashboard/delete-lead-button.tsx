"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLead } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="danger"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Supprimer définitivement ce prospect ?")) return;
        startTransition(async () => {
          await deleteLead(leadId);
          router.push("/dashboard/leads");
        });
      }}
    >
      <Trash2 className="h-4 w-4" /> {isPending ? "Suppression…" : "Supprimer le prospect"}
    </Button>
  );
}
