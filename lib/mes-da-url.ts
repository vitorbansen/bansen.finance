import { isMesISO, mesAtualSP, type MesISO } from "@/lib/finance/dates";

/** Lê ?mes=AAAA-MM das páginas; inválido ou ausente = mês atual em São Paulo. */
export function mesDaUrl(searchParams: { mes?: string | string[] }): MesISO {
  const m = Array.isArray(searchParams.mes) ? searchParams.mes[0] : searchParams.mes;
  return m && isMesISO(m) ? m : mesAtualSP();
}
