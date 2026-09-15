"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { generateTwoFactorSecret, twoFactorQrCodeDataUrl, verifyTwoFactorToken } from "@/lib/two-factor";

export type TwoFactorSetupResult = { secret: string; qrCodeDataUrl: string } | { error: string };

/** Generates a fresh secret and stores it (not yet enabled) so it survives the round-trip to confirm. */
export async function startTwoFactorSetup(): Promise<TwoFactorSetupResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Vous devez être connecté." };

  const secret = generateTwoFactorSecret();
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });

  const qrCodeDataUrl = await twoFactorQrCodeDataUrl(secret, user.email);
  return { secret, qrCodeDataUrl };
}

export async function confirmTwoFactorSetup(code: string): Promise<{ error?: string }> {
  const authed = await getCurrentUser();
  if (!authed) return { error: "Vous devez être connecté." };

  const user = await prisma.user.findUnique({ where: { id: authed.id } });
  if (!user?.twoFactorSecret) {
    return { error: "Démarrez d'abord la configuration en générant un code QR." };
  }

  const valid = await verifyTwoFactorToken(user.twoFactorSecret, user.email, code);
  if (!valid) {
    return { error: "Code invalide. Vérifiez l'heure de votre téléphone et réessayez." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  revalidatePath("/dashboard/settings");
  return {};
}

export async function disableTwoFactor(currentPassword: string): Promise<{ error?: string }> {
  const authed = await getCurrentUser();
  if (!authed) return { error: "Vous devez être connecté." };

  const user = await prisma.user.findUnique({ where: { id: authed.id } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "Mot de passe actuel incorrect." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  revalidatePath("/dashboard/settings");
  return {};
}
