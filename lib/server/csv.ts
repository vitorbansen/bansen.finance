import { prisma } from "@/lib/prisma";
import { formatarData, fromDate, toDate, type DataISO } from "@/lib/finance/dates";

const TIPOS: Record<string, string> = { ENTRADA: "Entrada", SAIDA: "Saída", TRANSFERENCIA: "Transferência" };

/** Campo CSV com aspas quando necessário (separador ";" — padrão do Excel em pt-BR). */
function campo(v: string) {
  return /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Centavos → "1234,56" (sem milhar, para planilhas lerem como número). */
function numero(centavos: number) {
  const sinal = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  return `${sinal}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

export async function exportarCsv(userId: string, de: DataISO, ate: DataISO) {
  const lancs = await prisma.lancamento.findMany({
    where: { userId, data: { gte: toDate(de), lte: toDate(ate) } },
    include: {
      categoria: { select: { nome: true } },
      conta: { select: { nome: true } },
      contaDestino: { select: { nome: true } },
      cartao: { select: { nome: true } },
    },
    orderBy: [{ data: "asc" }, { createdAt: "asc" }],
  });

  const linhas = [
    ["Data", "Tipo", "Descrição", "Valor", "Categoria", "Conta", "Conta destino", "Cartão", "Status", "Parcela", "Observação"],
    ...lancs.map((l) => [
      formatarData(fromDate(l.data)),
      TIPOS[l.tipo],
      l.descricao,
      numero(l.tipo === "SAIDA" ? -l.valor : l.valor),
      l.categoria?.nome ?? "",
      l.conta?.nome ?? "",
      l.contaDestino?.nome ?? "",
      l.cartao?.nome ?? "",
      l.status === "PAGO" ? "Pago" : "Pendente",
      l.parcelaNumero ? `${l.parcelaNumero}/${l.parcelaTotal}` : "",
      l.observacao ?? "",
    ]),
  ];
  // BOM para o Excel reconhecer UTF-8 (acentos).
  return "﻿" + linhas.map((l) => l.map(campo).join(";")).join("\r\n");
}
