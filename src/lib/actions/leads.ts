"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { leadStatusSchema } from "@/lib/enums";
import { deleteUploadedFile } from "@/lib/storage";

export async function updateLeadStatus(leadId: string, status: string) {
  const user = await requireUser();
  const parsedStatus = leadStatusSchema.parse(status);

  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: user.organizationId } });
  if (!lead) throw new Error("Prospect introuvable ou vous n'y avez pas accès.");

  await prisma.lead.update({ where: { id: leadId }, data: { status: parsedStatus } });
  revalidatePath("/dashboard/leads");
}

export async function deleteLead(leadId: string) {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: user.organizationId },
    include: { files: true },
  });
  if (!lead) throw new Error("Prospect introuvable ou vous n'y avez pas accès.");

  await prisma.lead.delete({ where: { id: leadId } });
  await Promise.all(lead.files.map((f) => deleteUploadedFile(f.storagePath)));
  revalidatePath("/dashboard/leads");
}

const bulkSchema = z.object({ leadIds: z.array(z.string()) });

export async function deleteLeadsBulk(leadIds: string[]) {
  const user = await requireUser();
  const parsed = bulkSchema.parse({ leadIds });

  const leads = await prisma.lead.findMany({
    where: { id: { in: parsed.leadIds }, organizationId: user.organizationId },
    include: { files: true },
  });

  await prisma.lead.deleteMany({
    where: { id: { in: parsed.leadIds }, organizationId: user.organizationId },
  });
  await Promise.all(leads.flatMap((l) => l.files).map((f) => deleteUploadedFile(f.storagePath)));
  revalidatePath("/dashboard/leads");
}
