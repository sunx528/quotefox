"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { questionTypeSchema } from "@/lib/enums";

async function requireFunnelOwnership(funnelId: string, organizationId: string) {
  const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, organizationId } });
  if (!funnel) throw new Error("Tunnel introuvable ou vous n'y avez pas accès.");
  return funnel;
}

/**
 * Keeps PricingRule rows in sync with the "+$ prix" modifier set directly on an
 * option in the question editor (the shortcut the Questions tab advertises).
 * Only ever touches "flat" rules that are tied to one of this question's current
 * option values — a rule the user created by hand in the Pricing tab (a global
 * rule, a percent/per_unit rule, or one on an option that no longer exists) is
 * never modified or deleted here.
 */
async function syncOptionPricingRules(
  funnelId: string,
  questionId: string,
  options: { value: string; label: string; priceModifier?: number }[] | null | undefined
) {
  const existingRules = await prisma.pricingRule.findMany({
    where: { funnelId, questionId, modifierType: "flat", optionValue: { not: null } },
  });

  for (const opt of options ?? []) {
    if (!opt.priceModifier) continue;
    const existing = existingRules.find((r) => r.optionValue === opt.value);
    if (existing) {
      if (existing.modifierValue !== opt.priceModifier) {
        await prisma.pricingRule.update({ where: { id: existing.id }, data: { modifierValue: opt.priceModifier } });
      }
    } else {
      await prisma.pricingRule.create({
        data: {
          funnelId,
          questionId,
          optionValue: opt.value,
          modifierType: "flat",
          modifierValue: opt.priceModifier,
          description: `Option : ${opt.label}`,
        },
      });
    }
  }
}

const optionSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(100),
  priceModifier: z.number().optional(),
});

const questionInputSchema = z.object({
  type: questionTypeSchema,
  label: z.string().trim().min(1, "L'intitulé de la question est requis").max(300),
  helpText: z.string().trim().max(300).optional().nullable(),
  required: z.boolean(),
  options: z.array(optionSchema).optional().nullable(),
});

export async function addQuestion(funnelId: string, input: z.infer<typeof questionInputSchema>) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  const parsed = questionInputSchema.parse(input);

  const maxOrder = await prisma.question.aggregate({
    where: { funnelId },
    _max: { order: true },
  });

  const question = await prisma.question.create({
    data: {
      funnelId,
      order: (maxOrder._max.order ?? -1) + 1,
      type: parsed.type,
      label: parsed.label,
      helpText: parsed.helpText || null,
      required: parsed.required,
      options: parsed.options ?? undefined,
    },
  });

  await syncOptionPricingRules(funnelId, question.id, parsed.options);

  revalidatePath(`/dashboard/funnels/${funnelId}`);
  return question;
}

export async function updateQuestion(
  funnelId: string,
  questionId: string,
  input: z.infer<typeof questionInputSchema>
) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  const parsed = questionInputSchema.parse(input);

  await prisma.question.update({
    where: { id: questionId, funnelId },
    data: {
      type: parsed.type,
      label: parsed.label,
      helpText: parsed.helpText || null,
      required: parsed.required,
      options: parsed.options ?? undefined,
    },
  });

  await syncOptionPricingRules(funnelId, questionId, parsed.options);

  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

export async function deleteQuestion(funnelId: string, questionId: string) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  // Cascades to logic rules targeting it, pricing rules referencing it, and lead answers.
  await prisma.question.delete({ where: { id: questionId, funnelId } });
  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

export async function reorderQuestions(funnelId: string, orderedIds: string[]) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.question.update({ where: { id, funnelId }, data: { order: index } })
    )
  );

  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

const conditionSchema = z.object({
  questionId: z.string(),
  operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than"]),
  value: z.unknown(),
});

const logicRuleInputSchema = z.object({
  targetQuestionId: z.string(),
  action: z.enum(["show", "hide"]),
  logicType: z.enum(["all", "any"]),
  conditions: z.array(conditionSchema).min(1, "Ajoutez au moins une condition"),
});

export async function upsertLogicRule(
  funnelId: string,
  ruleId: string | null,
  input: z.infer<typeof logicRuleInputSchema>
) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  const parsed = logicRuleInputSchema.parse(input);

  // Guard against a rule whose target question would be conditioned on itself.
  if (parsed.conditions.some((c) => c.questionId === parsed.targetQuestionId)) {
    throw new Error("La visibilité d'une question ne peut pas dépendre de sa propre réponse.");
  }

  if (ruleId) {
    await prisma.logicRule.update({
      where: { id: ruleId, funnelId },
      data: {
        targetQuestionId: parsed.targetQuestionId,
        action: parsed.action,
        logicType: parsed.logicType,
        conditions: parsed.conditions as unknown as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.logicRule.create({
      data: {
        funnelId,
        targetQuestionId: parsed.targetQuestionId,
        action: parsed.action,
        logicType: parsed.logicType,
        conditions: parsed.conditions as unknown as Prisma.InputJsonValue,
      },
    });
  }

  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

export async function deleteLogicRule(funnelId: string, ruleId: string) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  await prisma.logicRule.delete({ where: { id: ruleId, funnelId } });
  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

const pricingRuleInputSchema = z.object({
  questionId: z.string().nullable(),
  optionValue: z.string().nullable(),
  modifierType: z.enum(["flat", "percent", "per_unit"]),
  modifierValue: z.number(),
  description: z.string().trim().max(200).optional().nullable(),
});

export async function upsertPricingRule(
  funnelId: string,
  ruleId: string | null,
  input: z.infer<typeof pricingRuleInputSchema>
) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  const parsed = pricingRuleInputSchema.parse(input);

  if (ruleId) {
    await prisma.pricingRule.update({
      where: { id: ruleId, funnelId },
      data: { ...parsed, description: parsed.description || null },
    });
  } else {
    const maxOrder = await prisma.pricingRule.aggregate({ where: { funnelId }, _max: { order: true } });
    await prisma.pricingRule.create({
      data: {
        funnelId,
        ...parsed,
        description: parsed.description || null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  revalidatePath(`/dashboard/funnels/${funnelId}`);
}

export async function deletePricingRule(funnelId: string, ruleId: string) {
  const user = await requireUser();
  await requireFunnelOwnership(funnelId, user.organizationId);
  await prisma.pricingRule.delete({ where: { id: ruleId, funnelId } });
  revalidatePath(`/dashboard/funnels/${funnelId}`);
}
