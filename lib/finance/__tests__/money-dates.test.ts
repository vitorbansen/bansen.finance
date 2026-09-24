import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { centavosDeDigitos, dividirParcelas, formatBRL, parseBRL } from "../money";
import { addMeses, addMesesMes, diaNoMes, fromDate, hojeSP, isDataISO, rotuloDia, toDate } from "../dates";

describe("money", () => {
  it("formata em BRL", () => {
    assert.equal(formatBRL(123456), "R$ 1.234,56");
    assert.equal(formatBRL(5), "R$ 0,05");
    assert.equal(formatBRL(-9990), "-R$ 99,90");
  });

  it("converte texto em centavos sem float", () => {
    assert.equal(parseBRL("1.234,56"), 123456);
    assert.equal(parseBRL("R$ 10"), 1000);
    assert.equal(parseBRL("0,5"), 50);
    assert.equal(parseBRL("0,1"), 10);
    assert.equal(parseBRL("19,99"), 1999);
    assert.equal(parseBRL("abc"), null);
    assert.equal(parseBRL("1,234"), null);
  });

  it("máscara de digitação usa os dois últimos dígitos como centavos", () => {
    assert.equal(centavosDeDigitos("123456"), 123456);
    assert.equal(centavosDeDigitos("R$ 0,05"), 5);
    assert.equal(centavosDeDigitos(""), 0);
  });

  it("divide parcelas com soma exata", () => {
    assert.deepEqual(dividirParcelas(1000, 3), [334, 333, 333]);
    assert.deepEqual(dividirParcelas(450000, 10), Array(10).fill(45000));
    for (const [total, n] of [[99999, 7], [1, 1], [12345, 12]]) {
      const p = dividirParcelas(total, n);
      assert.equal(p.length, n);
      assert.equal(p.reduce((a, b) => a + b, 0), total);
    }
    assert.throws(() => dividirParcelas(0, 2));
    assert.throws(() => dividirParcelas(100, 0));
  });
});

describe("dates", () => {
  it("clamp no fim do mês", () => {
    assert.equal(addMeses("2026-01-31", 1), "2026-02-28");
    assert.equal(addMeses("2028-01-31", 1), "2028-02-29");
    assert.equal(diaNoMes("2026-04", 31), "2026-04-30");
    assert.equal(addMesesMes("2026-12", 1), "2027-01");
    assert.equal(addMesesMes("2026-01", -1), "2025-12");
  });

  it("valida datas", () => {
    assert.ok(isDataISO("2026-02-28"));
    assert.ok(!isDataISO("2026-02-30"));
    assert.ok(!isDataISO("2026-13-01"));
  });

  it("ida e volta com @db.Date não muda o dia", () => {
    assert.equal(fromDate(toDate("2026-09-01")), "2026-09-01");
  });

  it("hoje em São Paulo não vira o dia pelo UTC", () => {
    // 01:30 UTC de 25/09 ainda é 22:30 de 24/09 em São Paulo.
    assert.equal(hojeSP(new Date("2026-09-25T01:30:00Z")), "2026-09-24");
    assert.equal(hojeSP(new Date("2026-09-25T03:00:00Z")), "2026-09-25");
  });

  it("rótulos de dia", () => {
    assert.equal(rotuloDia("2026-09-24", "2026-09-24"), "Hoje");
    assert.equal(rotuloDia("2026-09-23", "2026-09-24"), "Ontem");
    assert.equal(rotuloDia("2026-09-21", "2026-09-24"), "segunda, 21 de setembro");
  });
});
