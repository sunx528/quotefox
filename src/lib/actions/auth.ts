"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100),
  email: z.string().trim().toLowerCase().email("Saisissez une adresse e-mail valide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(200),
  businessName: z.string().trim().min(1, "Le nom de l'entreprise est requis").max(120),
});

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    businessName: formData.get("businessName"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password, businessName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse e-mail." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: businessName } });
    await tx.subscription.create({ data: { organizationId: organization.id, plan: "free", status: "active" } });
    return tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        organizationId: organization.id,
        role: "owner",
      },
    });
  });

  await createSession(user.id);
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Saisissez une adresse e-mail valide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Saisissez une adresse e-mail et un mot de passe valides." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-shape response whether the user exists or not, to avoid
  // leaking account existence via timing/error differences.
  const valid = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinva");

  if (!user || !valid) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Saisissez une adresse e-mail valide." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always behave the same whether or not the account exists, so this endpoint
  // can't be used to enumerate registered emails.
  if (user) {
    const token = await createPasswordResetToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe Quotefox",
      html: `
        <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte Quotefox.</p>
        <p><a href="${resetUrl}">Cliquez ici pour définir un nouveau mot de passe</a> (expire dans 1 heure).</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
      `,
    });
  }

  return {};
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(200),
});

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Requête invalide." };
  }

  const userId = await consumePasswordResetToken(parsed.data.token);
  if (!userId) {
    return { error: "Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    // Invalidate every existing session — a password reset should log out any
    // other device/session that might have been compromised.
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  await createSession(userId);
  redirect("/dashboard");
}
