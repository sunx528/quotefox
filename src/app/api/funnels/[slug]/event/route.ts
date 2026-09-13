import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { analyticsEventTypeSchema } from "@/lib/enums";

const bodySchema = z.object({
  type: analyticsEventTypeSchema,
  sessionId: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const ip = clientIp(req);
  if (!checkRateLimit(`event:${ip}`, 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const funnel = await prisma.funnel.findUnique({ where: { slug }, select: { id: true, organizationId: true, status: true } });
  if (!funnel || funnel.status !== "published") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.analyticsEvent.create({
    data: {
      funnelId: funnel.id,
      organizationId: funnel.organizationId,
      type: parsed.data.type,
      sessionId: parsed.data.sessionId,
      metadata: (parsed.data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
