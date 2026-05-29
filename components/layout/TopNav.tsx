"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface TopNavProps {
  svjName?: string;
}

export function TopNav({ svjName }: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold truncate max-w-[200px] md:max-w-none">
          {svjName ?? "SVJ Dashboard"}
        </h1>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">Odhlásit se</span>
      </Button>
    </header>
  );
}
