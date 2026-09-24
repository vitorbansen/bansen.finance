import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { faturaDaCompra, faturaDoMes, limiteDisponivel, statusFatura } from "../fatura";
import { descricaoParcela, gerarParcelas } from "../parcelamento";

const nubank = { diaFechamento: 3, diaVencimento: 10 };
/** Fecha perto do fim do mês e vence no mês seguinte. */
const fimDeMes = { diaFechamento: 28, diaVencimento: 5 };

describe("fatura por dia de fechamento", () => {
  it("compra antes do fechamento cai na fatura do mês", () => {
    assert.deepEqual(faturaDaCompra("2026-09-02", nubank), {
      mes: "2026-09",
      fechamento: "2026-09-03",
      vencimento: "2026-09-10",
    });
  });

  it("compra no dia do fechamento vai para a próxima", () => {
    assert.equal(faturaDaCompra("2026-09-03", nubank).mes, "2026-10");
  });

  it("compra depois do fechamento vai para a próxima", () => {
    assert.equal(faturaDaCompra("2026-09-24", nubank).mes, "2026-10");
  });

  it("vencimento antes do fechamento vence no mês seguinte ao fechamento", () => {
    assert.deepEqual(faturaDaCompra("2026-09-10", fimDeMes), {
      mes: "2026-10",
      fechamento: "2026-09-28",
      vencimento: "2026-10-05",
    });
    assert.equal(faturaDaCompra("2026-09-28", fimDeMes).mes, "2026-11");
  });

  it("vira o ano", () => {
    assert.equal(faturaDaCompra("2026-12-20", nubank).mes, "2027-01");
    assert.equal(faturaDaCompra("2026-12-29", fimDeMes).vencimento, "2027-02-05");
  });

  it("fechamento no dia 31 em mês curto usa o último dia", () => {
    const c = { diaFechamento: 31, diaVencimento: 8 };
    assert.equal(faturaDaCompra("2027-02-27", c).fechamento, "2027-02-28");
    assert.equal(faturaDaCompra("2027-02-28", c).fechamento, "2027-03-31");
  });

  it("faturaDoMes é coerente com faturaDaCompra", () => {
    assert.deepEqual(faturaDoMes("2026-10", nubank), faturaDaCompra("2026-09-24", nubank));
    assert.deepEqual(faturaDoMes("2026-10", fimDeMes), faturaDaCompra("2026-09-10", fimDeMes));
  });

  it("status e limite", () => {
    const f = { fechamento: "2026-10-03" };
    assert.equal(statusFatura(f, "2026-09-24"), "ABERTA");
    assert.equal(statusFatura(f, "2026-10-03"), "FECHADA");
    assert.equal(statusFatura({ ...f, pagaEm: "2026-10-10" }, "2026-10-11"), "PAGA");
    assert.equal(limiteDisponivel(800000, [176265, 45000, 45000]), 533735);
  });
});

describe("parcelamento", () => {
  it("10x: uma parcela em cada fatura consecutiva, soma exata", () => {
    const ps = gerarParcelas({ valorTotal: 450000, nParcelas: 10, dataCompra: "2026-08-18" }, nubank);
    assert.equal(ps.length, 10);
    assert.equal(ps.reduce((a, p) => a + p.valor, 0), 450000);
    assert.deepEqual(
      ps.map((p) => p.fatura.mes),
      ["2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"],
    );
    assert.deepEqual(ps.map((p) => p.numero), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("valor não divisível: resto na primeira parcela", () => {
    const ps = gerarParcelas({ valorTotal: 100000, nParcelas: 3, dataCompra: "2026-09-02" }, nubank);
    assert.deepEqual(ps.map((p) => p.valor), [33334, 33333, 33333]);
    assert.equal(ps[0].fatura.mes, "2026-09");
  });

  it("compra dia 31 mantém faturas consecutivas sem pular fevereiro", () => {
    const ps = gerarParcelas({ valorTotal: 30000, nParcelas: 3, dataCompra: "2027-01-31" }, fimDeMes);
    assert.deepEqual(ps.map((p) => p.fatura.mes), ["2027-03", "2027-04", "2027-05"]);
    assert.deepEqual(ps.map((p) => p.data), ["2027-01-31", "2027-02-28", "2027-03-31"]);
  });

  it("descrição da parcela", () => {
    assert.equal(descricaoParcela("Notebook", 3, 10), "Notebook (3/10)");
    assert.equal(descricaoParcela("Mercado", 1, 1), "Mercado");
  });
});
