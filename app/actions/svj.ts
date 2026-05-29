"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

const createSvjSchema = z.object({
  ico: z.string().length(8, "IČO musí mít 8 číslic"),
  dic: z.string().optional(),
  nazev: z.string().min(1, "Název je povinný"),
  sidlo: z.string().min(1, "Sídlo je povinné"),
});

const updateSvjSchema = z.object({
  svjId: z.string().cuid(),
  dic: z.string().optional(),
  nazev: z.string().min(1).optional(),
  sidlo: z.string().min(1).optional(),
  datovkaSchrankaId: z.string().optional(),
  bankAccountIban: z.string().optional(),
  bankAccountPrefix: z.string().optional(),
});

export async function createSvj(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = createSvjSchema.safeParse({
    ico: formData.get("ico"),
    dic: formData.get("dic") || undefined,
    nazev: formData.get("nazev"),
    sidlo: formData.get("sidlo"),
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  try {
    const existing = await db.svj.findUnique({ where: { ico: parsed.data.ico } });
    if (existing) {
      return { success: false as const, error: "SVJ s tímto IČO již existuje" };
    }

    const svj = await db.svj.create({ data: parsed.data });

    // Make the creator a committee chair
    await db.membership.create({
      data: {
        userId: session.user.id,
        svjId: svj.id,
        role: MemberRole.COMMITTEE_CHAIR,
        grantedByUserId: session.user.id,
      },
    });

    await writeAuditLog({
      svjId: svj.id,
      userId: session.user.id,
      action: "CREATE",
      entityType: "Svj",
      entityId: svj.id,
      payload: { ico: svj.ico, nazev: svj.nazev },
    });

    return { success: true as const, data: svj };
  } catch {
    return { success: false as const, error: "Nepodařilo se vytvořit SVJ" };
  }
}

export async function updateSvj(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = updateSvjSchema.safeParse({
    svjId: formData.get("svjId"),
    dic: formData.get("dic") || undefined,
    nazev: formData.get("nazev") || undefined,
    sidlo: formData.get("sidlo") || undefined,
    datovkaSchrankaId: formData.get("datovkaSchrankaId") || undefined,
    bankAccountIban: formData.get("bankAccountIban") || undefined,
    bankAccountPrefix: formData.get("bankAccountPrefix") || undefined,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  const { svjId, ...data } = parsed.data;

  try {
    await requireRole(svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const svj = await db.svj.update({ where: { id: svjId }, data });

    await writeAuditLog({
      svjId,
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Svj",
      entityId: svjId,
      payload: data as import("@prisma/client").Prisma.InputJsonValue,
    });

    return { success: true as const, data: svj };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function getSvj(svjId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  try {
    const svj = await db.svj.findUnique({
      where: { id: svjId },
      include: { buildings: { include: { entrances: { include: { units: true } } } } },
    });

    if (!svj) {
      return { success: false as const, error: "SVJ nenalezeno" };
    }

    return { success: true as const, data: svj };
  } catch {
    return { success: false as const, error: "Nepodařilo se načíst SVJ" };
  }
}
