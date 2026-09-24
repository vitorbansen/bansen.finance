import { addMesesMes, diaNoMes, mesDe, partes, type DataISO, type MesISO } from "./dates";

export type RegraCartao = { diaFechamento: number; diaVencimento: number };

export type PeriodoFatura = {
  /** Mês de vencimento — identifica a fatura. */
  mes: MesISO;
  fechamento: DataISO;
  vencimento: DataISO;
};

export type StatusFatura = "ABERTA" | "FECHADA" | "PAGA";

/** Fatura cujo fechamento acontece no mês `mesFechamento`. */
export function faturaPorMesFechamento(mesFechamento: MesISO, c: RegraCartao): PeriodoFatura {
  const fechamento = diaNoMes(mesFechamento, c.diaFechamento);
  // Vencimento depois do fechamento no mesmo mês; senão, no mês seguinte.
  const mesVenc = c.diaVencimento > c.diaFechamento ? mesFechamento : addMesesMes(mesFechamento, 1);
  return { mes: mesVenc, fechamento, vencimento: diaNoMes(mesVenc, c.diaVencimento) };
}

/** Fatura que vence no mês `mes`. */
export function faturaDoMes(mes: MesISO, c: RegraCartao): PeriodoFatura {
  const mesFechamento = c.diaVencimento > c.diaFechamento ? mes : addMesesMes(mes, -1);
  return faturaPorMesFechamento(mesFechamento, c);
}

/**
 * Em qual fatura cai uma compra. Compra feita no dia do fechamento ou depois vai para a
 * fatura seguinte (a fatura já fechou — é o "melhor dia de compra").
 */
export function faturaDaCompra(dataCompra: DataISO, c: RegraCartao): PeriodoFatura {
  const mes = mesDe(dataCompra);
  const diaFechamentoDoMes = partes(diaNoMes(mes, c.diaFechamento))[2];
  const mesFechamento = partes(dataCompra)[2] < diaFechamentoDoMes ? mes : addMesesMes(mes, 1);
  return faturaPorMesFechamento(mesFechamento, c);
}

export function statusFatura(f: { fechamento: DataISO; pagaEm?: DataISO | null }, hoje: DataISO): StatusFatura {
  if (f.pagaEm) return "PAGA";
  return hoje >= f.fechamento ? "FECHADA" : "ABERTA";
}

/**
 * Limite disponível: limite − tudo que está em faturas ainda não pagas
 * (inclui parcelas futuras, como fazem os bancos).
 */
export function limiteDisponivel(limite: number, totaisFaturasNaoPagas: number[]): number {
  return limite - totaisFaturasNaoPagas.reduce((a, b) => a + b, 0);
}
