/**
 * Datas de competência como string "YYYY-MM-DD" (DataISO) e meses como "YYYY-MM" (MesISO).
 * Nada aqui depende do fuso da máquina: toda aritmética é feita em UTC sobre datas sem hora.
 */

export type DataISO = string;
export type MesISO = string;

export const TIMEZONE = "America/Sao_Paulo";

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_MES = /^\d{4}-\d{2}$/;

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export function isDataISO(v: string): v is DataISO {
  if (!RE_DATA.test(v)) return false;
  const [y, m, d] = partes(v);
  return m >= 1 && m <= 12 && d >= 1 && d <= diasNoMes(y, m);
}

export function isMesISO(v: string): v is MesISO {
  if (!RE_MES.test(v)) return false;
  const m = Number(v.slice(5, 7));
  return m >= 1 && m <= 12;
}

export function partes(data: DataISO): [number, number, number] {
  return [Number(data.slice(0, 4)), Number(data.slice(5, 7)), Number(data.slice(8, 10))];
}

export function partesMes(mes: MesISO): [number, number] {
  return [Number(mes.slice(0, 4)), Number(mes.slice(5, 7))];
}

export function montarData(ano: number, mes: number, dia: number): DataISO {
  return `${pad(ano, 4)}-${pad(mes)}-${pad(dia)}`;
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Dia `dia` do mês, limitado ao último dia (31 em fevereiro → 28/29). */
export function diaNoMes(mes: MesISO, dia: number): DataISO {
  const [ano, m] = partesMes(mes);
  return montarData(ano, m, Math.min(Math.max(dia, 1), diasNoMes(ano, m)));
}

export function mesDe(data: DataISO): MesISO {
  return data.slice(0, 7);
}

export function addMesesMes(mes: MesISO, n: number): MesISO {
  const [ano, m] = partesMes(mes);
  const total = ano * 12 + (m - 1) + n;
  return `${pad(Math.floor(total / 12), 4)}-${pad((total % 12) + 1)}`;
}

/** Soma meses mantendo o dia, com clamp no fim do mês (31/jan + 1 → 28/fev). */
export function addMeses(data: DataISO, n: number): DataISO {
  return diaNoMes(addMesesMes(mesDe(data), n), partes(data)[2]);
}

export function addDias(data: DataISO, n: number): DataISO {
  const d = toDate(data);
  d.setUTCDate(d.getUTCDate() + n);
  return fromDate(d);
}

export function primeiroDia(mes: MesISO): DataISO {
  return `${mes}-01`;
}

export function ultimoDia(mes: MesISO): DataISO {
  const [ano, m] = partesMes(mes);
  return montarData(ano, m, diasNoMes(ano, m));
}

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(data: DataISO): number {
  return toDate(data).getUTCDay();
}

export function diffDias(de: DataISO, ate: DataISO): number {
  return Math.round((toDate(ate).getTime() - toDate(de).getTime()) / 86_400_000);
}

/** Converte DataISO para o Date que o Prisma grava em colunas @db.Date. */
export function toDate(data: DataISO): Date {
  return new Date(`${data}T00:00:00.000Z`);
}

/** Converte um Date vindo de coluna @db.Date para DataISO. */
export function fromDate(d: Date): DataISO {
  return d.toISOString().slice(0, 10);
}

/** "Hoje" no fuso de São Paulo, independente do fuso do servidor. */
export function hojeSP(agora: Date = new Date()): DataISO {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function mesAtualSP(agora: Date = new Date()): MesISO {
  return mesDe(hojeSP(agora));
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** "setembro 2026" */
export function nomeMes(mes: MesISO): string {
  const [ano, m] = partesMes(mes);
  return `${MESES[m - 1]} ${ano}`;
}

/** "set" */
export function nomeMesCurto(mes: MesISO): string {
  return MESES[partesMes(mes)[1] - 1].slice(0, 3);
}

/** "24/09" */
export function formatarDiaMes(data: DataISO): string {
  const [, m, d] = partes(data);
  return `${pad(d)}/${pad(m)}`;
}

/** "24/09/2026" */
export function formatarData(data: DataISO): string {
  const [y, m, d] = partes(data);
  return `${pad(d)}/${pad(m)}/${y}`;
}

/** "Hoje", "Ontem", "Amanhã" ou "quinta, 24 de setembro". */
export function rotuloDia(data: DataISO, hoje: DataISO): string {
  const diff = diffDias(hoje, data);
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === 1) return "Amanhã";
  const [, m, d] = partes(data);
  return `${DIAS_SEMANA[diaDaSemana(data)]}, ${d} de ${MESES[m - 1]}`;
}
