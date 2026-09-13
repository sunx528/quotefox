import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Quotefox <onboarding@resend.dev>";
const resend = apiKey ? new Resend(apiKey) : null;

export type SendEmailResult = { sent: boolean; reason?: string };

/** Escapes untrusted text (e.g. visitor-submitted answers) before it goes into an HTML email body. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends via Resend when RESEND_API_KEY is configured. Without a key, logs the
 * email instead of pretending it was delivered — the UI must reflect this
 * (see callers), never surface a fake "email sent" success state.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  if (!resend) {
    // Logged in full (not just subject/recipient) so links embedded in the body —
    // e.g. a password reset URL — are actually usable in local development
    // without a Resend account.
    console.warn(
      `[email:not-configured] Would send "${params.subject}" to ${params.to}. Set RESEND_API_KEY to enable real delivery.\n--- body ---\n${params.html}\n------------`
    );
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (result.error) {
      console.error("[email:error]", result.error);
      return { sent: false, reason: result.error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email:error]", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown error" };
  }
}

export function leadNotificationEmail(params: {
  funnelName: string;
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  estimateLow: number;
  estimateHigh: number;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const name = escapeHtml(params.leadName || "Sans nom");
  const email = params.leadEmail ? escapeHtml(params.leadEmail) : "—";
  const phone = params.leadPhone ? escapeHtml(params.leadPhone) : "—";
  const safeSubjectName = (params.leadName || "Sans nom").replace(/[\r\n]+/g, " ").slice(0, 120);
  return {
    subject: `Nouveau prospect depuis ${params.funnelName} : ${safeSubjectName}`,
    html: `
      <h2>Nouveau prospect depuis ${escapeHtml(params.funnelName)}</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>E-mail :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${phone}</p>
      <p><strong>Estimation :</strong> ${params.estimateLow.toLocaleString()} $ – ${params.estimateHigh.toLocaleString()} $</p>
      <p><a href="${params.dashboardUrl}">Voir le prospect dans Quotefox</a></p>
    `,
  };
}

export function leadConfirmationEmail(params: {
  businessName: string;
  estimateLow: number;
  estimateHigh: number;
}): { subject: string; html: string } {
  return {
    subject: `Votre estimation de ${params.businessName}`,
    html: `
      <h2>Merci pour votre demande !</h2>
      <p>D'après vos réponses, votre fourchette de prix estimée est :</p>
      <p style="font-size:24px;font-weight:bold;">${params.estimateLow.toLocaleString()} $ – ${params.estimateHigh.toLocaleString()} $</p>
      <p>${params.businessName} vous contactera prochainement pour confirmer les détails.</p>
    `,
  };
}
