import "server-only";
import { createHmac } from "crypto";
import { prisma } from "./prisma";

/**
 * Delivers a lead.created event to the organization's configured webhook URL,
 * if any, with an HMAC-SHA256 signature so the receiver can verify authenticity
 * (mirrors the pattern Stripe itself uses for outbound webhooks). Delivery is
 * best-effort and logged to WebhookDelivery — a single attempt, no retry queue,
 * which is an explicit scope limit documented in the README.
 */
export async function deliverLeadWebhook(organizationId: string, lead: Record<string, unknown>): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { webhookUrl: true, webhookSecret: true },
  });
  if (!org?.webhookUrl || !org.webhookSecret) return;

  const payload = JSON.stringify({ event: "lead.created", data: lead });
  const signature = createHmac("sha256", org.webhookSecret).update(payload).digest("hex");

  try {
    const res = await fetch(org.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Quotefox-Signature": signature },
      body: payload,
      signal: AbortSignal.timeout(8000),
    });

    await prisma.webhookDelivery.create({
      data: {
        organizationId,
        leadId: String(lead.id),
        url: org.webhookUrl,
        statusCode: res.status,
        success: res.ok,
        error: res.ok ? null : `HTTP ${res.status}`,
      },
    });
  } catch (err) {
    await prisma.webhookDelivery.create({
      data: {
        organizationId,
        leadId: String(lead.id),
        url: org.webhookUrl,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
    });
  }
}
