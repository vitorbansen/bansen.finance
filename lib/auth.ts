import { cookies } from "next/headers";
import { COOKIE_KEY, signToken, verifyToken } from "./jwt";

export type AdminSession = {
  id: string;
  usuario: string;
  nome: string;
};

export async function createSession(payload: AdminSession) {
  const token = await signToken({ ...payload });
  cookies().set(COOKIE_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_KEY);
}

export async function getSession(): Promise<AdminSession | null> {
  const token = cookies().get(COOKIE_KEY)?.value;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return {
    id: String(payload.id),
    usuario: String(payload.usuario),
    nome: String(payload.nome),
  };
}
