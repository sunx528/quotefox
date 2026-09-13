import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { LeadStatusSelect } from "@/components/dashboard/lead-status-select";
import { DeleteLeadButton } from "@/components/dashboard/delete-lead-button";
import { ArrowLeft, Paperclip } from "lucide-react";

type QuestionOption = { id: string; label: string; value: string };

/**
 * Renders a raw stored answer for display. Choice questions store the
 * option's internal `value` (e.g. "option_a") in the answer — this resolves
 * it back to the human label ("Option A") the funnel owner actually typed,
 * so the lead detail page never shows internal slugs to a real user.
 */
function formatAnswer(value: unknown, options: unknown, type: string): string {
  const optionList = Array.isArray(options) ? (options as QuestionOption[]) : null;
  const labelFor = (raw: unknown) => optionList?.find((o) => o.value === raw)?.label ?? String(raw);

  if (Array.isArray(value)) {
    return value.map(labelFor).join(", ");
  }
  if (optionList) {
    return labelFor(value);
  }
  if (type === "date" && typeof value === "string" && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString("fr-FR");
  }
  return String(value);
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      funnel: { select: { name: true } },
      answers: { include: { question: true } },
      files: true,
    },
  });

  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux prospects
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{lead.name || "Prospect sans nom"}</h1>
          <p className="mt-1 text-sm text-muted">Depuis {lead.funnel.name} · {lead.createdAt.toLocaleString("fr-FR")}</p>
        </div>
        <LeadStatusSelect leadId={lead.id} status={lead.status} />
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted">E-mail</p>
            <p className="mt-1 text-sm text-foreground">{lead.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted">Téléphone</p>
            <p className="mt-1 text-sm text-foreground">{lead.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted">Estimation</p>
            <p className="mt-1 text-sm text-foreground">
              {lead.estimateLow.toLocaleString()}–{lead.estimateHigh.toLocaleString()} $
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-5">
          <h2 className="font-medium text-foreground">Réponses</h2>
          <dl className="mt-3 divide-y divide-border">
            {lead.answers.map((a) => (
              <div key={a.id} className="py-2.5">
                <dt className="text-xs text-muted">{a.question.label}</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {formatAnswer(a.value, a.question.options, a.question.type)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {lead.files.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-5">
            <h2 className="font-medium text-foreground">Pièces jointes</h2>
            <ul className="mt-3 space-y-2">
              {lead.files.map((f) => (
                <li key={f.id}>
                  <a href={`/api/uploads/${f.id}`} target="_blank" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
                    <Paperclip className="h-4 w-4" /> {f.filename}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <DeleteLeadButton leadId={lead.id} />
      </div>
    </div>
  );
}
