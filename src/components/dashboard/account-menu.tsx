"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/card";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function AccountMenu({ orgName, planLabel }: { orgName: string; planLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{orgName}</p>
          <Badge tone="brand" className="mt-1.5">Forfait {planLabel}</Badge>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
          >
            <Settings className="h-4 w-4" /> Paramètres
          </Link>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]">
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
