"use client";

import { Check, Pencil, Receipt, RotateCcw, Trash2 } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { Vazio } from "@/components/ui/Estados";
import { SwipeRow, type AcaoSwipe } from "@/components/ui/SwipeRow";
import { rotuloDia, type DataISO } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { LancamentoDTO } from "@/lib/types";
import { LinhaLancamento } from "./LinhaLancamento";

const efeito = (l: LancamentoDTO) => (l.tipo === "ENTRADA" ? l.valor : l.tipo === "SAIDA" ? -l.valor : 0);

export function ListaLancamentos({
  lancamentos,
  hoje,
  filtrado,
}: {
  lancamentos: LancamentoDTO[];
  hoje: DataISO;
  filtrado: boolean;
}) {
  const { abrirLancamento, alternarPago, confirmarExclusao } = useApp();

  if (lancamentos.length === 0) {
    return (
      <Vazio
        className="pt-16"
        icone={<Receipt size={44} />}
        titulo={filtrado ? "Nada encontrado" : "Nenhum lançamento neste mês"}
        texto={filtrado ? "Tente mudar os filtros." : "Toque no + para registrar uma entrada ou saída."}
      />
    );
  }

  const porDia = new Map<DataISO, LancamentoDTO[]>();
  for (const l of lancamentos) porDia.set(l.data, [...(porDia.get(l.data) ?? []), l]);

  const acoes = (l: LancamentoDTO): AcaoSwipe[] => {
    const lista: AcaoSwipe[] = [];
    if (!l.cartaoId && !l.caixinhaId && l.tipo !== "TRANSFERENCIA") {
      const pago = l.status === "PAGO";
      lista.push({
        rotulo: pago ? "Pendente" : l.tipo === "ENTRADA" ? "Recebi" : "Paguei",
        icone: pago ? <RotateCcw size={20} /> : <Check size={20} />,
        cor: pago ? "#8E8E93" : "#34C759",
        aoTocar: () => alternarPago(l),
      });
    }
    if (!l.caixinhaId) lista.push({ rotulo: "Editar", icone: <Pencil size={20} />, cor: "#0A84FF", aoTocar: () => abrirLancamento(l) });
    lista.push({ rotulo: "Excluir", icone: <Trash2 size={20} />, cor: "#FF3B30", aoTocar: () => confirmarExclusao(l) });
    return lista;
  };

  return (
    <div className="space-y-1 px-4">
      {[...porDia.entries()].map(([dia, itens]) => {
        const saldoDia = itens.reduce((a, l) => a + efeito(l), 0);
        return (
          <section key={dia} aria-label={rotuloDia(dia, hoje)}>
            <h2 className="flex items-baseline justify-between px-4 pb-1.5 pt-4 text-[13px] text-label-2/60">
              <span className="font-semibold uppercase tracking-wide first-letter:uppercase">{rotuloDia(dia, hoje)}</span>
              {saldoDia !== 0 && <span className="valor">{formatBRL(saldoDia)}</span>}
            </h2>
            <ul className="grupo">
              {itens.map((l) => (
                <li key={l.id}>
                  <SwipeRow
                    acoes={acoes(l)}
                    aoTocar={() => (l.caixinhaId ? confirmarExclusao(l) : abrirLancamento(l))}
                  >
                    <LinhaLancamento l={l} />
                  </SwipeRow>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="px-4 pt-4 text-center text-[13px] text-label-2/60">
        Deslize um lançamento para a esquerda para marcar como pago, editar ou excluir.
      </p>
    </div>
  );
}
