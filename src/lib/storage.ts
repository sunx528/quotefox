import "server-only";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs/promises";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "application/pdf": ".pdf",
};

// Minimal content sniffing so a malicious file can't just relabel its
// extension/MIME header — we check real magic bytes for the types we accept.
function sniffMimeType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  // HEIC has a variable-offset ftyp box; skip strict sniffing for it (still MIME + size checked).
  return null;
}

export class FileValidationError extends Error {}

export async function saveUploadedFile(file: File): Promise<{
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}> {
  if (file.size > MAX_FILE_BYTES) {
    throw new FileValidationError(`File "${file.name}" is too large (max 10MB).`);
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new FileValidationError(`File type "${file.type}" is not allowed.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMimeType(buffer);
  if (sniffed && sniffed !== file.type) {
    throw new FileValidationError(`File "${file.name}" content does not match its declared type.`);
  }
  if (file.type !== "image/heic" && !sniffed) {
    throw new FileValidationError(`File "${file.name}" could not be verified as a valid ${file.type}.`);
  }

  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  const safeName = `${randomBytes(16).toString("hex")}${EXT_BY_MIME[file.type] ?? ""}`;
  const fullPath = path.join(UPLOAD_ROOT, safeName);
  await fs.writeFile(fullPath, buffer);

  return {
    filename: file.name.slice(0, 200),
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath: safeName,
  };
}

export async function readUploadedFile(storagePath: string): Promise<Buffer> {
  // storagePath is always a flat, server-generated hex filename (see saveUploadedFile)
  // — reject anything else so a stored value can never be used for path traversal.
  if (!/^[a-f0-9]+\.\w+$/.test(storagePath)) {
    throw new FileValidationError("Invalid file reference.");
  }
  const fullPath = path.join(UPLOAD_ROOT, storagePath);
  return fs.readFile(fullPath);
}

/**
 * Deletes a previously uploaded file from disk. Best-effort: called after the
 * owning UploadedFile/Lead row is removed from the database (or is about to
 * be), so a missing file on disk is not an error — it just means there is
 * nothing left to clean up.
 */
export async function deleteUploadedFile(storagePath: string): Promise<void> {
  if (!/^[a-f0-9]+\.\w+$/.test(storagePath)) return;
  const fullPath = path.join(UPLOAD_ROOT, storagePath);
  await fs.unlink(fullPath).catch(() => {});
}
