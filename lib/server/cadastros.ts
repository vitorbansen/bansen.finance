import { prisma } from "@/lib/prisma";
import type { Cadastros } from "@/lib/types";
import { listarCategorias } from "./categorias";
import { listarContas } from "./contas";
import { cartaoDTO } from "./dto";

/** Contas, categorias e cartões (inclusive arquivados, para nomear lançamentos antigos). */
export async function carregarCadastros(userId: string): Promise<Cadastros> {
  const [contas, categorias, cartoes] = await Promise.all([
    listarContas(userId, true),
    listarCategorias(userId, true),
    prisma.cartao.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  return { contas, categorias, cartoes: cartoes.map(cartaoDTO) };
}
