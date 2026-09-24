import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addDias, fromDate, mesAtualSP, mesDe, primeiroDia, toDate, ultimoDia } from "@/lib/finance/dates";
import { faturaDaCompra } from "@/lib/finance/fatura";
import type {
  lancamentoAtualizarSchema,
  lancamentoCriarSchema,
  lancamentosQuerySchema,
  transferenciaSchema,
} from "@/lib/validators";
import { verificarReferencias } from "./dono";
import { lancamentoDTO } from "./dto";
import { conflito, invalido, naoEncontrado } from "./erros";
import { criarCompraCartao, garantirFatura } from "./faturas";
import { garantirOcorrencias } from "./ocorrencias";
import { alterarRecorrencia, apagarPendentesFuturas, corteDaOcorrencia, diaDaRegra, garantirMes } from "./recorrencias";

type Db = Prisma.TransactionClient;

const incluir = {
  faturaPaga: { select: { id: true } },
  movimentacao: { select: { caixinhaId: true } },
} satisfies Prisma.LancamentoInclude;

export async function listarLancamentos(userId: string, f: z.infer<typeof lancamentosQuerySchema>) {
  const mes = f.mes ?? mesAtualSP();
  await garantirMes(prisma, userId, mes);
  const lancs = await prisma.lancamento.findMany({
    where: {
      userId,
      data: { gte: toDate(primeiroDia(mes)), lte: toDate(ultimoDia(mes)) },
      ...(f.tipo ? { tipo: f.tipo } : {}),
      ...(f.status ? { status: f.status } : {}),
      ...(f.categoriaId ? { categoriaId: f.categoriaId } : {}),
      ...(f.cartaoId ? { cartaoId: f.cartaoId } : {}),
      ...(f.contaId ? { OR: [{ contaId: f.contaId }, { contaDestinoId: f.contaId }] } : {}),
      ...(f.q ? { descricao: { contains: f.q, mode: "insensitive" as const } } : {}),
    },
    include: incluir,
    orderBy: [{ data: "desc" }, { createdAt: "desc" }],
  });
  return lancs.map(lancamentoDTO);
}

async function buscar(db: Db, userId: string, id: string) {
  const l = await db.lancamento.findFirst({
    where: { id, userId },
    include: { ...incluir, fatura: { select: { pagaEm: true } } },
  });
  if (!l) throw naoEncontrado("Lançamento");
  return l;
}

export async function criarLancamento(userId: string, d: z.infer<typeof lancamentoCriarSchema>) {
  return prisma.$transaction(async (tx) => {
    const { cartao } = await verificarReferencias(tx, userId, d);

    if (d.repetir) {
      const rec = await tx.recorrencia.create({
        data: {
          userId,
          descricao: d.descricao,
          valor: d.valor,
          tipo: d.tipo,
          categoriaId: d.categoriaId ?? null,
          contaId: cartao ? null : d.contaId,
          cartaoId: cartao?.id ?? null,
          frequencia: d.repetir.frequencia,
          dia: diaDaRegra(d.repetir.frequencia, d.data),
          dataInicio: toDate(d.data),
          dataFim: d.repetir.dataFim ? toDate(d.repetir.dataFim) : null,
        },
      });
      // Este lançamento é a 1ª ocorrência (com o status escolhido); as demais são geradas pendentes.
      const primeiro = await tx.lancamento.create({
        data: {
          userId,
          tipo: d.tipo,
          descricao: d.descricao,
          valor: d.valor,
          data: toDate(d.data),
          status: cartao ? "PAGO" : d.status,
          observacao: d.observacao,
          categoriaId: d.categoriaId ?? null,
          contaId: cartao ? null : d.contaId,
          cartaoId: cartao?.id ?? null,
          faturaId: cartao ? (await garantirFatura(tx, cartao.id, faturaDaCompra(d.data, cartao))).id : null,
          recorrenciaId: rec.id,
          ocorrenciaData: toDate(d.data),
        },
        include: incluir,
      });
      await garantirOcorrencias(tx, userId, mesDe(d.data), rec.id);
      if (mesDe(d.data) < mesAtualSP()) await garantirOcorrencias(tx, userId, mesAtualSP(), rec.id);
      return [lancamentoDTO(primeiro)];
    }

    if (cartao) {
      const criados = await criarCompraCartao(tx, {
        userId,
        cartao,
        descricao: d.descricao,
        valor: d.valor,
        data: d.data,
        categoriaId: d.categoriaId,
        observacao: d.observacao,
        parcelas: d.parcelas,
      });
      return criados.map((l) => lancamentoDTO(l));
    }

    const l = await tx.lancamento.create({
      data: {
        userId,
        tipo: d.tipo,
        descricao: d.descricao,
        valor: d.valor,
        data: toDate(d.data),
        status: d.status,
        observacao: d.observacao,
        categoriaId: d.categoriaId ?? null,
        contaId: d.contaId,
      },
      include: incluir,
    });
    return [lancamentoDTO(l)];
  });
}

