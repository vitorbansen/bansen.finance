import type { Prisma } from "@prisma/client";
import { naoEncontrado } from "./erros";

type Db = Prisma.TransactionClient;

/**
 * Garante que os ids referenciados pertencem ao usuário (evita usar a conta/categoria de outra pessoa).
 * Retorna o cartão carregado, quando informado, porque quase sempre é preciso a regra de fechamento.
 */
export async function verificarReferencias(
  db: Db,
  userId: string,
  refs: {
    contaId?: string | null;
    contaDestinoId?: string | null;
    cartaoId?: string | null;
    categoriaId?: string | null;
  },
) {
  const contas = [refs.contaId, refs.contaDestinoId].filter((x): x is string => !!x);
  if (contas.length) {
    const n = await db.conta.count({ where: { userId, id: { in: contas } } });
    if (n !== new Set(contas).size) throw naoEncontrado("Conta");
  }
  if (refs.categoriaId) {
    const n = await db.categoria.count({ where: { userId, id: refs.categoriaId } });
    if (!n) throw naoEncontrado("Categoria");
  }
  if (refs.cartaoId) {
    const cartao = await db.cartao.findFirst({ where: { userId, id: refs.cartaoId } });
    if (!cartao) throw naoEncontrado("Cartão");
    return { cartao };
  }
  return { cartao: null };
}
