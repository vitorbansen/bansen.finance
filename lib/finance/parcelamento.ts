import { addMeses, addMesesMes, mesDe, type DataISO } from "./dates";
import { faturaDaCompra, faturaPorMesFechamento, type PeriodoFatura, type RegraCartao } from "./fatura";
import { dividirParcelas, type Centavos } from "./money";

export type Parcela = {
  numero: number;
  total: number;
  valor: Centavos;
  /** Data de referência da parcela (mês a mês a partir da compra). */
  data: DataISO;
  fatura: PeriodoFatura;
};

/** Compra em N vezes: N parcelas, uma em cada fatura consecutiva a partir da fatura da compra. */
export function gerarParcelas(
  compra: { valorTotal: Centavos; nParcelas: number; dataCompra: DataISO },
  cartao: RegraCartao,
): Parcela[] {
  const valores = dividirParcelas(compra.valorTotal, compra.nParcelas);
  const mesFechamento0 = mesDe(faturaDaCompra(compra.dataCompra, cartao).fechamento);
  return valores.map((valor, i) => ({
    numero: i + 1,
    total: compra.nParcelas,
    valor,
    data: addMeses(compra.dataCompra, i),
    fatura: faturaPorMesFechamento(addMesesMes(mesFechamento0, i), cartao),
  }));
}

/** "Notebook (3/10)" */
export function descricaoParcela(descricao: string, numero: number, total: number): string {
  return total > 1 ? `${descricao} (${numero}/${total})` : descricao;
}
