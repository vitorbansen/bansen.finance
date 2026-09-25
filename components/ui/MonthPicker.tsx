"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useApp } from "@/components/app/AppProvider";
import { addMesesMes, mesAtualSP, nomeMes, type MesISO } from "@/lib/finance/dates";

/**
 * "← setembro 2026 →" — troca o ?mes= da URL mantendo os outros filtros.
 * `inicial` é o mês padrão da tela (sem ?mes=); por padrão, o mês atual.
 * O nome do mês muda na hora e aparece um spinner enquanto os dados carregam.
 */
export function MonthPicker({ mes, inicial }: { mes: MesISO; inicial?: MesISO }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { setNavegando } = useApp();
  const [pendente, iniciar] = useTransition();
  const [destino, setDestino] = useState<MesISO | null>(null);
  const atual = inicial ?? mesAtualSP();
  const exibido = destino ?? mes;

  useEffect(() => {
    setNavegando(pendente);
    if (!pendente) setDestino(null);
  }, [pendente, setNavegando]);

  // Garante que o esmaecimento some se a tela for desmontada no meio da troca.
  useEffect(() => () => setNavegando(false), [setNavegando]);

  const ir = (m: MesISO) => {
    setDestino(m);
    const p = new URLSearchParams(params.toString());
    if (m === atual) p.delete("mes");
    else p.set("mes", m);
    const qs = p.toString();
    iniciar(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return (
    <div className="flex items-center justify-between">
      <button type="button" className="btn-texto" onClick={() => ir(addMesesMes(exibido, -1))} aria-label="Mês anterior">
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={() => exibido !== atual && ir(atual)}
        className="flex min-h-[44px] items-center gap-2 px-2 text-[17px] font-semibold capitalize"
        aria-live="polite"
        aria-busy={pendente}
        title={exibido !== atual ? "Voltar para o mês atual" : undefined}
      >
        {nomeMes(exibido)}
        {pendente ? (
          <Loader2 size={16} className="animate-spin text-tint" aria-label="Carregando" />
        ) : (
          exibido !== atual && (
            <span className="text-[13px] font-normal normal-case text-tint">{inicial ? "atual" : "hoje"}</span>
          )
        )}
      </button>
      <button type="button" className="btn-texto" onClick={() => ir(addMesesMes(exibido, 1))} aria-label="Próximo mês">
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
