"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword, createSession } from "@/lib/auth";
import type { FormState } from "./auth";

const orgNameSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
});

export async function updateOrganizationNameAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Vous devez être connecté." };

  const parsed = orgNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nom invalide." };
  }

  await prisma.organization.update({ where: { id: user.organizationId }, data: { name: parsed.data.name } });
  revalidatePath("/dashboard", "layout");
  return {};
}

const updateEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Saisissez une adresse e-mail valide"),
  currentPassword: z.string().min(1, "Mot de passe requis"),
});

export async function updateEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const authed = await getCurrentUser();
  if (!authed) return { error: "Vous devez être connecté." };

  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Requête invalide." };
  }

  const user = await prisma.user.findUnique({ where: { id: authed.id } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Mot de passe actuel incorrect." };
  }

  if (parsed.data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return { error: "Cette adresse e-mail est déjà utilisée." };
    }
    await prisma.user.update({ where: { id: user.id }, data: { email: parsed.data.email } });
    revalidatePath("/dashboard", "layout");
  }

  return {};
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères").max(200),
});

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const authed = await getCurrentUser();
  if (!authed) return { error: "Vous devez être connecté." };

  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Requête invalide." };
  }

  const user = await prisma.user.findUnique({ where: { id: authed.id } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Mot de passe actuel incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // A password change invalidates every session — including any device that
    // might have been compromised — then a fresh one is issued below for the
    // session making this request.
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  await createSession(user.id);

  return {};
}
