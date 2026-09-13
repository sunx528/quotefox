// Development-only seed data — clearly fictional, never run against production.
// Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { FUNNEL_TEMPLATES } from "../src/lib/templates";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@quotefox.example";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Demo user ${email} already exists — skipping seed.`);
    return;
  }

  const organization = await prisma.organization.create({
    data: { name: "Toiture Rivière (démo)" },
  });

  await prisma.subscription.create({
    data: { organizationId: organization.id, plan: "pro", status: "active" },
  });

  await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: "Propriétaire Démo",
      email,
      passwordHash: await bcrypt.hash("quotefox-demo", 12),
      role: "owner",
    },
  });

  const template = FUNNEL_TEMPLATES.find((t) => t.key === "roofing")!;
  const funnel = await prisma.funnel.create({
    data: {
      organizationId: organization.id,
      name: "Devis remplacement de toiture",
      slug: slugify("Devis remplacement de toiture demo"),
      trade: "roofing",
      status: "published",
      headline: template.headline,
      subheadline: template.subheadline,
      basePrice: template.basePrice,
    },
  });

  const questionIds: string[] = [];
  for (let i = 0; i < template.questions.length; i++) {
    const tq = template.questions[i];
    const q = await prisma.question.create({
      data: {
        funnelId: funnel.id,
        order: i,
        type: tq.type,
        label: tq.label,
        helpText: tq.helpText,
        required: tq.required,
        options: tq.options ?? undefined,
      },
    });
    questionIds.push(q.id);

    if (tq.options) {
      for (const opt of tq.options) {
        if (opt.priceModifier) {
          await prisma.pricingRule.create({
            data: {
              funnelId: funnel.id,
              questionId: q.id,
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
      await prisma.pricingRule.create({
        data: {
          funnelId: funnel.id,
          questionId: q.id,
          modifierType: "per_unit",
          modifierValue: tq.perUnitRate,
          description: `${tq.label} : par unité`,
        },
      });
    }
  }

  const sampleLeads = [
    { name: "Alex Chen", email: "alex.chen@example.com", phone: "555-0101", status: "new", estimateLow: 6800, estimateHigh: 9200 },
    { name: "Jordan Lee", email: "jordan.lee@example.com", phone: "555-0102", status: "contacted", estimateLow: 11000, estimateHigh: 14500 },
    { name: "Sam Patel", email: "sam.patel@example.com", phone: "555-0103", status: "won", estimateLow: 4200, estimateHigh: 5600 },
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.create({
      data: {
        funnelId: funnel.id,
        organizationId: organization.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        estimateLow: lead.estimateLow,
        estimateHigh: lead.estimateHigh,
        source: "direct",
      },
    });
  }

  for (const type of ["view", "view", "view", "start", "start", "completion", "lead"] as const) {
    await prisma.analyticsEvent.create({
      data: { funnelId: funnel.id, organizationId: organization.id, type, sessionId: `seed-${Math.random()}` },
    });
  }

  console.log("Seed complete.");
  console.log(`  Log in at /login with: ${email} / quotefox-demo`);
  console.log(`  Public funnel: /q/${funnel.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
