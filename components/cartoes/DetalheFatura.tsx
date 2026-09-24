"use client";

import { useState } from "react";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { Vazio } from "@/components/ui/Estados";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { LinhaLancamento } from "@/components/lancamentos/LinhaLancamento";
import { formatarData } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { CartaoDTO, FaturaDTO, LancamentoDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CartaoSheet } from "./CartaoSheet";
import { PagarFaturaSheet } from "./PagarFaturaSheet";

const STATUS = {
  ABERTA: { rotulo: "Aberta", classe: "bg-tint/15 text-tint" },
  FECHADA: { rotulo: "Fechada", classe: "bg-laranja/15 text-laranja" },
  PAGA: { rotulo: "Paga", classe: "bg-verde/15 text-verde" },
};

export function DetalheFatura({ cartao, fatura, itens }: { cartao: CartaoDTO; fatura: FaturaDTO; itens: LancamentoDTO[] }) {
  const { abrirLancamento, confirmarExclusao } = useApp();
  const [pagando, setPagando] = useState(false);
  const [editando, setEditando] = useState(false);
  const status = STATUS[fatura.status];

  return (
    <>
      <div className="px-4">
        <section className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[13px] font-semibold", status.classe)}>{status.rotulo}</span>
            <button type="button" className="btn-texto gap-1 px-1 text-[15px]" onClick={() => setEditando(true)}>
              <Pencil size={16} /> Cartão
            </button>
          </div>
          <p className="valor mt-2 text-[34px] font-bold tracking-tight">{formatBRL(fatura.total)}</p>
          <dl className="mt-1 grid grid-cols-2 gap-2 text-[13px]">
            <div>
              <dt className="text-label-2/60">Fecha</dt>
              <dd>{formatarData(fatura.fechamento)}</dd>
            </div>
            <div>
              <dt className="text-label-2/60">{fatura.pagaEm ? "Paga em" : "Vence"}</dt>
              <dd>{formatarData(fatura.pagaEm ?? fatura.vencimento)}</dd>
            </div>
          </dl>
          {fatura.status !== "PAGA" && fatura.total > 0 && (
            <button type="button" className="btn-primario mt-4 w-full" onClick={() => setPagando(true)}>
              Pagar fatura
            </button>
          )}
        </section>
      </div>

      <h2 className="grupo-titulo mx-4 px-0">
        {itens.length} {itens.length === 1 ? "item" : "itens"}
      </h2>
      {itens.length === 0 ? (
        <Vazio icone={<Receipt size={40} />} titulo="Nenhuma compra nesta fatura" />
      ) : (
        <ul className="grupo mx-4">
          {itens.map((l) => (
            <li key={l.id}>
              <SwipeRow
                aoTocar={() => abrirLancamento(l)}
                acoes={[
                  { rotulo: "Editar", icone: <Pencil size={20} />, cor: "#0A84FF", aoTocar: () => abrirLancamento(l) },
                  { rotulo: "Excluir", icone: <Trash2 size={20} />, cor: "#FF3B30", aoTocar: () => confirmarExclusao(l) },
                ]}
              >
                <LinhaLancamento l={l} />
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}

      <PagarFaturaSheet cartao={cartao} fatura={pagando ? fatura : null} aoFechar={() => setPagando(false)} />
      <CartaoSheet aberto={editando} cartao={cartao} aoFechar={() => setEditando(false)} />
    </>
  );
}
