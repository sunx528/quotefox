import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeadStatusSelect } from "@/components/dashboard/lead-status-select";
import { Download, Users2 } from "lucide-react";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Prospects" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; funnel?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { q, status, funnel } = await searchParams;

  const [leads, funnels] = await Promise.all([
    prisma.lead.findMany({
      where: {
        organizationId: user.organizationId,
        ...(status ? { status } : {}),
        ...(funnel ? { funnelId: funnel } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      include: { funnel: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.funnel.findMany({ where: { organizationId: user.organizationId }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Prospects</h1>
          <p className="mt-1 text-sm text-muted">{leads.length} prospect{leads.length === 1 ? "" : "s"}</p>
        </div>
        <a href="/api/leads/export">
          <Button variant="secondary">
            <Download className="h-4 w-4" /> Exporter en CSV
          </Button>
        </a>
      </div>

      <form className="mt-6 flex flex-wrap gap-3">
        <Input name="q" defaultValue={q} placeholder="Rechercher nom, e-mail, téléphone…" className="max-w-xs" />
        <Select name="status" defaultValue={status ?? ""} className="max-w-[160px]">
          <option value="">Tous les statuts</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </Select>
        <Select name="funnel" defaultValue={funnel ?? ""} className="max-w-[200px]">
          <option value="">Tous les tunnels</option>
          {funnels.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
      </form>

      {leads.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand-dark dark:text-orange-300">
              <Users2 className="h-6 w-6" />
            </span>
            <p className="max-w-sm text-sm text-muted">
              Aucun prospect pour l&apos;instant. Publiez un tunnel et partagez son lien pour commencer à en recevoir.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-black/[0.02] text-left text-xs font-medium uppercase text-muted dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Tunnel</th>
                <th className="px-4 py-3">Estimation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Reçu le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/leads/${lead.id}`} className="font-medium text-foreground hover:underline">
                      {lead.name || "Sans nom"}
                    </Link>
                    <p className="text-xs text-muted">{lead.email || lead.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{lead.funnel.name}</td>
                  <td className="px-4 py-3 text-foreground">
                    {lead.estimateLow.toLocaleString()}–{lead.estimateHigh.toLocaleString()} $
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusSelect leadId={lead.id} status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{lead.createdAt.toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
