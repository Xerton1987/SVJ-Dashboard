"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import { MemberRole, OwnershipSource } from "@prisma/client";
import Papa from "papaparse";
import bcryptjs from "bcryptjs";

const importRowSchema = z.object({
  jednotka: z.string().min(1, "Číslo jednotky je povinné"),
  jmeno: z.string().min(1, "Jméno je povinné"),
  podil: z.string().regex(/^\d+\/\d+$/, "Podíl musí být ve formátu čitatel/jmenovatel (např. 1/3)"),
  email: z.string().email("Neplatný e-mail"),
  telefon: z.string().optional(),
});

type ImportRow = z.infer<typeof importRowSchema>;

interface ImportResult {
  row: number;
  jednotka: string;
  status: "ok" | "error";
  error?: string;
}

export async function importOwnersFromCsv(
  svjId: string,
  csvContent: string
): Promise<{ success: boolean; results?: ImportResult[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Nepřihlášený uživatel" };
  }

  try {
    await requireRole(svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return { success: false, error: `Chyba při parsování CSV: ${parsed.errors[0]?.message}` };
  }

  const results: ImportResult[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const rowNum = i + 2; // 1-indexed + header

    const validation = importRowSchema.safeParse({
      jednotka: raw["jednotka"],
      jmeno: raw["jmeno"],
      podil: raw["podil"],
      email: raw["email"],
      telefon: raw["telefon"] || undefined,
    });

    if (!validation.success) {
      results.push({
        row: rowNum,
        jednotka: raw["jednotka"] ?? "",
        status: "error",
        error: validation.error.issues[0]?.message,
      });
      continue;
    }

    const row: ImportRow = validation.data;
    const [citatelStr, jmenovatelStr] = row.podil.split("/");
    const citatel = parseInt(citatelStr ?? "0", 10);
    const jmenovatel = parseInt(jmenovatelStr ?? "1", 10);

    try {
      // Find the unit by cisloJednotkyKn within the SVJ
      const unit = await db.unit.findFirst({
        where: {
          cisloJednotkyKn: row.jednotka,
          entrance: { building: { svjId } },
        },
      });

      if (!unit) {
        results.push({
          row: rowNum,
          jednotka: row.jednotka,
          status: "error",
          error: `Jednotka ${row.jednotka} nebyla nalezena v tomto SVJ`,
        });
        continue;
      }

      // Upsert user by email
      let user = await db.user.findUnique({ where: { email: row.email } });
      if (!user) {
        const nameParts = row.jmeno.trim().split(" ");
        const prijmeni = nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;
        const jmeno = nameParts.slice(0, -1).join(" ") || row.jmeno;

        const tempPassword = await bcryptjs.hash(Math.random().toString(36).slice(-8), 12);
        user = await db.user.create({
          data: {
            email: row.email,
            name: row.jmeno,
            jmeno,
            prijmeni,
            telefon: row.telefon,
            password: tempPassword,
          },
        });
      }

      // Ensure membership
      await db.membership.upsert({
        where: { userId_svjId_role: { userId: user.id, svjId, role: MemberRole.MEMBER } },
        update: { revokedAt: null },
        create: {
          userId: user.id,
          svjId,
          role: MemberRole.MEMBER,
          grantedByUserId: session.user!.id,
        },
      });

      // Close any existing active ownership for this unit/user
      await db.unitOwnership.updateMany({
        where: { unitId: unit.id, userId: user.id, validTo: null },
        data: { validTo: new Date() },
      });

      // Create new ownership
      await db.unitOwnership.create({
        data: {
          unitId: unit.id,
          userId: user.id,
          podilCitatel: citatel,
          podilJmenovatel: jmenovatel,
          source: OwnershipSource.KN_IMPORT,
        },
      });

      results.push({ row: rowNum, jednotka: row.jednotka, status: "ok" });
    } catch (e) {
      results.push({
        row: rowNum,
        jednotka: row.jednotka,
        status: "error",
        error: (e as Error).message,
      });
    }
  }

  await writeAuditLog({
    svjId,
    userId: session.user.id,
    action: "CSV_IMPORT",
    entityType: "UnitOwnership",
    payload: {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      errors: results.filter((r) => r.status === "error").length,
    },
  });

  return { success: true, results };
}