export async function atualizarLancamento(userId: string, id: string, d: z.infer<typeof lancamentoAtualizarSchema>) {
  return prisma.$transaction(async (tx) => {
    const l = await buscar(tx, userId, id);
    const { escopo, ...campos } = d;
    const mudaValorOuData = campos.valor !== undefined || campos.data !== undefined;
    const mudaOrigem = campos.contaId !== undefined || campos.cartaoId !== undefined;

    if (l.movimentacao) throw invalido("Movimentação de caixinha não pode ser editada. Exclua e faça de novo.");
    if (l.faturaPaga && (mudaValorOuData || mudaOrigem)) {
      throw invalido("Pagamento de fatura não pode ser alterado. Exclua para desfazer o pagamento.");
    }
    if (l.fatura?.pagaEm && (mudaValorOuData || mudaOrigem)) {
      throw conflito("Este item está numa fatura já paga.");
    }
    if (l.compraParceladaId && (mudaValorOuData || mudaOrigem)) {
      throw invalido("Em compra parcelada só dá para mudar descrição, categoria e observação.");
    }

    // "Esta e as próximas": altera a regra da recorrência a partir desta ocorrência.
    if (escopo === "proximas" && l.recorrenciaId) {
      const rec = await tx.recorrencia.findUniqueOrThrow({ where: { id: l.recorrenciaId } });
      const ocorrencia = fromDate(l.ocorrenciaData ?? l.data);
      await alterarRecorrencia(
        tx,
        userId,
        rec.id,
        corteDaOcorrencia(rec.frequencia, ocorrencia),
        {
          descricao: campos.descricao,
          valor: campos.valor,
          categoriaId: campos.categoriaId,
          ...origemNova(campos, l.tipo),
          dia: campos.data ? diaDaRegra(rec.frequencia, campos.data) : undefined,
        },
        l.id,
      );
      const atualizado = await tx.lancamento.update({
        where: { id },
        data: {
          ...(campos.status && !l.cartaoId ? { status: campos.status } : {}),
          ...(campos.observacao !== undefined ? { observacao: campos.observacao } : {}),
        },
        include: incluir,
      });
      return lancamentoDTO(atualizado);
    }

    // "Só esta".
    const origem = origemNova(campos, l.tipo);
    const cartaoId = origem.cartaoId !== undefined ? origem.cartaoId : l.cartaoId;
    const { cartao } = await verificarReferencias(tx, userId, {
      contaId: origem.contaId,
      cartaoId,
      categoriaId: campos.categoriaId,
    });
    const data = campos.data ?? fromDate(l.data);
    const atualizado = await tx.lancamento.update({
      where: { id },
      data: {
        descricao: campos.descricao,
        valor: campos.valor,
        data: campos.data ? toDate(campos.data) : undefined,
        status: cartao ? undefined : campos.status,
        observacao: campos.observacao,
        categoriaId: campos.categoriaId,
        ...origem,
        faturaId: cartao ? (await garantirFatura(tx, cartao.id, faturaDaCompra(data, cartao))).id : null,
        editado: l.recorrenciaId ? true : undefined,
      },
      include: incluir,
    });
    return lancamentoDTO(atualizado);
  });
}

