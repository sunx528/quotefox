"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LayoutGrid, Users2, BarChart3, CreditCard, type LucideIcon } from "lucide-react";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard/funnels", label: "Tunnels", icon: LayoutGrid },
  { href: "/dashboard/leads", label: "Prospects", icon: Users2 },
  { href: "/dashboard/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Facturation", icon: CreditCard },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ variant = "vertical" }: { variant?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  if (variant === "horizontal") {
    return (
      <>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
                active ? "bg-brand/10 text-brand-dark dark:text-orange-300" : "text-muted hover:bg-black/[0.04]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand/10 text-brand-dark dark:bg-brand/15 dark:text-orange-300"
                : "text-muted hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
