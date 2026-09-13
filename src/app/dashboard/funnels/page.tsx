import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { FunnelRowActions } from "@/components/dashboard/funnel-row-actions";
import { Plus, ExternalLink } from "lucide-react";
import { FUNNEL_STATUS_LABELS, label } from "@/lib/labels";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tunnels" };

export default async function FunnelsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const funnels = await prisma.funnel.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, leads: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tunnels</h1>
          <p className="mt-1 text-sm text-muted">Créez et publiez des tunnels de devis pour votre site.</p>
        </div>
        <Link href="/dashboard/funnels/new">
          <Button>
            <Plus className="h-4 w-4" /> Nouveau tunnel
          </Button>
        </Link>
      </div>

      {funnels.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-medium text-foreground">Aucun tunnel pour l&apos;instant</p>
            <p className="max-w-sm text-sm text-muted">
              Créez votre premier tunnel de devis à partir d&apos;un modèle métier — vous pouvez le publier en moins de 5 minutes.
            </p>
            <Link href="/dashboard/funnels/new">
              <Button>
                <Plus className="h-4 w-4" /> Créer votre premier tunnel
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {funnels.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/funnels/${f.id}`} className="truncate font-medium text-foreground hover:underline">
                      {f.name}
                    </Link>
                    <Badge tone={f.status === "published" ? "success" : "default"}>
                      {label(FUNNEL_STATUS_LABELS, f.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {f._count.questions} question{f._count.questions === 1 ? "" : "s"} · {f._count.leads} prospect
                    {f._count.leads === 1 ? "" : "s"}
                    {f.status === "published" && (
                      <>
                        {" · "}
                        <Link href={`/q/${f.slug}`} target="_blank" className="inline-flex items-center gap-1 hover:text-foreground">
                          voir la page publique <ExternalLink className="h-3 w-3" />
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <FunnelRowActions funnelId={f.id} status={f.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
