import type { Prisma, TipoCategoria } from "@prisma/client";

/** Categorias criadas para todo usuário novo (editáveis depois). `icone` = nome do ícone lucide. */
export const CATEGORIAS_PADRAO: { nome: string; icone: string; cor: string; tipo: TipoCategoria }[] = [
  { nome: "Moradia", icone: "house", cor: "#FF9F0A", tipo: "SAIDA" },
  { nome: "Alimentação", icone: "utensils", cor: "#FF453A", tipo: "SAIDA" },
  { nome: "Transporte", icone: "car", cor: "#0A84FF", tipo: "SAIDA" },
  { nome: "Assinaturas", icone: "tv", cor: "#BF5AF2", tipo: "SAIDA" },
  { nome: "Lazer", icone: "party-popper", cor: "#FF375F", tipo: "SAIDA" },
  { nome: "Saúde", icone: "heart-pulse", cor: "#30D158", tipo: "SAIDA" },
  { nome: "Salário", icone: "wallet", cor: "#32D74B", tipo: "ENTRADA" },
  { nome: "Freela", icone: "briefcase", cor: "#64D2FF", tipo: "ENTRADA" },
  { nome: "Outros", icone: "ellipsis", cor: "#8E8E93", tipo: "AMBOS" },
];

/** Categorias padrão + conta "Carteira" para um usuário recém-criado. */
export async function criarDadosIniciais(tx: Prisma.TransactionClient, userId: string) {
  await tx.categoria.createMany({
    data: CATEGORIAS_PADRAO.map((c) => ({ ...c, userId })),
    skipDuplicates: true,
  });
  await tx.conta.create({ data: { userId, nome: "Carteira", tipo: "CARTEIRA", cor: "#FF9F0A" } });
}
