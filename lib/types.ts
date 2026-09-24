/** Tipos serializáveis compartilhados entre server e client (sem Prisma). */
import type { DataISO, MesISO } from "@/lib/finance/dates";
import type { StatusFatura } from "@/lib/finance/fatura";

export type TipoConta = "CORRENTE" | "CARTEIRA" | "INVESTIMENTO";
export type TipoCategoria = "ENTRADA" | "SAIDA" | "AMBOS";
export type TipoLancamento = "ENTRADA" | "SAIDA" | "TRANSFERENCIA";
export type Status = "PAGO" | "PENDENTE";
export type Frequencia = "MENSAL" | "SEMANAL" | "ANUAL";

export type ContaDTO = {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldo: number;
  cor: string;
  arquivada: boolean;
  ordem: number;
};

export type CategoriaDTO = {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  tipo: TipoCategoria;
  arquivada: boolean;
};

export type CartaoDTO = {
  id: string;
  nome: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  contaPagamentoId: string;
  cor: string;
  arquivado: boolean;
};

export type LancamentoDTO = {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  data: DataISO;
  status: Status;
  observacao: string | null;
  categoriaId: string | null;
  contaId: string | null;
  contaDestinoId: string | null;
  cartaoId: string | null;
  faturaId: string | null;
  recorrenciaId: string | null;
  ocorrenciaData: DataISO | null;
  compraParceladaId: string | null;
  parcelaNumero: number | null;
  parcelaTotal: number | null;
  pagamentoFatura: boolean;
  caixinhaId: string | null;
};

export type RecorrenciaDTO = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "ENTRADA" | "SAIDA";
  categoriaId: string | null;
  contaId: string | null;
  cartaoId: string | null;
  frequencia: Frequencia;
  dia: number;
  dataInicio: DataISO;
  dataFim: DataISO | null;
  ativa: boolean;
};

export type CaixinhaDTO = {
  id: string;
  nome: string;
  valorAlvo: number | null;
  prazo: DataISO | null;
  planejadoMensal: number | null;
  cor: string;
  icone: string;
  arquivada: boolean;
  saldo: number;
};

export type FaturaDTO = {
  id: string;
  cartaoId: string;
  mes: MesISO;
  fechamento: DataISO;
  vencimento: DataISO;
  total: number;
  status: StatusFatura;
  pagaEm: DataISO | null;
};

/** Contas, categorias e cartões — tudo que os formulários precisam para montar selects. */
export type Cadastros = {
  contas: ContaDTO[];
  categorias: CategoriaDTO[];
  cartoes: CartaoDTO[];
};
