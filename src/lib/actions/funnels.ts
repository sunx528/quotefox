"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { PLAN_LIMITS, type Plan } from "@/lib/enums";
import { getTemplate } from "@/lib/templates";
import { deleteUploadedFile } from "@/lib/storage";

async function requireFunnelOwnership(funnelId: string, organizationId: string) {
  const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, organizationId } });
  if (!funnel) throw new Error("Tunnel introuvable ou vous n'y avez pas accès.");
  return funnel;
}

async function getOrgPlan(organizationId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { organizationId } });
  return (sub?.plan as Plan) ?? "free";
}

const createFunnelSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100),
  templateKey: z.string().trim().max(60).default("blank"),
});

export async function createFunnel(formData: FormData) {
  const user = await requireUser();
  const parsed = createFunnelSchema.parse({
    name: formData.get("name"),
    templateKey: formData.get("templateKey") || "blank",
  });

  const plan = await getOrgPlan(user.organizationId);
  const existingCount = await prisma.funnel.count({ where: { organizationId: user.organizationId } });
  if (existingCount >= PLAN_LIMITS[plan].funnels) {
    throw new Error(
      `Votre forfait ${plan} autorise jusqu'à ${PLAN_LIMITS[plan].funnels} tunnel(s). Passez à un forfait supérieur pour en créer un autre.`
    );
  }

  const template = getTemplate(parsed.templateKey);

  const funnel = await prisma.$transaction(async (tx) => {
    const created = await tx.funnel.create({
      data: {
        organizationId: user.organizationId,
        name: parsed.name,
        trade: template.key === "blank" ? null : template.key,
        slug: slugify(parsed.name),
        headline: template.headline,
        subheadline: template.subheadline || null,
        basePrice: template.basePrice,
      },
    });

    for (let i = 0; i < template.questions.length; i++) {
      const tq = template.questions[i];
      const question = await tx.question.create({
        data: {
          funnelId: created.id,
          order: i,
          type: tq.type,
          label: tq.label,
          helpText: tq.helpText,
          required: tq.required,
          options: tq.options ?? undefined,
        },
      });

      if (tq.options) {
        for (const opt of tq.options) {
          if (opt.priceModifier) {
            await tx.pricingRule.create({
              data: {
                funnelId: created.id,
                questionId: question.id,
                optionValue: opt.value,
                modifierType: "flat",
                modifierValue: opt.priceModifier,
                description: `${tq.label} : ${opt.label}`,
              },
            });
          }
        }
      }

      if (tq.perUnitRate) {
        await tx.pricingRule.create({
          data: {
            funnelId: created.id,
            questionId: question.id,
            optionValue: null,
            modifierType: "per_unit",
            modifierValue: tq.perUnitRate,
            description: `${tq.label} : par unité`,
          },
        });
      }
    }

    return created;
  });

  revalidatePath("/dashboard/funnels");
  redirect(`/dashboard/funnels/${funnel.id}`);
}

const updateSettingsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  headline: z.string().trim().min(1).max(160),
  subheadline: z.string().trim().max(300).optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Utilisez une couleur hexadécimale comme #ea580c"),
  basePrice: z.coerce.number().min(0).max(1_000_000),
  logoUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
});

export async function updateFunnelSettings(funnelId: string, formData: FormData) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);

  const parsed = updateSettingsSchema.parse({
    name: formData.get("name"),
    headline: formData.get("headline"),
    subheadline: formData.get("subheadline") || null,
    primaryColor: formData.get("primaryColor"),
    basePrice: formData.get("basePrice"),
    logoUrl: formData.get("logoUrl") || null,
  });

  await prisma.funnel.update({
    where: { id: funnelId },
    data: {
      name: parsed.name,
      headline: parsed.headline,
      subheadline: parsed.subheadline || null,
      primaryColor: parsed.primaryColor,
      basePrice: parsed.basePrice,
      logoUrl: parsed.logoUrl || null,
    },
  });

  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

export async function publishFunnel(funnelId: string) {
  const user = await requireUser();
  const funnel = await requireFunnelOwnership(funnelId, user.organizationId);

  const questionCount = await prisma.question.count({ where: { funnelId } });
  if (questionCount === 0) {
    throw new Error("Ajoutez au moins une question avant de publier.");
  }

  await prisma.funnel.update({ where: { id: funnel.id }, data: { status: "published" } });
  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

export async function unpublishFunnel(funnelId: string) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  await prisma.funnel.update({ where: { id: funnelId }, data: { status: "draft" } });
  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

export async function duplicateFunnel(funnelId: string) {
  const user = await requireUser();
  const source = await prisma.funnel.findFirst({
    where: { id: funnelId, organizationId: user.organizationId },
    include: { questions: true, logicRules: true, pricingRules: true },
  });
  if (!source) throw new Error("Tunnel introuvable.");

  const plan = await getOrgPlan(user.organizationId);
  const existingCount = await prisma.funnel.count({ where: { organizationId: user.organizationId } });
  if (existingCount >= PLAN_LIMITS[plan].funnels) {
    throw new Error(`Votre forfait ${plan} autorise jusqu'à ${PLAN_LIMITS[plan].funnels} tunnel(s). Passez à un forfait supérieur pour dupliquer.`);
  }

  await prisma.$transaction(async (tx) => {
    const copy = await tx.funnel.create({
      data: {
        organizationId: user.organizationId,
        name: `${source.name} (copie)`,
        slug: slugify(source.name),
        trade: source.trade,
        status: "draft",
        headline: source.headline,
        subheadline: source.subheadline,
        logoUrl: source.logoUrl,
        primaryColor: source.primaryColor,
        basePrice: source.basePrice,
        currency: source.currency,
      },
    });

    const idMap = new Map<string, string>();
    for (const q of source.questions) {
      const newQ = await tx.question.create({
        data: {
          funnelId: copy.id,
          order: q.order,
          type: q.type,
          label: q.label,
          helpText: q.helpText,
          required: q.required,
          options: q.options ?? undefined,
        },
      });
      idMap.set(q.id, newQ.id);
    }

    for (const rule of source.logicRules) {
      const newTarget = idMap.get(rule.targetQuestionId);
      if (!newTarget) continue;
      const conditions = (rule.conditions as Array<{ questionId: string; operator: string; value: unknown }>).map(
        (c) => ({ ...c, questionId: idMap.get(c.questionId) ?? c.questionId })
      );
      await tx.logicRule.create({
        data: {
          funnelId: copy.id,
          targetQuestionId: newTarget,
          action: rule.action,
          logicType: rule.logicType,
          conditions: conditions as unknown as Prisma.InputJsonValue,
        },
      });
    }

    for (const rule of source.pricingRules) {
      await tx.pricingRule.create({
        data: {
          funnelId: copy.id,
          questionId: rule.questionId ? idMap.get(rule.questionId) ?? null : null,
          optionValue: rule.optionValue,
          modifierType: rule.modifierType,
          modifierValue: rule.modifierValue,
          description: rule.description,
          order: rule.order,
        },
      });
    }
  });

  revalidatePath("/dashboard/funnels");
}

export async function deleteFunnel(funnelId: string) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);

  const files = await prisma.uploadedFile.findMany({ where: { lead: { funnelId } } });
  await prisma.funnel.delete({ where: { id: funnelId } });
  await Promise.all(files.map((f) => deleteUploadedFile(f.storagePath)));

  revalidatePath("/dashboard/funnels");
  redirect("/dashboard/funnels");
}
