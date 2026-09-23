import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { email, senha } = parsed.data;
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const senhaCorreta = usuario ? await bcrypt.compare(senha, usuario.senha) : false;
  if (!usuario || !senhaCorreta) {
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }
  await createSession({ id: usuario.id, nome: usuario.nome, email: usuario.email });
  return NextResponse.json({ ok: true });
}
