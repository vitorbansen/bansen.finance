"use client";

import { cn } from "@/lib/utils";

type Opcao<T extends string> = { valor: T; rotulo: string };

/** Controle segmentado do iOS. */
export function Segmented<T extends string>({
  opcoes,
  valor,
  aoMudar,
  className,
  "aria-label": ariaLabel,
}: {
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar: (v: T) => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex rounded-[9px] bg-fill/[0.12] p-[2px]", className)}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(o.valor)}
            className={cn(
              "min-h-[40px] flex-1 rounded-[7px] px-2 text-[14px] font-medium transition",
              ativo ? "bg-card text-label shadow-sm dark:bg-label-3/30" : "text-label active:opacity-60",
            )}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
