import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicFunnelRunner } from "@/components/public-funnel/public-funnel-runner";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const funnel = await prisma.funnel.findUnique({ where: { slug }, select: { headline: true, organization: { select: { name: true } } } });
  if (!funnel) return {};
  return {
    title: `${funnel.headline} — ${funnel.organization.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicFunnelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const funnel = await prisma.funnel.findUnique({
    where: { slug },
    include: {
      questions: { orderBy: { order: "asc" } },
      logicRules: true,
      pricingRules: true,
      organization: { select: { name: true } },
    },
  });

  if (!funnel || funnel.status !== "published") notFound();

  return <PublicFunnelRunner funnel={JSON.parse(JSON.stringify(funnel))} />;
}
