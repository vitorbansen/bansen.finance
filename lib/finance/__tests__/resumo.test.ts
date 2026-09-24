import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularSaldoLivre,
  compararGastos,
  projetarProximoMes,
  proximosVencimentos,
  resumoMes,
  saldoCaixinha,
  saldoConta,
  totalGuardado,
  totalRecorrencias,
  type ContaR,
  type FaturaR,
  type LancamentoR,
  type RecorrenciaR,
} from "../resumo";

/**
 * Cenário parecido com o seed: hoje = 24/09/2026, cartão Nubank fecha dia 3 e vence dia 10.
 * Valores em centavos.
 */
const hoje = "2026-09-24";
const mes = "2026-09";
const nubank: ContaR = { id: "nu", tipo: "CORRENTE", saldoInicial: 235000 };
const carteira: ContaR = { id: "cart", tipo: "CARTEIRA", saldoInicial: 18000 };
const invest: ContaR = { id: "inv", tipo: "INVESTIMENTO", saldoInicial: 1200000 };
const contas = [nubank, carteira, invest];
const cartao = { id: "c1", diaFechamento: 3, diaVencimento: 10 };

const L = (l: Partial<LancamentoR> & Pick<LancamentoR, "tipo" | "valor" | "data">): LancamentoR => ({
  status: "PAGO",
  ...l,
});

const lancamentos: LancamentoR[] = [
  // Conta — setembro
  L({ tipo: "ENTRADA", descricao: "Salário", valor: 650000, data: "2026-09-05", contaId: "nu", categoriaId: "salario", recorrenciaId: "r-sal", ocorrenciaData: "2026-09-05" }),
  L({ tipo: "SAIDA", descricao: "Aluguel", valor: 180000, data: "2026-09-10", contaId: "nu", categoriaId: "moradia", recorrenciaId: "r-alu", ocorrenciaData: "2026-09-10" }),
  L({ tipo: "SAIDA", descricao: "Fatura Nubank", valor: 132610, data: "2026-09-10", contaId: "nu", pagamentoFatura: true }),
  L({ tipo: "SAIDA", descricao: "Plano de saúde", valor: 28900, data: "2026-09-28", contaId: "nu", categoriaId: "saude", status: "PENDENTE", recorrenciaId: "r-pla", ocorrenciaData: "2026-09-28" }),
  L({ tipo: "ENTRADA", descricao: "Freela", valor: 65000, data: "2026-09-18", contaId: "nu", categoriaId: "freela" }),
  L({ tipo: "SAIDA", descricao: "Padaria", valor: 2150, data: "2026-09-01", contaId: "cart", categoriaId: "alim" }),
  L({ tipo: "TRANSFERENCIA", descricao: "Depósito reserva", valor: 50000, data: "2026-09-06", contaId: "nu" }),
  L({ tipo: "TRANSFERENCIA", descricao: "Saque", valor: 10000, data: "2026-09-12", contaId: "nu", contaDestinoId: "cart" }),
  // Atrasado de agosto
  L({ tipo: "SAIDA", descricao: "Conta de luz", valor: 15000, data: "2026-08-25", contaId: "nu", categoriaId: "moradia", status: "PENDENTE" }),
  // Cartão — tudo na fatura de outubro
  L({ tipo: "SAIDA", descricao: "Mercado", valor: 39845, data: "2026-09-04", cartaoId: "c1", categoriaId: "alim" }),
  L({ tipo: "SAIDA", descricao: "Netflix", valor: 5590, data: "2026-09-15", cartaoId: "c1", categoriaId: "assin", status: "PENDENTE", recorrenciaId: "r-net", ocorrenciaData: "2026-09-15" }),
  L({ tipo: "SAIDA", descricao: "Notebook (2/10)", valor: 45000, data: "2026-09-18", cartaoId: "c1", categoriaId: "outros" }),
  // Outubro
  L({ tipo: "SAIDA", descricao: "Notebook (3/10)", valor: 45000, data: "2026-10-18", cartaoId: "c1", categoriaId: "outros" }),
  L({ tipo: "ENTRADA", descricao: "Reembolso", valor: 30000, data: "2026-10-12", contaId: "nu", status: "PENDENTE" }),
];

