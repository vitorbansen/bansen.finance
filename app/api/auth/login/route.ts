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
  const { usuario, senha } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { usuario: usuario.toLowerCase() } });
  const senhaCorreta = admin ? await bcrypt.compare(senha, admin.senha) : false;
  if (!admin || !senhaCorreta) {
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({ error: "Usuário ou senha incorretos" }, { status: 401 });
  }
  await createSession({ id: admin.id, usuario: admin.usuario, nome: admin.nome });
  return NextResponse.json({ ok: true });
}
