import "server-only";
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";
import QRCode from "qrcode";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

function totpFor(secret: string, email: string) {
  return new TOTP({ secret, crypto, base32, issuer: "Quotefox", label: email });
}

/** Generates a fresh random Base32 TOTP secret — not yet persisted or enabled. */
export function generateTwoFactorSecret(): string {
  return new TOTP({ crypto, base32 }).generateSecret();
}

/** The otpauth:// URI an authenticator app scans (as a QR code) to add the account. */
export function twoFactorOtpauthUrl(secret: string, email: string): string {
  return totpFor(secret, email).toURI();
}

/** Renders the otpauth:// URI as a scannable QR code data URL (PNG). */
export async function twoFactorQrCodeDataUrl(secret: string, email: string): Promise<string> {
  return QRCode.toDataURL(twoFactorOtpauthUrl(secret, email));
}

/** Verifies a 6-digit code, allowing a small window of clock drift. */
export async function verifyTwoFactorToken(secret: string, email: string, token: string): Promise<boolean> {
  const cleaned = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const result = await totpFor(secret, email).verify(cleaned, { epochTolerance: 30 });
  return result.valid;
}
