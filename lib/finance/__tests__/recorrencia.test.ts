import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ocorrencias, ocorrenciasFaltantes, ocorrenciasNoMes, valorMensalEquivalente, type RegraRecorrencia } from "../recorrencia";

const mensal = (dia: number, extra: Partial<RegraRecorrencia> = {}): RegraRecorrencia => ({
  frequencia: "MENSAL",
  dia,
  dataInicio: "2026-01-01",
  ativa: true,
  ...extra,
});

describe("recorrências", () => {
  it("mensal gera uma ocorrência por mês", () => {
    assert.deepEqual(ocorrenciasNoMes(mensal(10), "2026-09"), ["2026-09-10"]);
    assert.deepEqual(ocorrencias(mensal(5), "2026-08-01", "2026-10-31"), ["2026-08-05", "2026-09-05", "2026-10-05"]);
  });

  it("dia 31 cai no último dia de meses curtos", () => {
    assert.deepEqual(ocorrenciasNoMes(mensal(31), "2026-02"), ["2026-02-28"]);
    assert.deepEqual(ocorrenciasNoMes(mensal(31), "2026-04"), ["2026-04-30"]);
  });

  it("respeita início, fim e pausa", () => {
    assert.deepEqual(ocorrenciasNoMes(mensal(10, { dataInicio: "2026-09-15" }), "2026-09"), []);
    assert.deepEqual(ocorrenciasNoMes(mensal(20, { dataInicio: "2026-09-15" }), "2026-09"), ["2026-09-20"]);
    assert.deepEqual(ocorrenciasNoMes(mensal(10, { dataFim: "2026-08-31" }), "2026-09"), []);
    assert.deepEqual(ocorrenciasNoMes(mensal(10, { ativa: false }), "2026-09"), []);
  });

  it("semanal pega todas as ocorrências do dia da semana", () => {
    // Setembro/2026: segundas-feiras (1) = 7, 14, 21, 28.
    const r: RegraRecorrencia = { frequencia: "SEMANAL", dia: 1, dataInicio: "2026-01-01", ativa: true };
    assert.deepEqual(ocorrenciasNoMes(r, "2026-09"), ["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"]);
  });

  it("anual só no mês da data de início", () => {
    const r: RegraRecorrencia = { frequencia: "ANUAL", dia: 15, dataInicio: "2025-03-01", ativa: true };
    assert.deepEqual(ocorrenciasNoMes(r, "2026-03"), ["2026-03-15"]);
    assert.deepEqual(ocorrenciasNoMes(r, "2026-04"), []);
  });

  it("exceções não são geradas", () => {
    assert.deepEqual(ocorrenciasNoMes(mensal(10), "2026-09", ["2026-09-10"]), []);
  });

  it("geração é idempotente: rodar de novo não duplica", () => {
    const r: RegraRecorrencia = { frequencia: "SEMANAL", dia: 1, dataInicio: "2026-01-01", ativa: true };
    const geradas: string[] = [];
    const primeira = ocorrenciasFaltantes(r, "2026-09", geradas);
    geradas.push(...primeira);
    assert.equal(primeira.length, 4);
    assert.deepEqual(ocorrenciasFaltantes(r, "2026-09", geradas), []);
    // Uma ocorrência apagada (e não marcada como exceção) volta; marcada como exceção, não.
    const semUma = geradas.filter((d) => d !== "2026-09-14");
    assert.deepEqual(ocorrenciasFaltantes(r, "2026-09", semUma), ["2026-09-14"]);
    assert.deepEqual(ocorrenciasFaltantes(r, "2026-09", semUma, ["2026-09-14"]), []);
  });

  it("peso mensal por frequência", () => {
    assert.equal(valorMensalEquivalente(5590, "MENSAL"), 5590);
    assert.equal(valorMensalEquivalente(12000, "ANUAL"), 1000);
    assert.equal(valorMensalEquivalente(3000, "SEMANAL"), 13000);
  });
});
