import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Jednotky — SVJ Dashboard" };

const unitTypeLabels: Record<string, string> = {
  BYT: "Byt",
  NEBYT: "Nebytový prostor",
  GARAZ: "Garáž",
  SKLEP: "Sklep",
  SPOL_PROSTOR: "Společný prostor",
};

export default async function JednotkyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { grantedAt: "asc" },
  });

  if (!membership) redirect("/onboarding");

  const units = await db.unit.findMany({
    where: { entrance: { building: { svjId: membership.svjId } } },
    include: {
      entrance: { include: { building: true } },
      ownerships: {
        where: { validTo: null },
        include: { user: true },
      },
    },
    orderBy: { cisloJednotkyKn: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Jednotky</h1>
      <Card>
        <CardHeader>
          <CardTitle>Seznam jednotek ({units.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo jednotky</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Plocha (m²)</TableHead>
                  <TableHead>Podíl</TableHead>
                  <TableHead>Vlastníci</TableHead>
                  <TableHead>Vchod</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Žádné jednotky nenalezeny
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>
                        <Link
                          href={`/jednotky/${unit.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {unit.cisloJednotkyKn}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {unitTypeLabels[unit.typ] ?? unit.typ}
                        </Badge>
                      </TableCell>
                      <TableCell>{unit.plochaMq.toString()}</TableCell>
                      <TableCell>
                        {unit.spoluvlPodilCitatel}/{unit.spoluvlPodilJmenovatel}
                      </TableCell>
                      <TableCell>
                        {unit.ownerships.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          unit.ownerships.map((o) => o.user.name ?? o.user.email).join(", ")
                        )}
                      </TableCell>
                      <TableCell>
                        {unit.entrance.cislo}
                        {unit.entrance.building.adresa && (
                          <span className="text-muted-foreground text-xs ml-1">
                            ({unit.entrance.building.adresa})
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
