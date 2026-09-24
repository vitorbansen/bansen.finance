"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { addMesesMes, mesAtualSP, nomeMes, type MesISO } from "@/lib/finance/dates";
import { cn } from "@/lib/utils";

/**
 * "← setembro 2026 →" — troca o ?mes= da URL mantendo os outros filtros.
 * `inicial` é o mês padrão da tela (sem ?mes=); por padrão, o mês atual.
 */
export function MonthPicker({ mes, inicial }: { mes: MesISO; inicial?: MesISO }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendente, iniciar] = useTransition();
  const atual = inicial ?? mesAtualSP();

  const ir = (m: MesISO) => {
    const p = new URLSearchParams(params.toString());
    if (m === atual) p.delete("mes");
    else p.set("mes", m);
    const qs = p.toString();
    iniciar(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return (
    <div className="flex items-center justify-between">
      <button type="button" className="btn-texto" onClick={() => ir(addMesesMes(mes, -1))} aria-label="Mês anterior">
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={() => mes !== atual && ir(atual)}
        className={cn("min-h-[44px] px-2 text-[17px] font-semibold capitalize transition", pendente && "opacity-50")}
        aria-live="polite"
        title={mes !== atual ? "Voltar para o mês atual" : undefined}
      >
        {nomeMes(mes)}
        {mes !== atual && <span className="ml-2 text-[13px] font-normal normal-case text-tint">{inicial ? "atual" : "hoje"}</span>}
      </button>
      <button type="button" className="btn-texto" onClick={() => ir(addMesesMes(mes, 1))} aria-label="Próximo mês">
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
