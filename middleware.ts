import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, COOKIE_KEY } from "@/lib/jwt";

const PAGINAS_PUBLICAS = ["/login", "/cadastro"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_KEY)?.value;
  const payload = await verifyToken(token);
  const isPaginaPublica = PAGINAS_PUBLICAS.includes(pathname);

  if (isPaginaPublica) {
    if (payload) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (payload) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // Tudo exige sessão, exceto auth, assets do Next e arquivos do PWA.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|manifest.webmanifest|icon|apple-icon|icons|splash|favicon.ico).*)",
  ],
};
