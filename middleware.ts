import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("tuerss_session")?.value;
  const isAuth = !!token;
  const path = request.nextUrl.pathname;

  const protectedPaths = ["/dashboard", "/script", "/settings"];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  if (isProtected && !isAuth) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", path);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/script", "/script/:path*", "/settings", "/settings/:path*"],
};
