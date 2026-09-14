import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { FunnelRowActions } from "@/components/dashboard/funnel-row-actions";
import { Plus, ExternalLink, FileQuestion, Users2 } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tunnels</h1>
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
            <Card key={f.id} className="transition-colors hover:border-brand/30">
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/funnels/${f.id}`} className="truncate text-base font-semibold text-foreground hover:underline">
                      {f.name}
                    </Link>
                    <Badge tone={f.status === "published" ? "success" : "default"} className="shrink-0">
                      {label(FUNNEL_STATUS_LABELS, f.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5" />
                      {f._count.questions} question{f._count.questions === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users2 className="h-3.5 w-3.5" />
                      {f._count.leads} prospect{f._count.leads === 1 ? "" : "s"}
                    </span>
                    {f.status === "published" && (
                      <a
                        href={`/q/${f.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                      >
                        voir la page publique <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
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