/** Troca entre conta e cartão: informar um zera o outro. */
function origemNova(c: { contaId?: string | null; cartaoId?: string | null }, tipo: string) {
  if (c.cartaoId && c.contaId) throw invalido("Escolha uma conta ou um cartão");
  if (c.cartaoId) {
    if (tipo !== "SAIDA") throw invalido("Cartão de crédito só aceita saídas");
    return { cartaoId: c.cartaoId, contaId: null };
  }
  if (c.contaId) return { contaId: c.contaId, cartaoId: null };
  return {};
}

export async function excluirLancamento(userId: string, id: string, escopo: "esta" | "proximas" | "todas") {
  await prisma.$transaction(async (tx) => {
    const l = await buscar(tx, userId, id);

    if (escopo === "todas" && l.compraParceladaId) {
      const pagas = await tx.lancamento.count({
        where: { compraParceladaId: l.compraParceladaId, fatura: { pagaEm: { not: null } } },
      });
      if (pagas) throw conflito("Parte das parcelas está em faturas já pagas. Exclua só as parcelas em aberto.");
      await tx.compraParcelada.delete({ where: { id: l.compraParceladaId } });
      return;
    }

    if (l.fatura?.pagaEm) throw conflito("Este item está numa fatura já paga.");

    if (l.faturaPaga) {
      // Desfazer pagamento de fatura: a fatura volta a ficar em aberto.
      await tx.fatura.update({ where: { id: l.faturaPaga.id }, data: { pagaEm: null, lancamentoPagamentoId: null } });
    }

    if (l.recorrenciaId && l.ocorrenciaData) {
      const ocorrencia = fromDate(l.ocorrenciaData);
      if (escopo === "proximas") {
        await tx.recorrencia.update({
          where: { id: l.recorrenciaId },
          data: { dataFim: toDate(addDias(ocorrencia, -1)) },
        });
        await apagarPendentesFuturas(tx, l.recorrenciaId, ocorrencia);
      } else {
        // Exceção impede a ocorrência de ser gerada de novo.
        await tx.recorrenciaExcecao.upsert({
          where: { recorrenciaId_data: { recorrenciaId: l.recorrenciaId, data: l.ocorrenciaData } },
          update: {},
          create: { recorrenciaId: l.recorrenciaId, data: l.ocorrenciaData },
        });
      }
    }

    await tx.lancamento.deleteMany({ where: { id } });
  });
}

/** Marca como pago/pendente (só lançamentos em conta; itens de cartão seguem a fatura). */
export async function marcarStatus(userId: string, id: string, status?: "PAGO" | "PENDENTE") {
  const l = await buscar(prisma, userId, id);
  if (l.cartaoId) throw invalido("Itens do cartão são quitados ao pagar a fatura.");
  const novo = status ?? (l.status === "PAGO" ? "PENDENTE" : "PAGO");
  const atualizado = await prisma.lancamento.update({ where: { id }, data: { status: novo }, include: incluir });
  return lancamentoDTO(atualizado);
}

export async function criarTransferencia(userId: string, d: z.infer<typeof transferenciaSchema>) {
  return prisma.$transaction(async (tx) => {
    await verificarReferencias(tx, userId, { contaId: d.contaOrigemId, contaDestinoId: d.contaDestinoId });
    const [origem, destino] = await Promise.all([
      tx.conta.findUniqueOrThrow({ where: { id: d.contaOrigemId } }),
      tx.conta.findUniqueOrThrow({ where: { id: d.contaDestinoId } }),
    ]);
    const l = await tx.lancamento.create({
      data: {
        userId,
        tipo: "TRANSFERENCIA",
        descricao: d.descricao || `${origem.nome} → ${destino.nome}`,
        valor: d.valor,
        data: toDate(d.data),
        status: "PAGO",
        observacao: d.observacao,
        contaId: origem.id,
        contaDestinoId: destino.id,
      },
      include: incluir,
    });
    return lancamentoDTO(l);
  });
}
