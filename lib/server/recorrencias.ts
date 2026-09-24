import type { Prisma, Recorrencia } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  addDias,
  addMesesMes,
  diaDaSemana,
  fromDate,
  hojeSP,
  mesAtualSP,
  mesDe,
  partes,
  primeiroDia,
  toDate,
  type DataISO,
  type MesISO,
} from "@/lib/finance/dates";
import { faturaDaCompra } from "@/lib/finance/fatura";
import { ocorrenciasNoMes } from "@/lib/finance/recorrencia";
import { totalRecorrencias } from "@/lib/finance/resumo";
import type { recorrenciaAtualizarSchema, recorrenciaCriarSchema } from "@/lib/validators";
import { verificarReferencias } from "./dono";
import { recorrenciaDTO } from "./dto";
import { naoEncontrado } from "./erros";
import { garantirFatura } from "./faturas";
import { garantirOcorrencias, regraDe } from "./ocorrencias";

type Db = Prisma.TransactionClient;

/** Quantos meses à frente, no máximo, geramos ao abrir um mês futuro. */
const MAX_MESES_GERACAO = 24;

/**
 * Garante as ocorrências do mês pedido e, se ele estiver no futuro, também dos meses entre o atual
 * e ele (para o saldo acumulado não ter buracos). Idempotente.
 */
export async function garantirMes(db: Db, userId: string, mes: MesISO) {
  const atual = mesAtualSP();
  if (mes <= atual) return garantirOcorrencias(db, userId, mes);
  const limite = addMesesMes(atual, MAX_MESES_GERACAO);
  return garantirOcorrencias(db, userId, atual, undefined, mes < limite ? mes : limite);
}

export async function listarRecorrencias(userId: string) {
  const recs = await prisma.recorrencia.findMany({
    where: { userId, OR: [{ dataFim: null }, { dataFim: { gte: toDate(hojeSP()) } }] },
    orderBy: [{ ativa: "desc" }, { tipo: "asc" }, { dia: "asc" }],
  });
  const dtos = recs.map(recorrenciaDTO);
  return { recorrencias: dtos, totais: totalRecorrencias(dtos) };
}

export async function criarRecorrencia(userId: string, d: z.infer<typeof recorrenciaCriarSchema>) {
  return prisma.$transaction(async (tx) => {
    const { cartao } = await verificarReferencias(tx, userId, d);
    const rec = await tx.recorrencia.create({
      data: {
        userId,
        descricao: d.descricao,
        valor: d.valor,
        tipo: d.tipo,
        categoriaId: d.categoriaId ?? null,
        contaId: cartao ? null : d.contaId,
        cartaoId: cartao?.id ?? null,
        frequencia: d.frequencia,
        dia: d.dia,
        dataInicio: toDate(d.dataInicio),
        dataFim: d.dataFim ? toDate(d.dataFim) : null,
      },
    });
    // Materializa a partir do mês atual; meses passados só são gerados se forem abertos.
    const mesInicio = mesDe(d.dataInicio);
    await garantirOcorrencias(tx, userId, mesInicio > mesAtualSP() ? mesInicio : mesAtualSP(), rec.id);
    return recorrenciaDTO(rec);
  });
}

export type MudancasRecorrencia = Partial<
  Pick<Recorrencia, "descricao" | "valor" | "categoriaId" | "contaId" | "cartaoId" | "frequencia" | "dia" | "dataFim">
>;

/** Ponto de corte padrão ao editar pela tela de recorrências: início do mês atual (ou hoje, se semanal). */
function corteDaTela(frequencia: Recorrencia["frequencia"]): DataISO {
  return frequencia === "SEMANAL" ? hojeSP() : primeiroDia(mesAtualSP());
}

/** Ponto de corte ao editar "esta e as próximas" a partir de uma ocorrência. */
export function corteDaOcorrencia(frequencia: Recorrencia["frequencia"], ocorrencia: DataISO): DataISO {
  return frequencia === "SEMANAL" ? ocorrencia : primeiroDia(mesDe(ocorrencia));
}

/**
 * Altera a regra a partir de `aPartirDe`, preservando o histórico:
 * - se já havia ocorrências antes do corte, a regra antiga termina na véspera e nasce uma nova;
 * - ocorrências futuras pendentes e não editadas são apagadas e regeneradas pela nova regra;
 * - ocorrências futuras já pagas/editadas são religadas à nova regra (sem duplicar).
 * Retorna a regra vigente e o id do lançamento `manterId` já religado (se houver).
 */
