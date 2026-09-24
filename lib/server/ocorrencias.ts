import type { Prisma, Recorrencia } from "@prisma/client";
import { fromDate, primeiroDia, toDate, ultimoDia, type DataISO, type MesISO } from "@/lib/finance/dates";
import { faturaDaCompra, type PeriodoFatura } from "@/lib/finance/fatura";
import { ocorrencias } from "@/lib/finance/recorrencia";
import { garantirFaturas } from "./faturas";

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
 * Gera como lançamentos PENDENTES as ocorrências das recorrências do usuário entre `mesDe` e
 * `mesAte` (inclusive). Idempotente: pula as já geradas e ainda usa `skipDuplicates` no unique
 * (recorrenciaId, ocorrenciaData) para aguentar duas requisições simultâneas.
 *
 * Número fixo de consultas, independente de quantos meses: 1 leitura, faturas em lote por
 * cartão e 1 createMany — importante com o banco remoto.
 */
export async function garantirOcorrencias(
  db: Db,
  userId: string,
  mesDe: MesISO,
  filtroRecorrenciaId?: string,
  mesAte: MesISO = mesDe,
) {
  const de = primeiroDia(mesDe);
  const ate = ultimoDia(mesAte);
  const recorrencias = await db.recorrencia.findMany({
    where: {
      userId,
      ativa: true,
      ...(filtroRecorrenciaId ? { id: filtroRecorrenciaId } : {}),
      dataInicio: { lte: toDate(ate) },
      OR: [{ dataFim: null }, { dataFim: { gte: toDate(de) } }],
    },
    include: {
      cartao: true,
      excecoes: { where: { data: { gte: toDate(de), lte: toDate(ate) } } },
      lancamentos: { where: { ocorrenciaData: { gte: toDate(de), lte: toDate(ate) } }, select: { ocorrenciaData: true } },
    },
  });

  type Nova = { r: (typeof recorrencias)[number]; data: DataISO; periodo?: PeriodoFatura };
  const novas: Nova[] = [];
  for (const r of recorrencias) {
    const geradas = new Set(r.lancamentos.map((l) => fromDate(l.ocorrenciaData!)));
    const excecoes = r.excecoes.map((e) => fromDate(e.data));
    for (const data of ocorrencias(regraDe(r), de, ate, excecoes)) {
      if (geradas.has(data)) continue;
      novas.push({ r, data, periodo: r.cartao ? faturaDaCompra(data, r.cartao) : undefined });
    }
  }
  if (novas.length === 0) return 0;

  // Faturas das ocorrências no cartão: um lote por cartão.
  const faturasPorCartao = new Map<string, Map<MesISO, string>>();
  const porCartao = new Map<string, PeriodoFatura[]>();
  for (const n of novas) {
    if (!n.r.cartaoId || !n.periodo) continue;
    porCartao.set(n.r.cartaoId, [...(porCartao.get(n.r.cartaoId) ?? []), n.periodo]);
  }
  for (const [cartaoId, periodos] of porCartao) {
    faturasPorCartao.set(cartaoId, await garantirFaturas(db, cartaoId, periodos));
  }

  const { count } = await db.lancamento.createMany({
    data: novas.map(({ r, data, periodo }) => ({
      userId: r.userId,
      tipo: r.tipo,
      descricao: r.descricao,
      valor: r.valor,
      data: toDate(data),
      status: "PENDENTE" as const,
      categoriaId: r.categoriaId,
      contaId: r.cartao ? null : r.contaId,
      cartaoId: r.cartaoId,
      faturaId: r.cartaoId && periodo ? faturasPorCartao.get(r.cartaoId)!.get(periodo.mes)! : null,
      recorrenciaId: r.id,
      ocorrenciaData: toDate(data),
    })),
    skipDuplicates: true,
  });
  return count;
}
