import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { saldosPorConta, type LancamentoR } from "@/lib/finance/resumo";
import type { z } from "zod";
import type { contaAtualizarSchema, contaSchema } from "@/lib/validators";
import { contaDTO } from "./dto";
import { conflito, naoEncontrado } from "./erros";

type Db = Prisma.TransactionClient;

/**
 * Lançamentos pagos agregados por conta/tipo — o suficiente para o domínio calcular saldos
 * sem carregar o histórico inteiro.
 */
export async function lancamentosAgregadosPorConta(db: Db, userId: string): Promise<LancamentoR[]> {
  const [porOrigem, porDestino] = await Promise.all([
    db.lancamento.groupBy({
      by: ["contaId", "tipo"],
      where: { userId, status: "PAGO", cartaoId: null, contaId: { not: null } },
      _sum: { valor: true },
    }),
    db.lancamento.groupBy({
      by: ["contaDestinoId"],
      where: { userId, status: "PAGO", tipo: "TRANSFERENCIA", contaDestinoId: { not: null } },
      _sum: { valor: true },
    }),
  ]);
  return [
    ...porOrigem.map((g) => ({
      tipo: g.tipo,
      valor: g._sum.valor ?? 0,
      data: "0000-01-01",
      status: "PAGO" as const,
      contaId: g.contaId,
    })),
    ...porDestino.map((g) => ({
      tipo: "TRANSFERENCIA" as const,
      valor: g._sum.valor ?? 0,
      data: "0000-01-01",
      status: "PAGO" as const,
      contaDestinoId: g.contaDestinoId,
    })),
  ];
}

export async function listarContas(userId: string, incluirArquivadas = false, db: Db = prisma) {
  const [contas, agregados] = await Promise.all([
    db.conta.findMany({
      where: { userId, ...(incluirArquivadas ? {} : { arquivada: false }) },
      orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
    }),
    lancamentosAgregadosPorConta(db, userId),
  ]);
  const saldos = saldosPorConta(contas, agregados);
  return contas.map((c) => contaDTO(c, saldos.get(c.id) ?? c.saldoInicial));
}

export async function criarConta(userId: string, dados: z.infer<typeof contaSchema>) {
  const conta = await prisma.conta.create({ data: { ...dados, userId } });
  return contaDTO(conta, conta.saldoInicial);
}

export async function atualizarConta(userId: string, id: string, dados: z.infer<typeof contaAtualizarSchema>) {
  const { count } = await prisma.conta.updateMany({ where: { id, userId }, data: dados });
  if (!count) throw naoEncontrado("Conta");
  return (await listarContas(userId, true)).find((c) => c.id === id)!;
}

/** Só exclui conta sem movimentação; com histórico, arquive. */
export async function excluirConta(userId: string, id: string) {
  const conta = await prisma.conta.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { lancamentos: true, transferenciasRecebidas: true, cartoesPagos: true, recorrencias: true } },
    },
  });
  if (!conta) throw naoEncontrado("Conta");
  const c = conta._count;
  if (c.lancamentos || c.transferenciasRecebidas || c.cartoesPagos || c.recorrencias) {
    throw conflito("Esta conta tem movimentações, cartões ou recorrências. Arquive em vez de excluir.");
  }
  await prisma.conta.delete({ where: { id } });
}
