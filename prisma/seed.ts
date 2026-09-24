/**
 * Dados de exemplo realistas para o usuário demo (demo@exemplo.com / SEED_SENHA ou "demo12345").
 * Rodar de novo apaga e recria só o usuário demo. Datas são relativas ao mês atual (São Paulo).
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addMesesMes, diaNoMes, fromDate, hojeSP, mesDe, toDate, type DataISO } from "../lib/finance/dates";
import { criarDadosIniciais } from "../lib/server/dados-iniciais";
import { criarCompraCartao, pagarFatura, totalFatura } from "../lib/server/faturas";
import { garantirOcorrencias } from "../lib/server/ocorrencias";

const prisma = new PrismaClient();
const EMAIL = "demo@exemplo.com";

const reais = (v: number) => Math.round(v * 100);

async function main() {
  const hoje = hojeSP();
  const mesAtual = mesDe(hoje);
  const mesAnterior = addMesesMes(mesAtual, -1);
  /** Dia do mês, ou null se ainda não chegou (não cria lançamento "do futuro" como realizado). */
  const dia = (mes: string, d: number): DataISO | null => {
    const data = diaNoMes(mes, d);
    return data <= hoje ? data : null;
  };

  await prisma.usuario.deleteMany({ where: { email: EMAIL } });

  const senha = await bcrypt.hash(process.env.SEED_SENHA || "demo12345", 12);

  await prisma.$transaction(
    async (tx) => {
      const user = await tx.usuario.create({ data: { nome: "Demo", email: EMAIL, senha } });
      const userId = user.id;
      await criarDadosIniciais(tx, userId);

      const cats = Object.fromEntries(
        (await tx.categoria.findMany({ where: { userId } })).map((c) => [c.nome, c.id]),
      ) as Record<string, string>;

      const carteira = await tx.conta.findFirstOrThrow({ where: { userId, tipo: "CARTEIRA" } });
      await tx.conta.update({ where: { id: carteira.id }, data: { saldoInicial: reais(180), ordem: 1 } });
      const nubank = await tx.conta.create({
        data: { userId, nome: "Nubank", tipo: "CORRENTE", saldoInicial: reais(2350), cor: "#820AD1", ordem: 0 },
      });
      await tx.conta.create({
        data: { userId, nome: "Investimentos", tipo: "INVESTIMENTO", saldoInicial: reais(12000), cor: "#30D158", ordem: 2 },
      });

      const cartao = await tx.cartao.create({
        data: {
          userId,
          nome: "Nubank",
          limite: reais(8000),
          diaFechamento: 3,
          diaVencimento: 10,
          contaPagamentoId: nubank.id,
          cor: "#820AD1",
        },
      });

      // Recorrências começam no mês anterior.
      const inicio = toDate(diaNoMes(mesAnterior, 1));
      const recorrencias: Prisma.RecorrenciaCreateManyInput[] = [
        { descricao: "Salário", valor: reais(6500), tipo: "ENTRADA", categoriaId: cats["Salário"], contaId: nubank.id, dia: 5 },
        { descricao: "Aluguel", valor: reais(1800), tipo: "SAIDA", categoriaId: cats["Moradia"], contaId: nubank.id, dia: 10 },
        { descricao: "Academia", valor: reais(99.9), tipo: "SAIDA", categoriaId: cats["Saúde"], contaId: nubank.id, dia: 15 },
        { descricao: "Internet", valor: reais(119.9), tipo: "SAIDA", categoriaId: cats["Moradia"], contaId: nubank.id, dia: 20 },
        { descricao: "Plano de saúde", valor: reais(289), tipo: "SAIDA", categoriaId: cats["Saúde"], contaId: nubank.id, dia: 28 },
        { descricao: "Netflix", valor: reais(55.9), tipo: "SAIDA", categoriaId: cats["Assinaturas"], cartaoId: cartao.id, dia: 15 },
        { descricao: "Spotify", valor: reais(21.9), tipo: "SAIDA", categoriaId: cats["Assinaturas"], cartaoId: cartao.id, dia: 22 },
      ].map((r) => ({ ...r, userId, frequencia: "MENSAL", dataInicio: inicio }) as Prisma.RecorrenciaCreateManyInput);
      await tx.recorrencia.createMany({ data: recorrencias });

      await garantirOcorrencias(tx, userId, mesAnterior);
      await garantirOcorrencias(tx, userId, mesAtual);
      // O que já venceu foi pago.
      await tx.lancamento.updateMany({
        where: { userId, recorrenciaId: { not: null }, data: { lte: toDate(hoje) } },
        data: { status: "PAGO" },
      });

      // Compra parcelada em 10x no mês anterior.
      await criarCompraCartao(tx, {
        userId,
        cartao,
        descricao: "Notebook",
        valor: reais(4500),
        data: diaNoMes(mesAnterior, 18),
        categoriaId: cats["Outros"],
        parcelas: 10,
      });

      type Avulso = [mes: string, dia: number, descricao: string, valor: number, categoria: string, onde: "cartao" | "conta" | "carteira", tipo?: "ENTRADA"];
      const avulsos: Avulso[] = [
        [mesAnterior, 2, "Mercado", 412.37, "Alimentação", "cartao"],
        [mesAnterior, 7, "Uber", 23.9, "Transporte", "cartao"],
        [mesAnterior, 9, "iFood", 64.5, "Alimentação", "cartao"],
        [mesAnterior, 12, "Farmácia", 87.2, "Saúde", "conta"],
        [mesAnterior, 14, "Freela site", 1200, "Freela", "conta", "ENTRADA"],
        [mesAnterior, 16, "Padaria", 18, "Alimentação", "carteira"],
        [mesAnterior, 19, "Cinema", 72, "Lazer", "cartao"],
        [mesAnterior, 21, "Combustível", 250, "Transporte", "cartao"],
        [mesAnterior, 26, "Mercado", 387.9, "Alimentação", "cartao"],
        [mesAnterior, 28, "Bar com amigos", 96, "Lazer", "conta"],
        [mesAtual, 1, "Padaria", 21.5, "Alimentação", "carteira"],
        [mesAtual, 4, "Mercado", 398.45, "Alimentação", "cartao"],
        [mesAtual, 6, "Uber", 31.4, "Transporte", "cartao"],
        [mesAtual, 8, "iFood", 58.9, "Alimentação", "cartao"],
        [mesAtual, 11, "Consulta dentista", 180, "Saúde", "conta"],
        [mesAtual, 13, "Combustível", 230, "Transporte", "cartao"],
        [mesAtual, 17, "Show", 160, "Lazer", "cartao"],
        [mesAtual, 18, "Freela logo", 650, "Freela", "conta", "ENTRADA"],
        [mesAtual, 20, "Mercado", 356.1, "Alimentação", "cartao"],
        [mesAtual, 23, "Farmácia", 45.8, "Saúde", "carteira"],
      ];
      for (const [mes, d, descricao, valor, categoria, onde, tipo] of avulsos) {
        const data = dia(mes, d);
        if (!data) continue;
        if (onde === "cartao") {
          await criarCompraCartao(tx, { userId, cartao, descricao, valor: reais(valor), data, categoriaId: cats[categoria] });
        } else {
          await tx.lancamento.create({
            data: {
              userId,
              tipo: tipo ?? "SAIDA",
              descricao,
              valor: reais(valor),
              data: toDate(data),
              status: "PAGO",
              categoriaId: cats[categoria],
              contaId: onde === "conta" ? nubank.id : carteira.id,
            },
          });
        }
      }

      // Faturas já vencidas foram pagas no dia do vencimento.
      const vencidas = await tx.fatura.findMany({
        where: { cartaoId: cartao.id, dataVencimento: { lt: toDate(hoje) }, pagaEm: null },
      });
      for (const f of vencidas) {
        if ((await totalFatura(tx, f.id)) > 0) await pagarFatura(tx, userId, f.id, fromDate(f.dataVencimento));
      }

      // Caixinhas: depósitos saem da conta Nubank.
      const reserva = await tx.caixinha.create({
        data: { userId, nome: "Reserva de emergência", valorAlvo: reais(20000), planejadoMensal: reais(500), cor: "#30D158", icone: "shield" },
      });
      const viagem = await tx.caixinha.create({
        data: {
          userId,
          nome: "Viagem",
          valorAlvo: reais(6000),
          prazo: toDate(diaNoMes(addMesesMes(mesAtual, 8), 1)),
          planejadoMensal: reais(300),
          cor: "#64D2FF",
          icone: "plane",
        },
      });
      const depositos: [string, string, number, number][] = [
        [reserva.id, mesAnterior, 6, 4000],
        [viagem.id, mesAnterior, 6, 300],
        [reserva.id, mesAtual, 6, 500],
      ];
      for (const [caixinhaId, mes, d, valor] of depositos) {
        const data = dia(mes, d);
        if (!data) continue;
        const lanc = await tx.lancamento.create({
          data: {
            userId,
            tipo: "TRANSFERENCIA",
            descricao: caixinhaId === reserva.id ? "Depósito: Reserva de emergência" : "Depósito: Viagem",
            valor: reais(valor),
            data: toDate(data),
            status: "PAGO",
            contaId: nubank.id,
          },
        });
        await tx.movimentacaoCaixinha.create({
          data: { caixinhaId, tipo: "DEPOSITO", valor: reais(valor), data: toDate(data), contaId: nubank.id, lancamentoId: lanc.id },
        });
      }
    },
    { timeout: 120_000, maxWait: 20_000 },
  );

  const [lancamentos, faturas, recorrencias] = await Promise.all([
    prisma.lancamento.count({ where: { usuario: { email: EMAIL } } }),
    prisma.fatura.count({ where: { cartao: { usuario: { email: EMAIL } } } }),
    prisma.recorrencia.count({ where: { usuario: { email: EMAIL } } }),
  ]);
  console.log(`✓ Usuário ${EMAIL} criado: ${lancamentos} lançamentos, ${faturas} faturas, ${recorrencias} recorrências.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
