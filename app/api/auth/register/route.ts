import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  jmeno: z.string().min(1),
  prijmeni: z.string().min(1),
  email: z.string().email(),
  telefon: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Chybná data" },
        { status: 400 }
      );
    }

    const { jmeno, prijmeni, email, telefon, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Uživatel s tímto e-mailem již existuje" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    await db.user.create({
      data: {
        email,
        name: `${jmeno} ${prijmeni}`,
        jmeno,
        prijmeni,
        telefon,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
