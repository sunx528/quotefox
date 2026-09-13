import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveVisibleQuestions, validateAnswers, computePriceEstimate } from "@/lib/funnel-engine";
import type { EngineQuestion, LogicRule as EngineLogicRule, PricingRule as EnginePricingRule } from "@/lib/funnel-engine";
import { saveUploadedFile, FileValidationError } from "@/lib/storage";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { PLAN_LIMITS, type Plan } from "@/lib/enums";
import { sendEmail, leadNotificationEmail, leadConfirmationEmail } from "@/lib/email";
import { deliverLeadWebhook } from "@/lib/webhook";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const ip = clientIp(req);
  if (!checkRateLimit(`submit:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes. Merci de réessayer dans un instant." }, { status: 429 });
  }

  const funnel = await prisma.funnel.findUnique({
    where: { slug },
    include: { questions: true, logicRules: true, pricingRules: true, organization: { include: { subscription: true } } },
  });

  if (!funnel || funnel.status !== "published") {
    return NextResponse.json({ error: "Ce tunnel n'est pas disponible." }, { status: 404 });
  }

  // Enforce the org's monthly lead cap server-side — never trust the client.
  const plan = (funnel.organization.subscription?.plan as Plan) ?? "free";
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const leadsThisMonth = await prisma.lead.count({
    where: { organizationId: funnel.organizationId, createdAt: { gte: startOfMonth } },
  });
  if (leadsThisMonth >= PLAN_LIMITS[plan].leadsPerMonth) {
    return NextResponse.json(
      { error: "Cette entreprise a atteint sa capacité mensuelle de prospects. Merci de la contacter directement." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const answersRaw = formData.get("answers");
  if (typeof answersRaw !== "string") {
    return NextResponse.json({ error: "Réponses manquantes." }, { status: 400 });
  }

  let answers: Record<string, unknown>;
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    return NextResponse.json({ error: "Format de réponses invalide." }, { status: 400 });
  }

  const engineQuestions: EngineQuestion[] = funnel.questions.map((q) => ({
    id: q.id,
    order: q.order,
    type: q.type as EngineQuestion["type"],
    label: q.label,
    required: q.required,
    options: (q.options as EngineQuestion["options"]) ?? null,
  }));
  const engineLogicRules: EngineLogicRule[] = funnel.logicRules.map((r) => ({
    targetQuestionId: r.targetQuestionId,
    action: r.action as EngineLogicRule["action"],
    logicType: r.logicType as EngineLogicRule["logicType"],
    conditions: r.conditions as EngineLogicRule["conditions"],
  }));
  const enginePricingRules: EnginePricingRule[] = funnel.pricingRules.map((r) => ({
    questionId: r.questionId,
    optionValue: r.optionValue,
    modifierType: r.modifierType as EnginePricingRule["modifierType"],
    modifierValue: r.modifierValue,
  }));

  const visibleQuestions = resolveVisibleQuestions(engineQuestions, engineLogicRules, answers);

  const fileCounts: Record<string, number> = {};
  for (const q of visibleQuestions) {
    if (q.type !== "file") continue;
    fileCounts[q.id] = formData.getAll(`file_${q.id}`).filter((f): f is File => f instanceof File && f.size > 0).length;
  }

  const validation = validateAnswers(visibleQuestions, answers, fileCounts);
  if (!validation.valid) {
    return NextResponse.json({ error: "Certaines réponses sont invalides.", fieldErrors: validation.errors }, { status: 422 });
  }

  // Server recomputes the price — the client's displayed number is never trusted.
  const estimate = computePriceEstimate(funnel.basePrice, enginePricingRules, answers);

  const emailQuestion = visibleQuestions.find((q) => q.type === "email");
  const phoneQuestion = visibleQuestions.find((q) => q.type === "phone");
  const nameFromAnswers = Object.entries(answers).find(([qid]) => {
    const q = engineQuestions.find((eq) => eq.id === qid);
    const label = q?.label.toLowerCase() ?? "";
    // Matches both English ("Full name") and French ("Nom complet") question wording.
    // Word-boundary match on "nom" avoids false positives like "nombre" (number).
    return label.includes("name") || /\bnom\b/.test(label);
  })?.[1];

  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        funnelId: funnel.id,
        organizationId: funnel.organizationId,
        name: typeof nameFromAnswers === "string" ? nameFromAnswers : null,
        email: emailQuestion ? String(answers[emailQuestion.id] ?? "") || null : null,
        phone: phoneQuestion ? String(answers[phoneQuestion.id] ?? "") || null : null,
        estimateLow: estimate.low,
        estimateHigh: estimate.high,
        source: "direct",
      },
    });

    for (const q of visibleQuestions) {
      if (q.type === "file") continue;
      const value = answers[q.id];
      if (value === undefined) continue;
      await tx.leadAnswer.create({ data: { leadId: created.id, questionId: q.id, value: value as never } });
    }

    return created;
  });

  // File uploads are handled after the lead row exists, outside the transaction
  // (disk I/O shouldn't hold a DB transaction open).
  const fileQuestions = visibleQuestions.filter((q) => q.type === "file");
  for (const q of fileQuestions) {
    const files = formData.getAll(`file_${q.id}`).filter((f): f is File => f instanceof File && f.size > 0);
    for (const file of files.slice(0, 6)) {
      try {
        const saved = await saveUploadedFile(file);
        await prisma.uploadedFile.create({ data: { leadId: lead.id, ...saved } });
      } catch (err) {
        if (err instanceof FileValidationError) {
          console.warn(`[upload:rejected] ${err.message}`);
          continue;
        }
        throw err;
      }
    }
  }

  await prisma.analyticsEvent.create({
    data: {
      funnelId: funnel.id,
      organizationId: funnel.organizationId,
      type: "lead",
      sessionId: String(formData.get("sessionId") ?? "unknown"),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ownerUsers = await prisma.user.findMany({ where: { organizationId: funnel.organizationId } });
  for (const owner of ownerUsers) {
    const { subject, html } = leadNotificationEmail({
      funnelName: funnel.name,
      leadName: lead.name ?? "Sans nom",
      leadEmail: lead.email,
      leadPhone: lead.phone,
      estimateLow: estimate.low,
      estimateHigh: estimate.high,
      dashboardUrl: `${appUrl}/dashboard/leads`,
    });
    await sendEmail({ to: owner.email, subject, html });
  }

  if (lead.email) {
    const { subject, html } = leadConfirmationEmail({
      businessName: funnel.organization.name,
      estimateLow: estimate.low,
      estimateHigh: estimate.high,
    });
    await sendEmail({ to: lead.email, subject, html });
  }

  await deliverLeadWebhook(funnel.organizationId, {
    id: lead.id,
    funnelName: funnel.name,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    estimateLow: estimate.low,
    estimateHigh: estimate.high,
    createdAt: lead.createdAt,
  });

  return NextResponse.json({
    leadId: lead.id,
    estimateLow: estimate.low,
    estimateHigh: estimate.high,
  });
}
