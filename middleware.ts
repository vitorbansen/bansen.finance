import { NextResponse, type NextRequest } from "next/server";
import type { JWTPayload } from "jose";
import {
  COOKIE_KEY,
  RENOVAR_APOS_SEGUNDOS,
  dadosSessao,
  opcoesCookieSessao,
  signToken,
  verifyToken,
} from "@/lib/jwt";

/** Renova o cookie se o token tem mais de 1 dia: quem usa o app continua logado. */
async function comSessaoRenovada(res: NextResponse, payload: JWTPayload) {
  const idade = Math.floor(Date.now() / 1000) - (payload.iat ?? 0);
  if (idade > RENOVAR_APOS_SEGUNDOS) {
    res.cookies.set(COOKIE_KEY, await signToken(dadosSessao(payload)), opcoesCookieSessao);
  }
  return res;
}

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

  if (payload) return comSessaoRenovada(NextResponse.next(), payload);

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
