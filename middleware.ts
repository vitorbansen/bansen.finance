import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, COOKIE_KEY } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isLoginPage;
  const isProtectedApi =
    (pathname.startsWith("/api/produtos") && req.method !== "GET") || pathname.startsWith("/api/upload");

  const token = req.cookies.get(COOKIE_KEY)?.value;
  const payload = await verifyToken(token);

  if (isLoginPage) {
    if (payload) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isAdminRoute && !isProtectedApi) return NextResponse.next();

  if (!payload) {
    if (isAdminRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/produtos/:path*", "/api/upload"],
};
