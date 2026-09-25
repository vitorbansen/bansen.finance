import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const COOKIE_KEY = "fin_token";

/**
 * Sessão "lembrar de mim": vale 90 dias e é renovada (middleware) sempre que o app é usado
 * depois de 1 dia do último token. Na prática, só pede login de novo após 90 dias sem abrir.
 */
export const SESSAO_DIAS = 90;
export const RENOVAR_APOS_SEGUNDOS = 60 * 60 * 24;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET não configurado (mínimo 16 caracteres)");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSAO_DIAS}d`)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string | undefined): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

/** Opções do cookie de sessão (usadas no login e na renovação pelo middleware). */
export const opcoesCookieSessao = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * SESSAO_DIAS,
};

/** Só os dados do usuário (sem iat/exp) — para gerar o token renovado. */
export function dadosSessao(payload: JWTPayload) {
  return { id: payload.id, nome: payload.nome, email: payload.email };
}
