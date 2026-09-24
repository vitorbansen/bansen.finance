/**
 * Resumo do mês, saldo livre e projeção do próximo mês.
 *
 * Visão de caixa: compras no cartão NÃO são saída de conta — quem sai da conta é a fatura.
 * Assim nada é contado duas vezes: itens do cartão pesam via "faturas a vencer" até a fatura ser
 * paga, e depois via o lançamento de pagamento (saída realizada).
 * Transferências (entre contas e para caixinhas) nunca são receita nem despesa.
 */
import { addDias, addMesesMes, diffDias, primeiroDia, ultimoDia, type DataISO, type MesISO } from "./dates";
import { faturaDaCompra, type RegraCartao } from "./fatura";
import type { Centavos } from "./money";
import { ocorrenciasNoMes, valorMensalEquivalente, type RegraRecorrencia } from "./recorrencia";

export type TipoLancamento = "ENTRADA" | "SAIDA" | "TRANSFERENCIA";
export type TipoConta = "CORRENTE" | "CARTEIRA" | "INVESTIMENTO";

export type LancamentoR = {
  id?: string;
  tipo: TipoLancamento;
  descricao?: string;
  valor: Centavos;
  data: DataISO;
  status: "PAGO" | "PENDENTE";
  categoriaId?: string | null;
  contaId?: string | null;
  contaDestinoId?: string | null;
  cartaoId?: string | null;
  recorrenciaId?: string | null;
  ocorrenciaData?: DataISO | null;
  /** É o pagamento de uma fatura (saída de conta que não deve contar como gasto por categoria). */
  pagamentoFatura?: boolean;
};

export type ContaR = { id: string; tipo: TipoConta; saldoInicial: Centavos };

export type FaturaR = {
  id?: string;
  cartaoId: string;
  cartaoNome?: string;
  mes: MesISO;
  vencimento: DataISO;
  total: Centavos;
  pagaEm?: DataISO | null;
};

export type CaixinhaR = { planejadoMensal?: Centavos | null; depositadoNoMes: Centavos };

export type RecorrenciaR = RegraRecorrencia & {
  id: string;
  descricao?: string;
  tipo: TipoLancamento;
  valor: Centavos;
  contaId?: string | null;
  cartaoId?: string | null;
};

export type CartaoR = RegraCartao & { id: string };

const noMes = (data: DataISO, mes: MesISO) => data >= primeiroDia(mes) && data <= ultimoDia(mes);
const ehDeConta = (l: LancamentoR) => !l.cartaoId && !!l.contaId;
/** Sai dinheiro das contas: saída, ou transferência para fora (caixinha). Entre contas não conta. */
const ehSaida = (l: LancamentoR) => l.tipo === "SAIDA" || (l.tipo === "TRANSFERENCIA" && !l.contaDestinoId);
const somaValores = (ls: { valor: Centavos }[]) => ls.reduce((a, l) => a + l.valor, 0);

// ---------------------------------------------------------------- saldos

/** Saldo da conta considerando só lançamentos PAGOS. */
export function saldoConta(conta: ContaR, lancamentos: LancamentoR[]): Centavos {
  let saldo = conta.saldoInicial;
  for (const l of lancamentos) {
    if (l.status !== "PAGO" || l.cartaoId) continue;
    if (l.contaId === conta.id) saldo += l.tipo === "ENTRADA" ? l.valor : -l.valor;
    if (l.tipo === "TRANSFERENCIA" && l.contaDestinoId === conta.id) saldo += l.valor;
  }
  return saldo;
}

export function saldosPorConta(contas: ContaR[], lancamentos: LancamentoR[]): Map<string, Centavos> {
  return new Map(contas.map((c) => [c.id, saldoConta(c, lancamentos)]));
}

/** Contas "líquidas" (corrente e carteira) — as que pagam as contas do mês. */
export function saldoLiquido(contas: ContaR[], lancamentos: LancamentoR[]): Centavos {
  return contas.filter((c) => c.tipo !== "INVESTIMENTO").reduce((a, c) => a + saldoConta(c, lancamentos), 0);
}

export function totalGuardado(saldosCaixinhas: Centavos[], contas: ContaR[], lancamentos: LancamentoR[]): Centavos {
  const investimentos = contas
    .filter((c) => c.tipo === "INVESTIMENTO")
    .reduce((a, c) => a + saldoConta(c, lancamentos), 0);
  return saldosCaixinhas.reduce((a, b) => a + b, 0) + investimentos;
}

export function saldoCaixinha(movs: { tipo: "DEPOSITO" | "RESGATE"; valor: Centavos }[]): Centavos {
  return movs.reduce((a, m) => a + (m.tipo === "DEPOSITO" ? m.valor : -m.valor), 0);
}

/** Quanto ainda falta guardar no mês segundo o planejado de cada caixinha (nunca negativo). */
export function guardarRestante(caixinhas: CaixinhaR[]): Centavos {
  return caixinhas.reduce((a, c) => a + Math.max(0, (c.planejadoMensal ?? 0) - c.depositadoNoMes), 0);
}

// ---------------------------------------------------------------- resumo do mês

