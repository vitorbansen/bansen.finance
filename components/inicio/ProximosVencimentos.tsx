"use client";

import Link from "next/link";
import { CalendarClock, CreditCard } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { api } from "@/lib/cliente";
import { formatarDiaMes } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { Vencimento } from "@/lib/finance/resumo";
import { cn } from "@/lib/utils";

function quando(v: Vencimento) {
  if (v.atrasado) return `Atrasado desde ${formatarDiaMes(v.data)}`;
  if (v.diasAte === 0) return "Vence hoje";
  if (v.diasAte === 1) return "Amanhã";
  return `Em ${v.diasAte} dias · ${formatarDiaMes(v.data)}`;
}

export function ProximosVencimentos({ itens }: { itens: Vencimento[] }) {
  const { avisar, atualizar } = useApp();
  const [ocupado, setOcupado] = useState<string | null>(null);

  if (itens.length === 0) {
    return (
      <div className="grupo">
        <div className="flex min-h-[56px] items-center gap-3 px-4 text-[15px] text-label-2/60">
          <CalendarClock size={20} aria-hidden /> Nada vencendo nos próximos 7 dias.
        </div>
      </div>
    );
  }

  const pagar = async (v: Vencimento) => {
    if (!v.id) return;
    setOcupado(v.id);
    try {
      await api("POST", `/api/lancamentos/${v.id}/pagar`, { status: "PAGO" });
      avisar(v.entrada ? "Marcado como recebido" : "Marcado como pago");
      atualizar();
    } catch (e) {
      avisar((e as Error).message, true);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <ul className="grupo">
      {itens.map((v) => (
        <li key={`${v.tipo}-${v.id}`} className="flex min-h-[56px] items-center gap-3 px-4 py-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-[17px]">
              {v.tipo === "FATURA" && <CreditCard size={16} className="shrink-0 text-label-2/60" aria-hidden />}
              {v.descricao}
            </p>
            <p className={cn("text-[13px]", v.atrasado ? "text-vermelho" : "text-label-2/60")}>{quando(v)}</p>
          </div>
          <span className={cn("valor text-[15px] font-medium", v.entrada && "text-verde")}>
            {v.entrada ? "+" : ""}
            {formatBRL(v.valor)}
          </span>
          {v.tipo === "FATURA" ? (
            <Link href="/cartoes" className="btn-secundario px-3 text-[15px]">
              Ver
            </Link>
          ) : (
            <button
              type="button"
              className="btn-secundario px-3 text-[15px]"
              disabled={ocupado === v.id}
              onClick={() => pagar(v)}
            >
              {v.entrada ? "Recebi" : "Paguei"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
