import type { Produto as ProdutoDb } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Produto } from "@/lib/products";

export function toProduto(p: ProdutoDb): Produto {
  return {
    id: p.id,
    modelo: p.modelo,
    armazenamento: p.armazenamento,
    cor: p.cor,
    estado: p.estado === "NOVO" ? "novo" : "seminovo",
    garantia: p.garantia,
    preco: Number(p.preco),
    precoPix: p.precoPix != null ? Number(p.precoPix) : undefined,
    bateria: p.bateria ?? undefined,
    imagem: p.imagem ?? undefined,
    destaque: p.destaque,
    disponivel: p.disponivel,
  };
}

/** Produtos exibidos no site: destaques primeiro, depois pela ordem manual e mais recentes. */
export async function getProdutos(): Promise<Produto[]> {
  const rows = await prisma.produto.findMany({
    orderBy: [{ destaque: "desc" }, { ordem: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toProduto);
}