export type ResumoMes = {
  entradasRealizadas: Centavos;
  entradasPrevistas: Centavos;
  saidasRealizadas: Centavos;
  saidasPrevistas: Centavos;
  /** Faturas não pagas que vencem no mês (já incluídas em saidasPrevistas). */
  faturasAVencer: Centavos;
};

export function resumoMes(mes: MesISO, lancamentos: LancamentoR[], faturas: FaturaR[]): ResumoMes {
  const doMes = lancamentos.filter((l) => noMes(l.data, mes) && ehDeConta(l));
  const soma = (tipo: TipoLancamento, status: "PAGO" | "PENDENTE") =>
    somaValores(doMes.filter((l) => l.tipo === tipo && l.status === status));
  const faturasAVencer = somaValores(
    faturas.filter((f) => !f.pagaEm && noMes(f.vencimento, mes)).map((f) => ({ valor: f.total })),
  );
  return {
    entradasRealizadas: soma("ENTRADA", "PAGO"),
    entradasPrevistas: soma("ENTRADA", "PENDENTE"),
    saidasRealizadas: soma("SAIDA", "PAGO"),
    saidasPrevistas: soma("SAIDA", "PENDENTE") + faturasAVencer,
    faturasAVencer,
  };
}

// ---------------------------------------------------------------- saldo livre

export type SaldoLivre = {
  saldoContas: Centavos;
  entradasPendentes: Centavos;
  saidasPendentes: Centavos;
  faturasAVencer: Centavos;
  guardar: Centavos;
  saldoLivre: Centavos;
};

/**
 * Saldo livre do mês = saldo em contas líquidas + entradas pendentes − saídas pendentes
 * − faturas não pagas a vencer − valor planejado para guardar.
 * "Pendentes" inclui atrasados de meses anteriores: tudo não pago com data até o fim do mês.
 */
export function calcularSaldoLivre(p: {
  mes: MesISO;
  contas: ContaR[];
  lancamentos: LancamentoR[];
  faturas: FaturaR[];
  caixinhas: CaixinhaR[];
}): SaldoLivre {
  const fim = ultimoDia(p.mes);
  const pendentes = p.lancamentos.filter((l) => l.status === "PENDENTE" && ehDeConta(l) && l.data <= fim);
  const saldoContas = saldoLiquido(p.contas, p.lancamentos);
  const entradasPendentes = somaValores(pendentes.filter((l) => l.tipo === "ENTRADA"));
  const saidasPendentes = somaValores(pendentes.filter(ehSaida));
  const faturasAVencer = p.faturas.filter((f) => !f.pagaEm && f.vencimento <= fim).reduce((a, f) => a + f.total, 0);
  const guardar = guardarRestante(p.caixinhas);
  return {
    saldoContas,
    entradasPendentes,
    saidasPendentes,
    faturasAVencer,
    guardar,
    saldoLivre: saldoContas + entradasPendentes - saidasPendentes - faturasAVencer - guardar,
  };
}

// ---------------------------------------------------------------- projeção

export type Projecao = {
  mes: MesISO;
  sobraDoMes: Centavos;
  entradas: Centavos;
  saidas: Centavos;
  faturas: Centavos;
  guardar: Centavos;
  saldo: Centavos;
};

/**
 * Projeção do próximo mês = o que sobra deste mês + entradas previstas − saídas previstas em conta
 * − faturas do próximo mês (parcelas e compras já lançadas + recorrências no cartão) − planejado das caixinhas.
 *
 * Recorrências que ainda não viraram lançamento são projetadas pela regra; as que já foram geradas
 * são contadas pelo lançamento (sem duplicar).
 */
export function projetarProximoMes(p: {
  mesAtual: MesISO;
  sobraDoMes: Centavos;
  recorrencias: RecorrenciaR[];
  cartoes: CartaoR[];
  /** Lançamentos existentes com data no próximo mês e também no mês anterior a ele (para faturas). */
  lancamentos: LancamentoR[];
  /** Faturas já existentes do próximo mês (total dos itens já lançados). */
  faturas: FaturaR[];
  planejadoCaixinhas: Centavos;
  excecoes?: Map<string, DataISO[]>;
}): Projecao {
  const mes = addMesesMes(p.mesAtual, 1);
  const geradas = new Set(
    p.lancamentos.filter((l) => l.recorrenciaId && l.ocorrenciaData).map((l) => `${l.recorrenciaId}|${l.ocorrenciaData}`),
  );
  const naoGerada = (r: RecorrenciaR, d: DataISO) => !geradas.has(`${r.id}|${d}`);

  // Contas: pendentes já lançados + ocorrências ainda não geradas.
  const pendentesConta = p.lancamentos.filter((l) => noMes(l.data, mes) && ehDeConta(l) && l.status === "PENDENTE");
  let entradas = somaValores(pendentesConta.filter((l) => l.tipo === "ENTRADA"));
  let saidas = somaValores(pendentesConta.filter(ehSaida));
  for (const r of p.recorrencias) {
    if (r.cartaoId) continue;
    const n = ocorrenciasNoMes(r, mes, p.excecoes?.get(r.id)).filter((d) => naoGerada(r, d)).length;
    if (r.tipo === "ENTRADA") entradas += n * r.valor;
    else saidas += n * r.valor;
  }

  // Cartões: fatura que vence no próximo mês = itens já lançados + recorrências no cartão que caem nela.
  let faturas = 0;
  for (const c of p.cartoes) {
    const f = p.faturas.find((x) => x.cartaoId === c.id && x.mes === mes);
    if (f?.pagaEm) continue;
    faturas += f?.total ?? 0;
    for (const r of p.recorrencias.filter((x) => x.cartaoId === c.id)) {
      // A fatura de `mes` pode receber compras do próprio mês e do anterior.
      for (const m of [addMesesMes(mes, -1), mes]) {
        for (const d of ocorrenciasNoMes(r, m, p.excecoes?.get(r.id))) {
          if (naoGerada(r, d) && faturaDaCompra(d, c).mes === mes) faturas += r.valor;
        }
      }
    }
  }

  const guardar = p.planejadoCaixinhas;
  return {
    mes,
    sobraDoMes: p.sobraDoMes,
    entradas,
    saidas,
    faturas,
    guardar,
    saldo: p.sobraDoMes + entradas - saidas - faturas - guardar,
  };
}

