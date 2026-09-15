"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUS_LABELS } from "@/lib/labels";

const STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "text-blue-700 dark:text-blue-300",
  contacted: "text-amber-700 dark:text-amber-300",
  qualified: "text-purple-700 dark:text-purple-300",
  won: "text-emerald-700 dark:text-emerald-300",
  lost: "text-red-700 dark:text-red-300",
};

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        startTransition(async () => {
          await updateLeadStatus(leadId, e.target.value);
          router.refresh();
        });
      }}
      className={`cursor-pointer rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium transition-colors hover:bg-black/[0.03] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand dark:hover:bg-white/[0.04] ${STATUS_COLORS[status] ?? ""}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {LEAD_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
