import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSvj } from "@/app/actions/svj";

export const metadata = { title: "Nastavení SVJ — SVJ Dashboard" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  async function handleCreateSvj(formData: FormData): Promise<void> {
    "use server";
    const result = await createSvj(formData);
    if (result.success) {
      redirect("/prehled");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vítejte! Vytvořte své SVJ</CardTitle>
          <CardDescription>
            Pro začátek prosím zadejte základní informace o vašem SVJ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleCreateSvj} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ico">IČO</Label>
              <Input
                id="ico"
                name="ico"
                placeholder="12345678"
                maxLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                8-místné IČO ze živnostenského rejstříku
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nazev">Název SVJ</Label>
              <Input
                id="nazev"
                name="nazev"
                placeholder="Bytové společenství Parkova 42"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sidlo">Sídlo (adresa)</Label>
              <Input
                id="sidlo"
                name="sidlo"
                placeholder="Parkova 42, 110 00 Praha 1"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Vytvořit SVJ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
