import type { Lancamento, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  addDias,
  addMesesMes,
  fromDate,
  hojeSP,
  mesAtualSP,
  mesDe,
  primeiroDia,
  toDate,
  ultimoDia,
  type DataISO,
  type MesISO,
} from "@/lib/finance/dates";
import {
  calcularSaldoLivre,
  compararGastos,
  projetarProximoMes,
  proximosVencimentos,
  resumoMes,
  saldoCaixinha,
  saldosPorConta,
  totalGuardado,
  type FaturaR,
  type LancamentoR,
} from "@/lib/finance/resumo";
import { lancamentosAgregadosPorConta } from "./contas";
import { periodoDaFatura } from "./faturas";
import { regraDe } from "./ocorrencias";
import { garantirMes } from "./recorrencias";

const paraR = (l: Lancamento & { faturaPaga?: { id: string } | null }): LancamentoR => ({
  id: l.id,
  tipo: l.tipo,
  descricao: l.descricao,
  valor: l.valor,
  data: fromDate(l.data),
  status: l.status,
  categoriaId: l.categoriaId,
  contaId: l.contaId,
  contaDestinoId: l.contaDestinoId,
  cartaoId: l.cartaoId,
  recorrenciaId: l.recorrenciaId,
  ocorrenciaData: l.ocorrenciaData ? fromDate(l.ocorrenciaData) : null,
  pagamentoFatura: !!l.faturaPaga,
});

const max = (a: DataISO, b: DataISO) => (a > b ? a : b);

