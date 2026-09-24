"use client";

import { ArrowLeftRight, CreditCard, PiggyBank, Repeat } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { IconeQuadrado } from "@/components/ui/Icone";
import { formatBRL } from "@/lib/finance/money";
import type { LancamentoDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Conteúdo visual de um lançamento (ícone, descrição, origem, valor). */
export function LinhaLancamento({ l }: { l: LancamentoDTO }) {
  const { cadastros } = useApp();
  const categoria = cadastros.categorias.find((c) => c.id === l.categoriaId);
  const conta = cadastros.contas.find((c) => c.id === l.contaId);
  const destino = cadastros.contas.find((c) => c.id === l.contaDestinoId);
  const cartao = cadastros.cartoes.find((c) => c.id === l.cartaoId);

  const transferencia = l.tipo === "TRANSFERENCIA";
  const origem = transferencia
    ? l.caixinhaId
      ? conta?.nome ?? destino?.nome ?? ""
      : `${conta?.nome ?? "?"} → ${destino?.nome ?? "?"}`
    : cartao
      ? cartao.nome
      : conta?.nome ?? "";
  const pendente = l.status === "PENDENTE" && !l.cartaoId;

  const icone = transferencia ? (
    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-fill/[0.16] text-label-2/60">
      {l.caixinhaId ? <PiggyBank size={18} /> : <ArrowLeftRight size={18} />}
    </span>
  ) : l.pagamentoFatura ? (
    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-fill/[0.16] text-label-2/60">
      <CreditCard size={18} />
    </span>
  ) : (
    <IconeQuadrado icone={categoria?.icone ?? "circle"} cor={categoria?.cor ?? "#8E8E93"} tamanho={34} className="rounded-full" />
  );

  return (
    <div className="flex min-h-[60px] items-center gap-3 px-4 py-2">
      {icone}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px]">{l.descricao}</p>
        <p className="flex items-center gap-1 truncate text-[13px] text-label-2/60">
          {l.recorrenciaId && <Repeat size={12} aria-label="Recorrente" />}
          {cartao && <CreditCard size={12} aria-hidden />}
          <span className="truncate">{origem}</span>
          {pendente && (
            <span className="ml-1 shrink-0 rounded bg-laranja/15 px-1.5 py-px text-[11px] font-semibold text-laranja">
              {l.tipo === "ENTRADA" ? "A receber" : "A pagar"}
            </span>
          )}
        </p>
      </div>
      <span
        className={cn(
          "valor shrink-0 text-[17px]",
          l.tipo === "ENTRADA" && "text-verde",
          transferencia && "text-label-2/60",
          pendente && "opacity-60",
        )}
      >
        {l.tipo === "ENTRADA" ? "+" : l.tipo === "SAIDA" ? "−" : ""}
        {formatBRL(l.valor)}
      </span>
    </div>
  );
}
