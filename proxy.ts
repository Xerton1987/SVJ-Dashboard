import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/",
  "/jednotky",
  "/clenove",
  "/import",
  "/nastaveni",
];

export default auth(function proxy(req: NextRequest & { auth: unknown }) {
  const { nextUrl } = req;
  const session = (req as { auth: { user?: { id?: string } } | null }).auth;
  const isLoggedIn = !!session?.user?.id;

  const isProtected = protectedRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