export async function alterarRecorrencia(
  tx: Db,
  userId: string,
  recId: string,
  aPartirDe: DataISO,
  mudancas: MudancasRecorrencia,
  manterId?: string,
) {
  const rec = await tx.recorrencia.findFirst({ where: { id: recId, userId } });
  if (!rec) throw naoEncontrado("Recorrência");
  await verificarReferencias(tx, userId, mudancas);

  const inicioAntigo = fromDate(rec.dataInicio);
  const dados = {
    descricao: mudancas.descricao ?? rec.descricao,
    valor: mudancas.valor ?? rec.valor,
    categoriaId: mudancas.categoriaId !== undefined ? mudancas.categoriaId : rec.categoriaId,
    contaId: mudancas.contaId !== undefined ? mudancas.contaId : rec.contaId,
    cartaoId: mudancas.cartaoId !== undefined ? mudancas.cartaoId : rec.cartaoId,
    frequencia: mudancas.frequencia ?? rec.frequencia,
    dia: mudancas.dia ?? rec.dia,
    dataFim: mudancas.dataFim !== undefined ? mudancas.dataFim : rec.dataFim,
  };
  if (dados.cartaoId) dados.contaId = null;

  let vigente: Recorrencia;
  if (aPartirDe <= inicioAntigo) {
    vigente = await tx.recorrencia.update({ where: { id: rec.id }, data: dados });
  } else {
    await tx.recorrencia.update({ where: { id: rec.id }, data: { dataFim: toDate(addDias(aPartirDe, -1)) } });
    vigente = await tx.recorrencia.create({
      data: { ...dados, userId, tipo: rec.tipo, ativa: rec.ativa, dataInicio: toDate(aPartirDe) },
    });
  }

  const futuras = await tx.lancamento.findMany({
    where: { recorrenciaId: rec.id, ocorrenciaData: { gte: toDate(aPartirDe) } },
    orderBy: { ocorrenciaData: "asc" },
  });
  const apagar = futuras.filter((l) => l.status === "PENDENTE" && !l.editado && l.id !== manterId);
  const manter = futuras.filter((l) => !apagar.includes(l));
  const meses = new Set(futuras.map((l) => mesDe(fromDate(l.ocorrenciaData!))));

  await tx.lancamento.deleteMany({ where: { id: { in: apagar.map((l) => l.id) } } });
  // Solta a chave de idempotência antes de religar (evita colisão no unique).
  await tx.lancamento.updateMany({
    where: { id: { in: manter.map((l) => l.id) } },
    data: { ocorrenciaData: null },
  });

  const cartao = vigente.cartaoId ? await tx.cartao.findUnique({ where: { id: vigente.cartaoId } }) : null;
  const usadas = new Set<DataISO>();
  for (const l of manter) {
    const original = fromDate(l.ocorrenciaData ?? l.data);
    const livre = ocorrenciasNoMes(regraDe(vigente), mesDe(original)).find((d) => !usadas.has(d));
    if (!livre) {
      // A nova regra não tem ocorrência nesse mês: o lançamento vira avulso.
      await tx.lancamento.update({ where: { id: l.id }, data: { recorrenciaId: null } });
      continue;
    }
    usadas.add(livre);
    await tx.lancamento.update({
      where: { id: l.id },
      data: { recorrenciaId: vigente.id, ocorrenciaData: toDate(livre) },
    });
  }

  // O lançamento editado recebe os novos valores da regra.
  if (manterId && manter.some((l) => l.id === manterId)) {
    const l = await tx.lancamento.findUniqueOrThrow({ where: { id: manterId } });
    const data = l.ocorrenciaData && l.recorrenciaId === vigente.id ? fromDate(l.ocorrenciaData) : fromDate(l.data);
    await tx.lancamento.update({
      where: { id: manterId },
      data: {
        descricao: vigente.descricao,
        valor: vigente.valor,
        categoriaId: vigente.categoriaId,
        contaId: vigente.cartaoId ? null : vigente.contaId,
        cartaoId: vigente.cartaoId,
        data: toDate(data),
        faturaId: cartao ? (await garantirFatura(tx, cartao.id, faturaDaCompra(data, cartao))).id : null,
        editado: false,
      },
    });
  }

  // Regenera de uma vez do menor ao maior mês afetado (inclui o mês atual).
  const afetados = [...meses, mesAtualSP()].sort();
  await garantirOcorrencias(tx, userId, afetados[0], vigente.id, afetados[afetados.length - 1]);
  return vigente;
}

/** Edição pela tela de recorrências: vale do mês atual em diante; pausar/retomar não divide a regra. */
export async function atualizarRecorrencia(userId: string, id: string, d: z.infer<typeof recorrenciaAtualizarSchema>) {
  return prisma.$transaction(async (tx) => {
    const rec = await tx.recorrencia.findFirst({ where: { id, userId } });
    if (!rec) throw naoEncontrado("Recorrência");
    const { ativa, dataFim, ...resto } = d;

    let vigente = rec;
    const temMudancas = Object.values(resto).some((v) => v !== undefined) || dataFim !== undefined;
    if (temMudancas) {
      vigente = await alterarRecorrencia(tx, userId, id, corteDaTela(rec.frequencia), {
        ...resto,
        ...(dataFim !== undefined ? { dataFim: dataFim ? toDate(dataFim) : null } : {}),
      });
    }
    if (ativa !== undefined && ativa !== vigente.ativa) {
      vigente = await tx.recorrencia.update({ where: { id: vigente.id }, data: { ativa } });
      if (!ativa) await apagarPendentesFuturas(tx, vigente.id, hojeSP());
      else await garantirOcorrencias(tx, userId, mesAtualSP(), vigente.id);
    }
    return recorrenciaDTO(vigente);
  });
}

/** Apaga ocorrências pendentes e não editadas a partir de uma data (inclusive). */
export async function apagarPendentesFuturas(tx: Db, recorrenciaId: string, aPartirDe: DataISO) {
  await tx.lancamento.deleteMany({
    where: { recorrenciaId, status: "PENDENTE", editado: false, ocorrenciaData: { gte: toDate(aPartirDe) } },
  });
}

/** Encerra a recorrência: histórico fica (lançamentos perdem o vínculo), pendentes futuras somem. */
export async function excluirRecorrencia(userId: string, id: string) {
  await prisma.$transaction(async (tx) => {
    const rec = await tx.recorrencia.findFirst({ where: { id, userId } });
    if (!rec) throw naoEncontrado("Recorrência");
    await apagarPendentesFuturas(tx, id, hojeSP());
    await tx.recorrencia.delete({ where: { id } });
  });
}

/** Dia da regra a partir de uma data (dia do mês, ou da semana no semanal). */
export function diaDaRegra(frequencia: Recorrencia["frequencia"], data: DataISO) {
  return frequencia === "SEMANAL" ? diaDaSemana(data) : partes(data)[2];
}