const faturas: FaturaR[] = [
  { id: "f9", cartaoId: "c1", cartaoNome: "Nubank", mes: "2026-09", vencimento: "2026-09-10", total: 132610, pagaEm: "2026-09-10" },
  { id: "f10", cartaoId: "c1", cartaoNome: "Nubank", mes: "2026-10", vencimento: "2026-10-10", total: 90435 },
  { id: "f11", cartaoId: "c1", cartaoNome: "Nubank", mes: "2026-11", vencimento: "2026-11-10", total: 45000 },
];

const caixinhas = [
  { planejadoMensal: 50000, depositadoNoMes: 50000 }, // reserva: já guardou o do mês
  { planejadoMensal: 30000, depositadoNoMes: 0 }, // viagem: falta guardar
];

const rec = (r: Partial<RecorrenciaR> & Pick<RecorrenciaR, "id" | "tipo" | "valor" | "dia">): RecorrenciaR => ({
  frequencia: "MENSAL",
  dataInicio: "2026-08-01",
  ativa: true,
  ...r,
});
const recorrencias: RecorrenciaR[] = [
  rec({ id: "r-sal", tipo: "ENTRADA", valor: 650000, dia: 5, contaId: "nu" }),
  rec({ id: "r-alu", tipo: "SAIDA", valor: 180000, dia: 10, contaId: "nu" }),
  rec({ id: "r-pla", tipo: "SAIDA", valor: 28900, dia: 28, contaId: "nu" }),
  rec({ id: "r-net", tipo: "SAIDA", valor: 5590, dia: 15, cartaoId: "c1" }),
];

describe("saldos", () => {
  it("saldo da conta usa só pagos, ignora cartão e trata transferências", () => {
    assert.equal(saldoConta(nubank, lancamentos), 577390);
    assert.equal(saldoConta(carteira, lancamentos), 25850);
    assert.equal(saldoConta(invest, lancamentos), 1200000);
  });

  it("caixinha e total guardado", () => {
    assert.equal(saldoCaixinha([{ tipo: "DEPOSITO", valor: 400000 }, { tipo: "DEPOSITO", valor: 50000 }, { tipo: "RESGATE", valor: 20000 }]), 430000);
    assert.equal(totalGuardado([430000, 30000], contas, lancamentos), 1660000);
  });
});

describe("resumo do mês", () => {
  it("separa realizado e previsto; cartão não é saída de conta", () => {
    assert.deepEqual(resumoMes(mes, lancamentos, faturas), {
      entradasRealizadas: 715000,
      entradasPrevistas: 0,
      saidasRealizadas: 314760, // aluguel + fatura paga + padaria
      saidasPrevistas: 28900, // plano de saúde
      faturasAVencer: 0,
    });
  });

  it("fatura não paga que vence no mês entra como saída prevista", () => {
    const r = resumoMes("2026-10", lancamentos, faturas);
    assert.equal(r.faturasAVencer, 90435);
    assert.equal(r.saidasPrevistas, 90435);
    assert.equal(r.entradasPrevistas, 30000);
  });
});

describe("saldo livre", () => {
  it("saldo em contas + entradas previstas − saídas previstas − faturas − guardar", () => {
    const s = calcularSaldoLivre({ mes, contas, lancamentos, faturas, caixinhas });
    assert.deepEqual(s, {
      saldoContas: 603240, // nubank + carteira (investimento fica de fora)
      entradasPendentes: 0,
      saidasPendentes: 43900, // plano de saúde + luz atrasada de agosto
      faturasAVencer: 0,
      guardar: 30000,
      saldoLivre: 529340,
    });
  });

  it("fatura em atraso também é descontada", () => {
    const atrasada = faturas.map((f) => (f.id === "f9" ? { ...f, pagaEm: null } : f));
    const s = calcularSaldoLivre({ mes, contas, lancamentos, faturas: atrasada, caixinhas });
    assert.equal(s.faturasAVencer, 132610);
    assert.equal(s.saldoLivre, 529340 - 132610);
  });
});

