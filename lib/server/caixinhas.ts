import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fromDate, mesAtualSP, primeiroDia, toDate, ultimoDia, type MesISO } from "@/lib/finance/dates";
import { saldoCaixinha } from "@/lib/finance/resumo";
import type { caixinhaAtualizarSchema, caixinhaSchema, movimentarCaixinhaSchema } from "@/lib/validators";
import { verificarReferencias } from "./dono";
import { caixinhaDTO } from "./dto";
import { conflito, invalido, naoEncontrado } from "./erros";

type Db = Prisma.TransactionClient;

/** Caixinhas com saldo e quanto foi depositado no mês (para o "falta guardar"). */
export async function listarCaixinhas(userId: string, mes: MesISO = mesAtualSP(), db: Db = prisma) {
  const caixinhas = await db.caixinha.findMany({
    where: { userId, arquivada: false },
    orderBy: { createdAt: "asc" },
    include: { movimentacoes: { select: { tipo: true, valor: true, data: true } } },
  });
  const de = primeiroDia(mes);
  const ate = ultimoDia(mes);
  return caixinhas.map((c) => {
    const depositadoNoMes = c.movimentacoes
      .filter((m) => m.tipo === "DEPOSITO" && fromDate(m.data) >= de && fromDate(m.data) <= ate)
      .reduce((a, m) => a + m.valor, 0);
    return { ...caixinhaDTO(c, saldoCaixinha(c.movimentacoes)), depositadoNoMes };
  });
}

export async function extratoCaixinha(userId: string, id: string) {
  const c = await prisma.caixinha.findFirst({
    where: { id, userId },
    include: { movimentacoes: { orderBy: [{ data: "desc" }, { createdAt: "desc" }] } },
  });
  if (!c) throw naoEncontrado("Caixinha");
  return {
    caixinha: caixinhaDTO(c, saldoCaixinha(c.movimentacoes)),
    movimentacoes: c.movimentacoes.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      valor: m.valor,
      data: fromDate(m.data),
      contaId: m.contaId,
      lancamentoId: m.lancamentoId,
    })),
  };
}

const dadosCaixinha = (d: Partial<z.infer<typeof caixinhaSchema>>) => ({
  ...d,
  prazo: d.prazo === undefined ? undefined : d.prazo ? toDate(d.prazo) : null,
});

export async function criarCaixinha(userId: string, d: z.infer<typeof caixinhaSchema>) {
  const c = await prisma.caixinha.create({ data: { ...dadosCaixinha(d), userId, nome: d.nome } });
  return caixinhaDTO(c, 0);
}

export async function atualizarCaixinha(userId: string, id: string, d: z.infer<typeof caixinhaAtualizarSchema>) {
  const { count } = await prisma.caixinha.updateMany({ where: { id, userId }, data: dadosCaixinha(d) });
  if (!count) throw naoEncontrado("Caixinha");
  return (await extratoCaixinha(userId, id)).caixinha;
}

/** Só exclui caixinha vazia — com saldo, resgate antes (o dinheiro precisa voltar para uma conta). */
export async function excluirCaixinha(userId: string, id: string) {
  const { caixinha } = await extratoCaixinha(userId, id);
  if (caixinha.saldo !== 0) throw conflito("Resgate o saldo antes de excluir a caixinha.");
  await prisma.$transaction(async (tx) => {
    const movs = await tx.movimentacaoCaixinha.findMany({ where: { caixinhaId: id }, select: { lancamentoId: true } });
    await tx.caixinha.delete({ where: { id } });
    // Depósitos e resgates se anulam; os lançamentos de transferência saem juntos.
    await tx.lancamento.deleteMany({ where: { id: { in: movs.map((m) => m.lancamentoId) } } });
  });
}

/**
 * Depósito: transferência conta → caixinha (sai da conta). Resgate: caixinha → conta.
 * Não é receita nem despesa.
 */
export async function movimentarCaixinha(userId: string, id: string, d: z.infer<typeof movimentarCaixinhaSchema>) {
  return prisma.$transaction(async (tx) => {
    const { caixinha } = await extratoCaixinhaTx(tx, userId, id);
    await verificarReferencias(tx, userId, { contaId: d.contaId });
    if (d.tipo === "RESGATE" && d.valor > caixinha.saldo) throw invalido("Valor maior que o saldo da caixinha.");

    const deposito = d.tipo === "DEPOSITO";
    const lanc = await tx.lancamento.create({
      data: {
        userId,
        tipo: "TRANSFERENCIA",
        descricao: `${deposito ? "Depósito" : "Resgate"}: ${caixinha.nome}`,
        valor: d.valor,
        data: toDate(d.data),
        status: "PAGO",
        contaId: deposito ? d.contaId : null,
        contaDestinoId: deposito ? null : d.contaId,
      },
    });
    await tx.movimentacaoCaixinha.create({
      data: { caixinhaId: id, tipo: d.tipo, valor: d.valor, data: toDate(d.data), contaId: d.contaId, lancamentoId: lanc.id },
    });
    return (await extratoCaixinhaTx(tx, userId, id)).caixinha;
  });
}

async function extratoCaixinhaTx(tx: Db, userId: string, id: string) {
  const c = await tx.caixinha.findFirst({ where: { id, userId }, include: { movimentacoes: true } });
  if (!c) throw naoEncontrado("Caixinha");
  return { caixinha: caixinhaDTO(c, saldoCaixinha(c.movimentacoes)) };
}
