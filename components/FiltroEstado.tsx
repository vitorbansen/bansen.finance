"use client";

import { cn } from "@/lib/utils";

export type FiltroEstadoValor = "todos" | "novo" | "seminovo";

const opcoes: { valor: FiltroEstadoValor; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "novo", label: "Novos" },
  { valor: "seminovo", label: "Seminovos" },
];

type Props = {
  valor: FiltroEstadoValor;
  onChange: (v: FiltroEstadoValor) => void;
};

export function FiltroEstado({ valor, onChange }: Props) {
  return (
    <div role="tablist" aria-label="Filtrar por estado" className="flex gap-6 text-sm">
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(o.valor)}
            className={cn(
              "border-b pb-1 transition",
              ativo ? "border-ash text-ash" : "border-transparent text-neutral-500 hover:text-neutral-300"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
