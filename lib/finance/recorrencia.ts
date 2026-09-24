import {
  addDias,
  addMesesMes,
  diaDaSemana,
  diaNoMes,
  mesDe,
  partesMes,
  primeiroDia,
  ultimoDia,
  type DataISO,
  type MesISO,
} from "./dates";

export type Frequencia = "MENSAL" | "SEMANAL" | "ANUAL";

export type RegraRecorrencia = {
  frequencia: Frequencia;
  /** Dia do mês (mensal/anual) ou dia da semana 0–6 (semanal). */
  dia: number;
  dataInicio: DataISO;
  dataFim?: DataISO | null;
  ativa: boolean;
};

/** Datas das ocorrências dentro de [de, ate], respeitando início, fim, pausa e exceções. */
export function ocorrencias(
  r: RegraRecorrencia,
  de: DataISO,
  ate: DataISO,
  excecoes: Iterable<DataISO> = [],
): DataISO[] {
  if (!r.ativa) return [];
  const inicio = de > r.dataInicio ? de : r.dataInicio;
  const fim = r.dataFim && r.dataFim < ate ? r.dataFim : ate;
  if (inicio > fim) return [];

  const candidatas: DataISO[] = [];
  if (r.frequencia === "SEMANAL") {
    for (let d = addDias(inicio, (r.dia - diaDaSemana(inicio) + 7) % 7); d <= fim; d = addDias(d, 7)) {
      candidatas.push(d);
    }
  } else {
    const mesAnual = partesMes(mesDe(r.dataInicio))[1];
    for (let m: MesISO = mesDe(inicio); m <= mesDe(fim); m = addMesesMes(m, 1)) {
      if (r.frequencia === "ANUAL" && partesMes(m)[1] !== mesAnual) continue;
      const d = diaNoMes(m, r.dia);
      if (d >= inicio && d <= fim) candidatas.push(d);
    }
  }

  const ex = new Set(excecoes);
  return candidatas.filter((d) => !ex.has(d));
}

export function ocorrenciasNoMes(r: RegraRecorrencia, mes: MesISO, excecoes: Iterable<DataISO> = []): DataISO[] {
  return ocorrencias(r, primeiroDia(mes), ultimoDia(mes), excecoes);
}

/**
 * Ocorrências do mês que ainda não viraram lançamento. Rodar de novo passando as já geradas
 * retorna [] — é isso que torna a geração idempotente.
 */
export function ocorrenciasFaltantes(
  r: RegraRecorrencia,
  mes: MesISO,
  jaGeradas: Iterable<DataISO>,
  excecoes: Iterable<DataISO> = [],
): DataISO[] {
  const existentes = new Set(jaGeradas);
  return ocorrenciasNoMes(r, mes, excecoes).filter((d) => !existentes.has(d));
}

/** Peso mensal da recorrência (semanal ≈ 52/12, anual = 1/12), para o "total comprometido". */
export function valorMensalEquivalente(valor: number, frequencia: Frequencia): number {
  if (frequencia === "SEMANAL") return Math.round((valor * 52) / 12);
  if (frequencia === "ANUAL") return Math.round(valor / 12);
  return valor;
}
