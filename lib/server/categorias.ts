import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { categoriaAtualizarSchema, categoriaSchema } from "@/lib/validators";
import { categoriaDTO } from "./dto";
import { naoEncontrado } from "./erros";

export async function listarCategorias(userId: string, incluirArquivadas = false) {
  const cats = await prisma.categoria.findMany({
    where: { userId, ...(incluirArquivadas ? {} : { arquivada: false }) },
    orderBy: { nome: "asc" },
  });
  return cats.map(categoriaDTO);
}

export async function criarCategoria(userId: string, dados: z.infer<typeof categoriaSchema>) {
  return categoriaDTO(await prisma.categoria.create({ data: { ...dados, userId } }));
}

export async function atualizarCategoria(userId: string, id: string, dados: z.infer<typeof categoriaAtualizarSchema>) {
  const { count } = await prisma.categoria.updateMany({ where: { id, userId }, data: dados });
  if (!count) throw naoEncontrado("Categoria");
  return categoriaDTO(await prisma.categoria.findUniqueOrThrow({ where: { id } }));
}

/** Lançamentos da categoria ficam "sem categoria" (onDelete: SetNull). */
export async function excluirCategoria(userId: string, id: string) {
  const { count } = await prisma.categoria.deleteMany({ where: { id, userId } });
  if (!count) throw naoEncontrado("Categoria");
}
