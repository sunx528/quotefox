import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { Eye, MousePointerClick, CheckCircle2, Users2, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Statistiques" };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const funnels = await prisma.funnel.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true },
  });

  const events = await prisma.analyticsEvent.groupBy({
    by: ["funnelId", "type"],
    where: { organizationId: user.organizationId },
    _count: { _all: true },
  });

  const countFor = (funnelId: string, type: string) =>
    events.find((e) => e.funnelId === funnelId && e.type === type)?._count._all ?? 0;

  const rows = funnels.map((f) => {
    const views = countFor(f.id, "view");
    const starts = countFor(f.id, "start");
    const completions = countFor(f.id, "completion");
    const leads = countFor(f.id, "lead");
    return {
      name: f.name,
      views,
      starts,
      completions,
      leads,
      startRate: views ? Math.round((starts / views) * 100) : 0,
      completionRate: starts ? Math.round((completions / starts) * 100) : 0,
      leadRate: views ? Math.round((leads / views) * 100) : 0,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({ views: acc.views + r.views, starts: acc.starts + r.starts, completions: acc.completions + r.completions, leads: acc.leads + r.leads }),
    { views: 0, starts: 0, completions: 0, leads: 0 }
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Statistiques</h1>
      <p className="mt-1 text-sm text-muted">Comment vos tunnels publiés convertissent.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {(
          [
            ["Vues", totals.views, Eye],
            ["Démarrages", totals.starts, MousePointerClick],
            ["Terminés", totals.completions, CheckCircle2],
            ["Prospects", totals.leads, Users2],
          ] as [string, number, LucideIcon][]
        ).map(([label, value, Icon]) => (
          <Card key={label} className="transition-colors hover:border-brand/30">
            <CardContent className="flex items-start justify-between pt-5">
              <div>
                <p className="text-xs font-medium uppercase text-muted">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-dark dark:text-orange-300">
                <Icon className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-5">
            <AnalyticsChart data={rows.map((r) => ({ name: r.name, views: r.views, leads: r.leads }))} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardContent className="overflow-x-auto pt-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs font-medium uppercase text-muted">
              <tr>
                <th className="py-2">Tunnel</th>
                <th className="py-2">Vues</th>
                <th className="py-2">Démarrages</th>
                <th className="py-2">Terminés</th>
                <th className="py-2">Prospects</th>
                <th className="py-2">Vue → Prospect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="py-2.5 font-medium text-foreground">{r.name}</td>
                  <td className="py-2.5 text-muted">{r.views}</td>
                  <td className="py-2.5 text-muted">{r.starts}</td>
                  <td className="py-2.5 text-muted">{r.completions}</td>
                  <td className="py-2.5 text-muted">{r.leads}</td>
                  <td className="py-2.5 text-foreground">{r.leadRate}%</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    Pas encore de données — publiez un tunnel pour commencer le suivi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
