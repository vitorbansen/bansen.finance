import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { NaoAutorizado, requireUser } from "@/lib/auth";
import { HttpError } from "./erros";

type Contexto<P> = { req: NextRequest; userId: string; params: P };

/**
 * Envolve um route handler: exige sessão, serializa o retorno em JSON e converte erros
 * (zod → 400, HttpError → status, Prisma "não encontrado" → 404, unique → 409, resto → 500).
 */
export function rota<P = Record<string, never>>(fn: (ctx: Contexto<P>) => Promise<unknown>) {
  return async (req: NextRequest, ctx: { params: P }) => {
    try {
      const user = await requireUser();
      const resultado = await fn({ req, userId: user.id, params: ctx?.params });
      if (resultado instanceof Response) return resultado;
      return NextResponse.json(resultado ?? { ok: true });
    } catch (e) {
      return respostaDeErro(e);
    }
  };
}

export function respostaDeErro(e: unknown) {
  if (e instanceof NaoAutorizado) return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: e.issues[0]?.message ?? "Dados inválidos", campos: e.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    if (e.code === "P2002") return NextResponse.json({ error: "Já existe um registro com esses dados" }, { status: 409 });
  }
  console.error(e);
  return NextResponse.json({ error: "Erro inesperado. Tente de novo." }, { status: 500 });
}

export async function lerCorpo<T extends ZodTypeAny>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Corpo da requisição inválido");
  }
  return schema.parse(body);
}

export function lerQuery<T extends ZodTypeAny>(req: NextRequest, schema: T): z.infer<T> {
  const q: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    if (v !== "") q[k] = v;
  });
  return schema.parse(q);
}
