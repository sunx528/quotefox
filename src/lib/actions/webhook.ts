"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PLAN_LIMITS, type Plan } from "@/lib/enums";

const urlSchema = z.object({ webhookUrl: z.string().trim().url().max(500) });

async function requireBusinessPlan(organizationId: string) {
  const sub = await prisma.subscription.findUnique({ where: { organizationId } });
  const plan = (sub?.plan as Plan) ?? "free";
  if (!PLAN_LIMITS[plan].webhooks) {
    throw new Error("Les webhooks sont disponibles sur le forfait Business.");
  }
}

export async function saveWebhookUrl(formData: FormData) {
  const user = await requireUser();
  await requireBusinessPlan(user.organizationId);
  const parsed = urlSchema.parse({ webhookUrl: formData.get("webhookUrl") });

  const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
  const webhookSecret = org?.webhookSecret ?? randomBytes(24).toString("hex");

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { webhookUrl: parsed.webhookUrl, webhookSecret },
  });

  revalidatePath("/dashboard/billing");
}

export async function regenerateWebhookSecret() {
  const user = await requireUser();
  await requireBusinessPlan(user.organizationId);
  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { webhookSecret: randomBytes(24).toString("hex") },
  });
  revalidatePath("/dashboard/billing");
}

export async function removeWebhook() {
  const user = await requireUser();
  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { webhookUrl: null, webhookSecret: null },
  });
  revalidatePath("/dashboard/billing");
}