/** Tudo que a tela Início precisa para o mês selecionado. */
export async function montarResumo(userId: string, mes: MesISO) {
  const hoje = hojeSP();
  const atual = mesAtualSP();
  const proximo = addMesesMes(mes, 1);
  await garantirMes(prisma, userId, mes);

  const fimProximo = ultimoDia(proximo);
  const limitePendentes = max(fimProximo, addDias(hoje, 7));

  const filtroFaturas = {
    cartao: { userId },
    OR: [
      { pagaEm: null, dataVencimento: { lte: toDate(fimProximo) } },
      { mes: { in: [toDate(primeiroDia(mes)), toDate(primeiroDia(proximo))] } },
    ],
  } satisfies Prisma.FaturaWhereInput;

  // Tudo em paralelo: com o banco remoto, cada ida e volta conta.
  const [contas, agregados, caixinhas, pendentes, doPeriodo, gerados, faturasDb, totaisFaturas, recorrencias, cartoes, categorias] =
    await Promise.all([
      prisma.conta.findMany({ where: { userId } }),
      lancamentosAgregadosPorConta(prisma, userId),
      prisma.caixinha.findMany({
        where: { userId, arquivada: false },
        include: { movimentacoes: { select: { tipo: true, valor: true, data: true } } },
      }),
      prisma.lancamento.findMany({
        where: { userId, status: "PENDENTE", cartaoId: null, data: { lte: toDate(limitePendentes) } },
      }),
      // Mês anterior + mês selecionado: gastos por categoria e comparação.
      prisma.lancamento.findMany({
        where: { userId, data: { gte: toDate(primeiroDia(addMesesMes(mes, -1))), lte: toDate(ultimoDia(mes)) } },
        include: { faturaPaga: { select: { id: true } } },
      }),
      // Ocorrências já geradas no mês e no próximo (para a projeção não contar duas vezes).
      prisma.lancamento.findMany({
        where: {
          userId,
          recorrenciaId: { not: null },
          ocorrenciaData: { gte: toDate(primeiroDia(mes)), lte: toDate(fimProximo) },
        },
      }),
      prisma.fatura.findMany({ where: filtroFaturas, include: { cartao: { select: { nome: true } } } }),
      prisma.lancamento.groupBy({ by: ["faturaId"], where: { fatura: filtroFaturas }, _sum: { valor: true } }),
      prisma.recorrencia.findMany({
        where: { userId, ativa: true },
        include: { excecoes: { where: { data: { gte: toDate(primeiroDia(mes)), lte: toDate(fimProximo) } } } },
      }),
      prisma.cartao.findMany({ where: { userId } }),
      prisma.categoria.findMany({ where: { userId } }),
    ]);

  const totais = new Map(totaisFaturas.map((g) => [g.faturaId!, g._sum.valor ?? 0]));
  const faturas: FaturaR[] = faturasDb.map((f) => {
    const p = periodoDaFatura(f);
    return {
      id: f.id,
      cartaoId: f.cartaoId,
      cartaoNome: f.cartao.nome,
      mes: p.mes,
      vencimento: p.vencimento,
      total: totais.get(f.id) ?? 0,
      pagaEm: f.pagaEm ? fromDate(f.pagaEm) : null,
    };
  });

  // Saldos.
  const saldos = saldosPorConta(contas, agregados);
  const saldoTotal = contas.reduce((a, c) => a + (saldos.get(c.id) ?? 0), 0);
  const saldosCaixinhas = caixinhas.map((c) => saldoCaixinha(c.movimentacoes));

  // Quanto falta guardar: do mês atual até o selecionado (mês passado: só ele).
  const depositado = (movs: { tipo: string; valor: number; data: Date }[], m: MesISO) =>
    movs.filter((x) => x.tipo === "DEPOSITO" && mesDe(fromDate(x.data)) === m).reduce((a, x) => a + x.valor, 0);
  const mesesGuardar: MesISO[] = [];
  for (let m = mes < atual ? mes : atual; m <= mes; m = addMesesMes(m, 1)) mesesGuardar.push(m);
  const caixinhasR = caixinhas.flatMap((c) =>
    mesesGuardar.map((m) => ({ planejadoMensal: c.planejadoMensal, depositadoNoMes: depositado(c.movimentacoes, m) })),
  );

  const pendentesR = pendentes.map(paraR);
  const saldoLivre = calcularSaldoLivre({
    mes,
    contas,
    lancamentos: [...agregados, ...pendentesR],
    faturas,
    caixinhas: caixinhasR,
  });

  const periodoR = doPeriodo.map(paraR);
  const resumo = resumoMes(mes, periodoR, faturas);

  const excecoes = new Map(recorrencias.map((r) => [r.id, r.excecoes.map((e) => fromDate(e.data))]));
  const projecao = projetarProximoMes({
    mesAtual: mes,
    sobraDoMes: saldoLivre.saldoLivre,
    recorrencias: recorrencias.map((r) => ({ ...regraDe(r), id: r.id, tipo: r.tipo, valor: r.valor, contaId: r.contaId, cartaoId: r.cartaoId })),
    cartoes,
    // Sem repetir: uma ocorrência pendente do próximo mês está nas duas listas.
    lancamentos: [
      ...new Map(
        [...pendentesR.filter((l) => mesDe(l.data) === proximo), ...gerados.map(paraR)].map((l) => [l.id, l]),
      ).values(),
    ],
    faturas: faturas.filter((f) => f.mes === proximo),
    planejadoCaixinhas: caixinhas.reduce((a, c) => a + (c.planejadoMensal ?? 0), 0),
    excecoes,
  });

  const catPorId = new Map(categorias.map((c) => [c.id, c]));
  const gastos = compararGastos(periodoR, mes);

  return {
    mes,
    hoje,
    saldoTotal,
    saldoLivre,
    resumo,
    projecao,
    totalGuardado: totalGuardado(saldosCaixinhas, contas, agregados),
    guardadoCaixinhas: saldosCaixinhas.reduce((a, b) => a + b, 0),
    proximosVencimentos: proximosVencimentos(pendentesR, faturas, hoje, 7),
    gastos: {
      ...gastos,
      categorias: gastos.categorias.map((g) => {
        const c = g.categoriaId ? catPorId.get(g.categoriaId) : undefined;
        return { ...g, nome: c?.nome ?? "Sem categoria", cor: c?.cor ?? "#8E8E93", icone: c?.icone ?? "circle" };
      }),
    },
  };
}

export type Resumo = Awaited<ReturnType<typeof montarResumo>>;
