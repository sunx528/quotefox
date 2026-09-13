import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LEAD_STATUS_LABELS, label } from "@/lib/labels";

function csvEscape(value: string): string {
  // Neutralize CSV/Excel formula injection: a lead-supplied field starting with
  // =, +, -, or @ would otherwise be interpreted as a formula by Excel/Sheets
  // when the exported file is opened.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

  const leads = await prisma.lead.findMany({
    where: { organizationId: user.organizationId },
    include: { funnel: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Date", "Tunnel", "Nom", "E-mail", "Téléphone", "Estimation basse", "Estimation haute", "Statut"];
  const rows = leads.map((l) =>
    [
      l.createdAt.toLocaleString("fr-FR"),
      l.funnel.name,
      l.name ?? "",
      l.email ?? "",
      l.phone ?? "",
      String(l.estimateLow),
      String(l.estimateHigh),
      label(LEAD_STATUS_LABELS, l.status),
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="quotefox-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
