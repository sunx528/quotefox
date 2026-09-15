import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { Settings } from "lucide-react";
import { PLAN_LABELS, label } from "@/lib/labels";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { AccountMenu } from "@/components/dashboard/account-menu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [org, sub] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.organizationId } }),
    prisma.subscription.findUnique({ where: { organizationId: user.organizationId } }),
  ]);

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface sm:flex">
        <div className="flex h-16 items-center gap-2 px-5 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
          Quotefox
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <SidebarNav />
        </nav>
        <AccountMenu orgName={org?.name ?? ""} planLabel={label(PLAN_LABELS, sub?.plan ?? "free")} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:hidden">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">Q</span>
            Quotefox
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings" className="text-muted hover:text-foreground" aria-label="Paramètres">
              <Settings className="h-5 w-5" />
            </Link>
            <form action={logoutAction}>
              <button className="text-sm text-muted">Se déconnecter</button>
            </form>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 sm:hidden">
          <SidebarNav variant="horizontal" />
        </nav>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
