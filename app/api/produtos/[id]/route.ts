import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { produtoSchema } from "@/lib/validators";
import { deleteImage } from "@/lib/cloudinary";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const existing = await prisma.produto.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const parsed = produtoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.produto.update({ where: { id: existing.id }, data: parsed.data });

  if (existing.imagem && existing.imagem !== parsed.data.imagem) {
    await deleteImage(existing.imagem).catch(() => null);
  }

  revalidatePath("/");
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const existing = await prisma.produto.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  await prisma.produto.delete({ where: { id: existing.id } });
  await deleteImage(existing.imagem).catch(() => null);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
