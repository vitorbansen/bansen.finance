import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_KEY, opcoesCookieSessao, signToken, verifyToken } from "./jwt";

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
  // Sessão longa e renovada a cada uso (ver middleware): o app na Tela de Início fica logado.
  cookies().set(COOKIE_KEY, token, opcoesCookieSessao);
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
