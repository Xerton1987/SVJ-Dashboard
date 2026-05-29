import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = { title: "Detail jednotky — SVJ Dashboard" };

const unitTypeLabels: Record<string, string> = {
  BYT: "Byt",
  NEBYT: "Nebytový prostor",
  GARAZ: "Garáž",
  SKLEP: "Sklep",
  SPOL_PROSTOR: "Společný prostor",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JednotkaDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const unit = await db.unit.findUnique({
    where: { id },
    include: {
      entrance: { include: { building: { include: { svj: true } } } },
      ownerships: {
        include: { user: true },
        orderBy: { validFrom: "desc" },
      },
      tenancies: {
        where: { validTo: null },
        include: { user: true },
      },
    },
  });

  if (!unit) notFound();

  const activeOwnerships = unit.ownerships.filter((o) => !o.validTo);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link href="/jednotky" className="text-sm text-muted-foreground hover:text-foreground">
          ← Jednotky
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          Jednotka {unit.cisloJednotkyKn}
        </h1>
        <p className="text-muted-foreground">
          {unit.entrance.building.svj.nazev} · {unit.entrance.building.adresa}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Základní informace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Číslo v KN</span>
              <span className="font-medium">{unit.cisloJednotkyKn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Typ</span>
              <Badge variant="secondary">{unitTypeLabels[unit.typ] ?? unit.typ}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plocha</span>
              <span className="font-medium">{unit.plochaMq.toString()} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spoluvlastnický podíl</span>
              <span className="font-medium">
                {unit.spoluvlPodilCitatel}/{unit.spoluvlPodilJmenovatel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Počet osob</span>
              <span className="font-medium">{unit.pocetOsob}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vchod</span>
              <span className="font-medium">{unit.entrance.cislo}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vlastníci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {activeOwnerships.length === 0 ? (
              <p className="text-muted-foreground">Žádní vlastníci</p>
            ) : (
              activeOwnerships.map((o: (typeof activeOwnerships)[number]) => (
                <div key={o.id} className="rounded border p-2">
                  <div className="font-medium">{o.user.name ?? o.user.email}</div>
                  <div className="text-muted-foreground">{o.user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Podíl: {o.podilCitatel}/{o.podilJmenovatel} · od{" "}
                    {new Date(o.validFrom).toLocaleDateString("cs-CZ")}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {unit.tenancies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nájemníci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {unit.tenancies.map((t: (typeof unit.tenancies)[number]) => (
              <div key={t.id} className="rounded border p-2">
                <div className="font-medium">{t.user.name ?? t.user.email}</div>
                <div className="text-muted-foreground">{t.user.email}</div>
                <div className="text-xs text-muted-foreground">
                  od {new Date(t.validFrom).toLocaleDateString("cs-CZ")}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {unit.ownerships.filter((o) => o.validTo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historie vlastnictví</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {unit.ownerships
              .filter((o) => o.validTo)
              .map((o: (typeof unit.ownerships)[number]) => (
                <div key={o.id} className="rounded border p-2 opacity-60">
                  <div className="font-medium">{o.user.name ?? o.user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.validFrom).toLocaleDateString("cs-CZ")} –{" "}
                    {o.validTo ? new Date(o.validTo).toLocaleDateString("cs-CZ") : "nyní"}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
