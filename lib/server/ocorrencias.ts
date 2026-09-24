import type { Cartao, Prisma, Recorrencia } from "@prisma/client";
import { fromDate, primeiroDia, toDate, ultimoDia, type DataISO, type MesISO } from "@/lib/finance/dates";
import { ocorrenciasFaltantes } from "@/lib/finance/recorrencia";
import { faturaIdDaCompra } from "./faturas";

type Db = Prisma.TransactionClient;

export function regraDe(r: Pick<Recorrencia, "frequencia" | "dia" | "dataInicio" | "dataFim" | "ativa">) {
  return {
    frequencia: r.frequencia,
    dia: r.dia,
    dataInicio: fromDate(r.dataInicio),
    dataFim: r.dataFim ? fromDate(r.dataFim) : null,
    ativa: r.ativa,
  };
}

/**
 * Gera como lançamentos PENDENTES as ocorrências das recorrências do usuário no mês.
 * Idempotente: pula as já geradas e ainda usa `skipDuplicates` no unique
 * (recorrenciaId, ocorrenciaData) para aguentar duas requisições simultâneas.
 */
export async function garantirOcorrencias(db: Db, userId: string, mes: MesISO, filtroRecorrenciaId?: string) {
  const de = toDate(primeiroDia(mes));
  const ate = toDate(ultimoDia(mes));
  const recorrencias = await db.recorrencia.findMany({
    where: {
      userId,
      ativa: true,
      ...(filtroRecorrenciaId ? { id: filtroRecorrenciaId } : {}),
      dataInicio: { lte: ate },
      OR: [{ dataFim: null }, { dataFim: { gte: de } }],
    },
    include: {
      cartao: true,
      excecoes: { where: { data: { gte: de, lte: ate } } },
      lancamentos: { where: { ocorrenciaData: { gte: de, lte: ate } }, select: { ocorrenciaData: true } },
    },
  });

  const novos: Prisma.LancamentoCreateManyInput[] = [];
  for (const r of recorrencias) {
    const faltantes = ocorrenciasFaltantes(
      regraDe(r),
      mes,
      r.lancamentos.map((l) => fromDate(l.ocorrenciaData!)),
      r.excecoes.map((e) => fromDate(e.data)),
    );
    for (const data of faltantes) novos.push(await montarOcorrencia(db, r, data));
  }
  if (novos.length === 0) return 0;
  const { count } = await db.lancamento.createMany({ data: novos, skipDuplicates: true });
  return count;
}

async function montarOcorrencia(
  db: Db,
  r: Recorrencia & { cartao: Cartao | null },
  data: DataISO,
): Promise<Prisma.LancamentoCreateManyInput> {
  return {
    userId: r.userId,
    tipo: r.tipo,
    descricao: r.descricao,
    valor: r.valor,
    data: toDate(data),
    status: "PENDENTE",
    categoriaId: r.categoriaId,
    contaId: r.cartao ? null : r.contaId,
    cartaoId: r.cartaoId,
    faturaId: r.cartao ? await faturaIdDaCompra(db, r.cartao, data) : null,
    recorrenciaId: r.id,
    ocorrenciaData: toDate(data),
  };
}
