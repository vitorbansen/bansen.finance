"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cartão com número em destaque que expande para mostrar como ele foi calculado. */
export function CartaoExpansivel({
  rotulo,
  valor,
  legenda,
  destaque,
  children,
}: {
  rotulo: string;
  valor: React.ReactNode;
  legenda?: React.ReactNode;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <section className={cn("rounded-2xl bg-card", destaque ? "p-5" : "p-4")}>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-[15px] text-label-2/60">{rotulo}</p>
          <p className={cn("valor mt-0.5 font-bold tracking-tight", destaque ? "text-[34px] leading-tight" : "text-[24px]")}>
            {valor}
          </p>
          {legenda && <p className="mt-0.5 text-[13px] text-label-2/60">{legenda}</p>}
        </div>
        <span className="mt-1 flex min-h-[32px] items-center gap-1 text-[13px] text-tint">
          {aberto ? "Ocultar" : "Como calculo"}
          <ChevronDown size={16} className={cn("transition-transform", aberto && "rotate-180")} />
        </span>
      </button>
      {aberto && <div className="mt-4">{children}</div>}
    </section>
  );
}
