import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

/**
 * Jednorázové naplnění databáze ukázkovými daty. Chráněno tajným klíčem
 * (SEED_SECRET) a spustitelné pouze pokud v databázi zatím není žádné SVJ,
 * takže endpoint nelze zneužít k přepsání produkčních dat.
 *
 * Použití: GET /api/seed?secret=<SEED_SECRET>
 */
export async function GET(req: NextRequest) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Seed je vypnutý. Nastavte proměnnou SEED_SECRET." },
      { status: 403 }
    );
  }

  const provided = req.nextUrl.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Neplatný klíč." }, { status: 401 });
  }

  try {
    const existing = await db.svj.count();
    if (existing > 0) {
      return NextResponse.json(
        { error: "Databáze už obsahuje data, seed byl přeskočen." },
        { status: 409 }
      );
    }

    const result = await runSeed(db);
    return NextResponse.json({
      success: true,
      message: "Databáze naplněna ukázkovými daty. Nyní se můžete přihlásit.",
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Seed selhal", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
