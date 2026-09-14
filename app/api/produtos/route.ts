import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { produtoSchema } from "@/lib/validators";
import { getProdutos } from "@/lib/produtos-db";

export async function GET() {
  return NextResponse.json(await getProdutos());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = produtoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const produto = await prisma.produto.create({ data: parsed.data });
  revalidatePath("/");
  return NextResponse.json(produto, { status: 201 });
}