// ---------------------------------------------------------------- gastos por categoria

export type GastoCategoria = { categoriaId: string | null; total: Centavos; anterior: Centavos };

/** Saídas do mês por categoria (inclui compras no cartão; exclui pagamento de fatura e transferências). */
export function gastosPorCategoria(lancamentos: LancamentoR[], mes: MesISO): Map<string | null, Centavos> {
  const mapa = new Map<string | null, Centavos>();
  for (const l of lancamentos) {
    if (l.tipo !== "SAIDA" || l.pagamentoFatura || !noMes(l.data, mes)) continue;
    const k = l.categoriaId ?? null;
    mapa.set(k, (mapa.get(k) ?? 0) + l.valor);
  }
  return mapa;
}

export function compararGastos(lancamentos: LancamentoR[], mes: MesISO) {
  const atual = gastosPorCategoria(lancamentos, mes);
  const anterior = gastosPorCategoria(lancamentos, addMesesMes(mes, -1));
  const chaves = new Set([...atual.keys(), ...anterior.keys()]);
  const categorias: GastoCategoria[] = [...chaves]
    .map((k) => ({ categoriaId: k, total: atual.get(k) ?? 0, anterior: anterior.get(k) ?? 0 }))
    .filter((g) => g.total > 0 || g.anterior > 0)
    .sort((a, b) => b.total - a.total || b.anterior - a.anterior);
  const total = categorias.reduce((a, g) => a + g.total, 0);
  const totalAnterior = categorias.reduce((a, g) => a + g.anterior, 0);
  return { categorias, total, totalAnterior, variacao: total - totalAnterior };
}

// ---------------------------------------------------------------- próximos vencimentos

export type Vencimento = {
  tipo: "LANCAMENTO" | "FATURA";
  id?: string;
  descricao: string;
  valor: Centavos;
  data: DataISO;
  entrada: boolean;
  atrasado: boolean;
  diasAte: number;
};

/** Pendências em conta e faturas não pagas que vencem nos próximos `dias` dias (e as atrasadas). */
export function proximosVencimentos(
  lancamentos: LancamentoR[],
  faturas: FaturaR[],
  hoje: DataISO,
  dias = 7,
): Vencimento[] {
  const limite = addDias(hoje, dias);
  const itens: Vencimento[] = [
    ...lancamentos
      .filter((l) => l.status === "PENDENTE" && ehDeConta(l) && l.data <= limite)
      .map((l) => ({
        tipo: "LANCAMENTO" as const,
        id: l.id,
        descricao: l.descricao ?? "",
        valor: l.valor,
        data: l.data,
        entrada: l.tipo === "ENTRADA",
        atrasado: l.data < hoje,
        diasAte: diffDias(hoje, l.data),
      })),
    ...faturas
      .filter((f) => !f.pagaEm && f.total > 0 && f.vencimento <= limite)
      .map((f) => ({
        tipo: "FATURA" as const,
        id: f.id,
        descricao: `Fatura ${f.cartaoNome ?? ""}`.trim(),
        valor: f.total,
        data: f.vencimento,
        entrada: false,
        atrasado: f.vencimento < hoje,
        diasAte: diffDias(hoje, f.vencimento),
      })),
  ];
  return itens.sort((a, b) => a.data.localeCompare(b.data));
}

// ---------------------------------------------------------------- recorrências

/** Total mensal comprometido com recorrências ativas (saídas e entradas). */
export function totalRecorrencias(recorrencias: RecorrenciaR[]) {
  let saidas = 0;
  let entradas = 0;
  for (const r of recorrencias) {
    if (!r.ativa) continue;
    const v = valorMensalEquivalente(r.valor, r.frequencia);
    if (r.tipo === "ENTRADA") entradas += v;
    else if (r.tipo === "SAIDA") saidas += v;
  }
  return { saidas, entradas };
}
