import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_KEY, signToken, verifyToken } from "./jwt";

export type UserSession = {
  id: string;
  nome: string;
  email: string;
};

export class NaoAutorizado extends Error {
  constructor() {
    super("Não autorizado");
  }
}

export async function createSession(payload: UserSession) {
  const token = await signToken({ ...payload });
  cookies().set(COOKIE_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // App fica na Tela de Início do iPhone: sessão longa evita login frequente.
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_KEY);
}

export async function getSession(): Promise<UserSession | null> {
  const token = cookies().get(COOKIE_KEY)?.value;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return {
    id: String(payload.id),
    nome: String(payload.nome),
    email: String(payload.email),
  };
}

/** Para rotas de API: lança NaoAutorizado (vira 401). */
export async function requireUser(): Promise<UserSession> {
  const session = await getSession();
  if (!session) throw new NaoAutorizado();
  return session;
}

/** Para páginas: redireciona ao login. */
export async function requireUserPage(): Promise<UserSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