describe("projeção do próximo mês", () => {
  const base = { mesAtual: mes, sobraDoMes: 529340, recorrencias, cartoes: [cartao], lancamentos, faturas, planejadoCaixinhas: 80000 };

  it("sobra + recorrências − saídas − fatura prevista − guardar, sem duplicar o que já foi gerado", () => {
    assert.deepEqual(projetarProximoMes(base), {
      mes: "2026-10",
      sobraDoMes: 529340,
      entradas: 680000, // salário (projetado) + reembolso (já lançado)
      saidas: 208900, // aluguel + plano (projetados)
      faturas: 90435, // fatura de outubro; Netflix de 15/09 já está nela, a de 15/10 cai em novembro
      guardar: 80000,
      saldo: 830005,
    });
  });

  it("ocorrência já gerada como pendente não é contada duas vezes", () => {
    const comSalarioGerado = [
      ...lancamentos,
      L({ tipo: "ENTRADA", valor: 650000, data: "2026-10-05", contaId: "nu", status: "PENDENTE", recorrenciaId: "r-sal", ocorrenciaData: "2026-10-05" }),
    ];
    assert.equal(projetarProximoMes({ ...base, lancamentos: comSalarioGerado }).entradas, 680000);
  });

  it("recorrência no cartão que cai na fatura do próximo mês é somada", () => {
    // Cartão que fecha dia 20 e vence 27: o Spotify de 15/10 cai na fatura de outubro (vence 27/10).
    const c2 = { id: "c2", diaFechamento: 20, diaVencimento: 27 };
    const spotify = rec({ id: "r-spo", tipo: "SAIDA", valor: 2190, dia: 15, cartaoId: "c2" });
    const p = projetarProximoMes({ ...base, recorrencias: [spotify], cartoes: [c2], lancamentos: [], faturas: [] });
    assert.equal(p.faturas, 2190);
  });

  it("fatura já paga não entra na projeção", () => {
    const paga = faturas.map((f) => (f.id === "f10" ? { ...f, pagaEm: "2026-09-20" } : f));
    assert.equal(projetarProximoMes({ ...base, faturas: paga }).faturas, 0);
  });
});

describe("gastos e vencimentos", () => {
  it("gastos por categoria incluem cartão, excluem pagamento de fatura e transferências", () => {
    const g = compararGastos(lancamentos, mes);
    const porCat = Object.fromEntries(g.categorias.map((c) => [c.categoriaId, [c.total, c.anterior]]));
    assert.deepEqual(porCat, {
      moradia: [180000, 15000],
      outros: [45000, 0],
      alim: [41995, 0],
      saude: [28900, 0],
      assin: [5590, 0],
    });
    assert.equal(g.total, 301485);
    assert.equal(g.totalAnterior, 15000);
    assert.equal(g.categorias[0].categoriaId, "moradia");
  });

  it("próximos 7 dias incluem atrasados, ordenados por data", () => {
    const v = proximosVencimentos(lancamentos, faturas, hoje);
    assert.deepEqual(
      v.map((x) => [x.descricao, x.data, x.atrasado, x.diasAte]),
      [
        ["Conta de luz", "2026-08-25", true, -30],
        ["Plano de saúde", "2026-09-28", false, 4],
      ],
    );
    assert.equal(proximosVencimentos(lancamentos, faturas, "2026-10-05").some((x) => x.tipo === "FATURA"), true);
  });

  it("total comprometido com recorrências", () => {
    assert.deepEqual(totalRecorrencias(recorrencias), { saidas: 214490, entradas: 650000 });
  });
});
