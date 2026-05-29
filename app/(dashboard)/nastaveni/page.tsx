import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSvj } from "@/app/actions/svj";

export const metadata = { title: "Nastavení — SVJ Dashboard" };

export default async function NastaveniPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, revokedAt: null },
    include: { svj: true },
    orderBy: { grantedAt: "asc" },
  });

  if (!membership) redirect("/onboarding");

  const { svj } = membership;

  async function handleUpdateSvj(formData: FormData): Promise<void> {
    "use server";
    await updateSvj(formData);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Nastavení SVJ</h1>

      <Card>
        <CardHeader>
          <CardTitle>Základní informace</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpdateSvj} className="space-y-4">
            <input type="hidden" name="svjId" value={svj.id} />

            <div className="space-y-2">
              <Label htmlFor="ico">IČO</Label>
              <Input id="ico" name="ico" value={svj.ico} readOnly className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nazev">Název SVJ</Label>
              <Input id="nazev" name="nazev" defaultValue={svj.nazev} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sidlo">Sídlo</Label>
              <Input id="sidlo" name="sidlo" defaultValue={svj.sidlo} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dic">DIČ (volitelné)</Label>
              <Input id="dic" name="dic" defaultValue={svj.dic ?? ""} placeholder="CZ00000000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="datovkaSchrankaId">ID datové schránky (volitelné)</Label>
              <Input
                id="datovkaSchrankaId"
                name="datovkaSchrankaId"
                defaultValue={svj.datovkaSchrankaId ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountIban">IBAN (volitelné)</Label>
              <Input
                id="bankAccountIban"
                name="bankAccountIban"
                defaultValue={svj.bankAccountIban ?? ""}
                placeholder="CZ65 0800 0000 1920 0014 5399"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountPrefix">Předčíslí bankovního účtu (volitelné)</Label>
              <Input
                id="bankAccountPrefix"
                name="bankAccountPrefix"
                defaultValue={svj.bankAccountPrefix ?? ""}
              />
            </div>

            <Button type="submit">Uložit nastavení</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
