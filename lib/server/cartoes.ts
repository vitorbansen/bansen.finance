import type { Fatura, Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fromDate, hojeSP, primeiroDia, toDate, type MesISO } from "@/lib/finance/dates";
import { faturaDaCompra, faturaDoMes, statusFatura } from "@/lib/finance/fatura";
import type { FaturaDTO } from "@/lib/types";
import type { cartaoAtualizarSchema, cartaoSchema, pagarFaturaSchema } from "@/lib/validators";
import { verificarReferencias } from "./dono";
import { cartaoDTO, lancamentoDTO } from "./dto";
import { conflito, naoEncontrado } from "./erros";
import { pagarFatura, periodoDaFatura } from "./faturas";
import { garantirMes } from "./recorrencias";

type Db = Prisma.TransactionClient;

export function faturaDTO(f: Fatura, total: number, hoje = hojeSP()): FaturaDTO {
  const p = periodoDaFatura(f);
  const pagaEm = f.pagaEm ? fromDate(f.pagaEm) : null;
  return { id: f.id, cartaoId: f.cartaoId, ...p, total, pagaEm, status: statusFatura({ ...p, pagaEm }, hoje) };
}

/** Soma dos itens por fatura. */
export async function totaisPorFatura(db: Db, faturaIds: string[]) {
  const grupos = await db.lancamento.groupBy({
    by: ["faturaId"],
    where: { faturaId: { in: faturaIds } },
    _sum: { valor: true },
  });
  return new Map(grupos.map((g) => [g.faturaId!, g._sum.valor ?? 0]));
}

/**
 * Cartões com a fatura em aberto (onde cai uma compra feita hoje), faturas fechadas ainda não
 * pagas e o limite usado (tudo que está em faturas não pagas, inclusive parcelas futuras).
 */
export async function listarCartoes(userId: string, incluirArquivados = false) {
  const hoje = hojeSP();
  const cartoes = await prisma.cartao.findMany({
    where: { userId, ...(incluirArquivados ? {} : { arquivado: false }) },
    orderBy: { createdAt: "asc" },
    include: { faturas: { where: { pagaEm: null } } },
  });
  const totais = await totaisPorFatura(
    prisma,
    cartoes.flatMap((c) => c.faturas.map((f) => f.id)),
  );

  return cartoes.map((c) => {
    const periodoAberto = faturaDaCompra(hoje, c);
    const naoPagas = c.faturas.map((f) => faturaDTO(f, totais.get(f.id) ?? 0, hoje));
    const aberta =
      naoPagas.find((f) => f.mes === periodoAberto.mes) ??
      ({ id: "", cartaoId: c.id, ...periodoAberto, total: 0, pagaEm: null, status: "ABERTA" } satisfies FaturaDTO);
    const limiteUsado = naoPagas.reduce((a, f) => a + f.total, 0);
    return {
      cartao: cartaoDTO(c),
      faturaAberta: aberta,
      /** Fechadas e não pagas (a pagar agora), mais antiga primeiro. */
      faturasAPagar: naoPagas.filter((f) => f.status === "FECHADA" && f.total > 0).sort((a, b) => a.mes.localeCompare(b.mes)),
      limiteUsado,
      limiteDisponivel: c.limite - limiteUsado,
    };
  });
}

/** Fatura de um mês (mês de vencimento) com seus itens. */
export async function detalheFatura(userId: string, cartaoId: string, mes: MesISO) {
  const cartao = await prisma.cartao.findFirst({ where: { id: cartaoId, userId } });
  if (!cartao) throw naoEncontrado("Cartão");
  // Recorrências no cartão do mês da compra (que caem nesta fatura) precisam existir.
  await garantirMes(prisma, userId, mes);

  const fatura = await prisma.fatura.findUnique({
    where: { cartaoId_mes: { cartaoId, mes: toDate(primeiroDia(mes)) } },
    include: {
      itens: {
        include: { faturaPaga: { select: { id: true } }, movimentacao: { select: { caixinhaId: true } } },
        orderBy: [{ data: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  const itens = fatura?.itens.map(lancamentoDTO) ?? [];
  const total = itens.reduce((a, l) => a + l.valor, 0);
  const periodo = faturaDoMes(mes, cartao);
  return {
    cartao: cartaoDTO(cartao),
    fatura: fatura
      ? faturaDTO(fatura, total)
      : ({
          id: "",
          cartaoId,
          ...periodo,
          total: 0,
          pagaEm: null,
          status: statusFatura(periodo, hojeSP()),
        } satisfies FaturaDTO),
    itens,
  };
}

export async function criarCartao(userId: string, d: z.infer<typeof cartaoSchema>) {
  await verificarReferencias(prisma, userId, { contaId: d.contaPagamentoId });
  return cartaoDTO(await prisma.cartao.create({ data: { ...d, userId } }));
}

/** Mudar dias de fechamento/vencimento vale para compras novas; faturas já criadas mantêm suas datas. */
export async function atualizarCartao(userId: string, id: string, d: z.infer<typeof cartaoAtualizarSchema>) {
  if (d.contaPagamentoId) await verificarReferencias(prisma, userId, { contaId: d.contaPagamentoId });
  const { count } = await prisma.cartao.updateMany({ where: { id, userId }, data: d });
  if (!count) throw naoEncontrado("Cartão");
  return cartaoDTO(await prisma.cartao.findUniqueOrThrow({ where: { id } }));
}

export async function excluirCartao(userId: string, id: string) {
  const cartao = await prisma.cartao.findFirst({
    where: { id, userId },
    include: { _count: { select: { lancamentos: true, recorrencias: true } } },
  });
  if (!cartao) throw naoEncontrado("Cartão");
  if (cartao._count.lancamentos || cartao._count.recorrencias) {
    throw conflito("Este cartão tem compras ou recorrências. Arquive em vez de excluir.");
  }
  await prisma.cartao.delete({ where: { id } });
}

export async function pagarFaturaDoMes(
  userId: string,
  cartaoId: string,
  mes: MesISO,
  d: z.infer<typeof pagarFaturaSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const { cartao } = await verificarReferencias(tx, userId, { cartaoId, contaId: d.contaId });
    const fatura = await tx.fatura.findUnique({
      where: { cartaoId_mes: { cartaoId: cartao!.id, mes: toDate(primeiroDia(mes)) } },
    });
    if (!fatura) throw naoEncontrado("Fatura");
    const paga = await pagarFatura(tx, userId, fatura.id, d.data, d.contaId);
    const total = (await totaisPorFatura(tx, [paga.id])).get(paga.id) ?? 0;
    return faturaDTO(paga, total);
  });
}
