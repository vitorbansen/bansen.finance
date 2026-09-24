import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cadastroSchema } from "@/lib/validators";
import { createSession } from "@/lib/auth";
import { criarDadosIniciais } from "@/lib/server/dados-iniciais";
import { respostaDeErro } from "@/lib/server/api";

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha } = cadastroSchema.parse(await req.json().catch(() => null));
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return NextResponse.json({ error: "Já existe uma conta com este e-mail" }, { status: 409 });
    const hash = await bcrypt.hash(senha, 12);
    const usuario = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({ data: { nome, email, senha: hash } });
      await criarDadosIniciais(tx, u.id);
      return u;
    });
    await createSession({ id: usuario.id, nome: usuario.nome, email: usuario.email });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return respostaDeErro(e);
  }
}
