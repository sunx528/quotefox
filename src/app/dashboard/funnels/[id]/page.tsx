import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FunnelBuilder } from "@/components/funnel-builder/funnel-builder";

export default async function FunnelBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const funnel = await prisma.funnel.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      questions: { orderBy: { order: "asc" } },
      logicRules: true,
      pricingRules: true,
    },
  });

  if (!funnel) notFound();

  return <FunnelBuilder funnel={JSON.parse(JSON.stringify(funnel))} />;
}
