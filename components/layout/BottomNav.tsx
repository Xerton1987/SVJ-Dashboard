"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, MessageSquare, Vote, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Domů", icon: Home },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/nastenkа", label: "Nástěnka", icon: MessageSquare },
  { href: "/hlasovani", label: "Hlasování", icon: Vote },
  { href: "/nastaveni", label: "Více", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
