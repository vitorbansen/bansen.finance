import type { Cartao, Prisma } from "@prisma/client";
import { fromDate, primeiroDia, toDate, type DataISO } from "@/lib/finance/dates";
import { faturaDaCompra, type PeriodoFatura } from "@/lib/finance/fatura";
import { descricaoParcela, gerarParcelas } from "@/lib/finance/parcelamento";
import { conflito, invalido } from "./erros";

type Db = Prisma.TransactionClient;

/** Cria a fatura do período se ainda não existir (idempotente pelo unique cartaoId+mes). */
export async function garantirFatura(db: Db, cartaoId: string, periodo: PeriodoFatura) {
  return db.fatura.upsert({
    where: { cartaoId_mes: { cartaoId, mes: toDate(primeiroDia(periodo.mes)) } },
    update: {},
    create: {
      cartaoId,
      mes: toDate(primeiroDia(periodo.mes)),
      dataFechamento: toDate(periodo.fechamento),
      dataVencimento: toDate(periodo.vencimento),
    },
  });
}

/** Várias faturas de uma vez (poucas idas ao banco). Retorna mês → id. */
export async function garantirFaturas(db: Db, cartaoId: string, todos: PeriodoFatura[]) {
  const periodos = [...new Map(todos.map((p) => [p.mes, p])).values()];
  await db.fatura.createMany({
    data: periodos.map((p) => ({
      cartaoId,
      mes: toDate(primeiroDia(p.mes)),
      dataFechamento: toDate(p.fechamento),
      dataVencimento: toDate(p.vencimento),
    })),
    skipDuplicates: true,
  });
  const faturas = await db.fatura.findMany({
    where: { cartaoId, mes: { in: periodos.map((p) => toDate(primeiroDia(p.mes))) } },
  });
  return new Map(faturas.map((f) => [fromDate(f.mes).slice(0, 7), f.id]));
}

/** Id da fatura em que cai uma compra feita em `data`. */
export async function faturaIdDaCompra(db: Db, cartao: Pick<Cartao, "id" | "diaFechamento" | "diaVencimento">, data: DataISO) {
  const fatura = await garantirFatura(db, cartao.id, faturaDaCompra(data, cartao));
  return fatura.id;
}

export type NovaCompraCartao = {
  userId: string;
  cartao: Pick<Cartao, "id" | "diaFechamento" | "diaVencimento">;
  descricao: string;
  valor: number;
  data: DataISO;
  categoriaId?: string | null;
  observacao?: string | null;
  parcelas?: number;
};

/** Compra à vista ou parcelada: cada parcela vira um lançamento na sua fatura. */
export async function criarCompraCartao(db: Db, c: NovaCompraCartao) {
  const n = c.parcelas ?? 1;
  if (n === 1) {
    return [
      await db.lancamento.create({
        data: {
          userId: c.userId,
          tipo: "SAIDA",
          descricao: c.descricao,
          valor: c.valor,
          data: toDate(c.data),
          status: "PAGO",
          observacao: c.observacao,
          categoriaId: c.categoriaId,
          cartaoId: c.cartao.id,
          faturaId: await faturaIdDaCompra(db, c.cartao, c.data),
        },
      }),
    ];
  }

  const compra = await db.compraParcelada.create({
    data: {
      userId: c.userId,
      cartaoId: c.cartao.id,
      categoriaId: c.categoriaId,
      descricao: c.descricao,
      valorTotal: c.valor,
      nParcelas: n,
      dataCompra: toDate(c.data),
    },
  });
  const parcelas = gerarParcelas({ valorTotal: c.valor, nParcelas: n, dataCompra: c.data }, c.cartao);
  const faturas = await garantirFaturas(db, c.cartao.id, parcelas.map((p) => p.fatura));
  const criados = await db.lancamento.createManyAndReturn({
    data: parcelas.map((p) => ({
      userId: c.userId,
      tipo: "SAIDA" as const,
      descricao: descricaoParcela(c.descricao, p.numero, p.total),
      valor: p.valor,
      data: toDate(p.data),
      status: "PAGO" as const,
      observacao: c.observacao,
      categoriaId: c.categoriaId,
      cartaoId: c.cartao.id,
      faturaId: faturas.get(p.fatura.mes)!,
      compraParceladaId: compra.id,
      parcelaNumero: p.numero,
      parcelaTotal: p.total,
    })),
  });
  return criados.sort((a, b) => a.parcelaNumero! - b.parcelaNumero!);
}

export async function totalFatura(db: Db, faturaId: string) {
  const r = await db.lancamento.aggregate({ where: { faturaId }, _sum: { valor: true } });
  return r._sum.valor ?? 0;
}

/** Pagar fatura = saída na conta vinculada ao cartão (ou em `contaId`) + marca a fatura como paga. */
export async function pagarFatura(db: Db, userId: string, faturaId: string, data: DataISO, contaId?: string | null) {
  const fatura = await db.fatura.findFirstOrThrow({
    where: { id: faturaId, cartao: { userId } },
    include: { cartao: true },
  });
  if (fatura.pagaEm) throw conflito("Esta fatura já foi paga");
  const total = await totalFatura(db, faturaId);
  if (total <= 0) throw invalido("Fatura sem itens para pagar");
  const pagamento = await db.lancamento.create({
    data: {
      userId,
      tipo: "SAIDA",
      descricao: `Fatura ${fatura.cartao.nome}`,
      valor: total,
      data: toDate(data),
      status: "PAGO",
      contaId: contaId ?? fatura.cartao.contaPagamentoId,
    },
  });
  return db.fatura.update({
    where: { id: faturaId },
    data: { pagaEm: toDate(data), lancamentoPagamentoId: pagamento.id },
  });
}

export function periodoDaFatura(f: { mes: Date; dataFechamento: Date; dataVencimento: Date }): PeriodoFatura {
  return {
    mes: fromDate(f.mes).slice(0, 7),
    fechamento: fromDate(f.dataFechamento),
    vencimento: fromDate(f.dataVencimento),
  };
}
