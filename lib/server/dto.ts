/**
 * Formatos serializáveis (datas como "YYYY-MM-DD") usados pelas páginas e pelas respostas da API.
 * Os tipos ficam em lib/types.ts para os componentes client importarem sem puxar Prisma.
 */
import type { Caixinha, Cartao, Categoria, Conta, Lancamento, Recorrencia } from "@prisma/client";
import { fromDate } from "@/lib/finance/dates";
import type {
  CaixinhaDTO,
  CartaoDTO,
  CategoriaDTO,
  ContaDTO,
  LancamentoDTO,
  RecorrenciaDTO,
} from "@/lib/types";

export const contaDTO = (c: Conta, saldo: number): ContaDTO => ({
  id: c.id,
  nome: c.nome,
  tipo: c.tipo,
  saldoInicial: c.saldoInicial,
  saldo,
  cor: c.cor,
  arquivada: c.arquivada,
  ordem: c.ordem,
});

export const categoriaDTO = (c: Categoria): CategoriaDTO => ({
  id: c.id,
  nome: c.nome,
  icone: c.icone,
  cor: c.cor,
  tipo: c.tipo,
  arquivada: c.arquivada,
});

export const cartaoDTO = (c: Cartao): CartaoDTO => ({
  id: c.id,
  nome: c.nome,
  limite: c.limite,
  diaFechamento: c.diaFechamento,
  diaVencimento: c.diaVencimento,
  contaPagamentoId: c.contaPagamentoId,
  cor: c.cor,
  arquivado: c.arquivado,
});

export const lancamentoDTO = (
  l: Lancamento & { faturaPaga?: { id: string } | null; movimentacao?: { caixinhaId: string } | null },
): LancamentoDTO => ({
  id: l.id,
  tipo: l.tipo,
  descricao: l.descricao,
  valor: l.valor,
  data: fromDate(l.data),
  status: l.status,
  observacao: l.observacao,
  categoriaId: l.categoriaId,
  contaId: l.contaId,
  contaDestinoId: l.contaDestinoId,
  cartaoId: l.cartaoId,
  faturaId: l.faturaId,
  recorrenciaId: l.recorrenciaId,
  ocorrenciaData: l.ocorrenciaData ? fromDate(l.ocorrenciaData) : null,
  compraParceladaId: l.compraParceladaId,
  parcelaNumero: l.parcelaNumero,
  parcelaTotal: l.parcelaTotal,
  pagamentoFatura: !!l.faturaPaga,
  caixinhaId: l.movimentacao?.caixinhaId ?? null,
});

export const recorrenciaDTO = (r: Recorrencia): RecorrenciaDTO => ({
  id: r.id,
  descricao: r.descricao,
  valor: r.valor,
  tipo: r.tipo === "ENTRADA" ? "ENTRADA" : "SAIDA",
  categoriaId: r.categoriaId,
  contaId: r.contaId,
  cartaoId: r.cartaoId,
  frequencia: r.frequencia,
  dia: r.dia,
  dataInicio: fromDate(r.dataInicio),
  dataFim: r.dataFim ? fromDate(r.dataFim) : null,
  ativa: r.ativa,
});

export const caixinhaDTO = (c: Caixinha, saldo: number): CaixinhaDTO => ({
  id: c.id,
  nome: c.nome,
  valorAlvo: c.valorAlvo,
  prazo: c.prazo ? fromDate(c.prazo) : null,
  planejadoMensal: c.planejadoMensal,
  cor: c.cor,
  icone: c.icone,
  arquivada: c.arquivada,
  saldo,
});
