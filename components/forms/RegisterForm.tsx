"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const registerSchema = z
  .object({
    jmeno: z.string().min(1, "Jméno je povinné"),
    prijmeni: z.string().min(1, "Příjmení je povinné"),
    email: z.string().email("Zadejte platný e-mail"),
    telefon: z.string().optional(),
    password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Hesla se neshodují",
    path: ["passwordConfirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Chyba při registraci");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setServerError("Chyba serveru. Zkuste to prosím znovu.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Registrace</CardTitle>
        <CardDescription>Vytvořte si účet v SVJ Dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="jmeno">Jméno</Label>
              <Input id="jmeno" {...register("jmeno")} />
              {errors.jmeno && (
                <p className="text-xs text-destructive">{errors.jmeno.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prijmeni">Příjmení</Label>
              <Input id="prijmeni" {...register("prijmeni")} />
              {errors.prijmeni && (
                <p className="text-xs text-destructive">{errors.prijmeni.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="vas@email.cz"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon (volitelné)</Label>
            <Input
              id="telefon"
              type="tel"
              placeholder="+420 777 123 456"
              {...register("telefon")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Potvrzení hesla</Label>
            <Input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              {...register("passwordConfirm")}
            />
            {errors.passwordConfirm && (
              <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registrace..." : "Registrovat se"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Již máte účet?{" "}
            <Link href="/login" className="underline hover:text-foreground">
              Přihlásit se
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
