import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export type ParcelaConta = { rotulo: string; valor: number; sinal: "+" | "−" | "=" };

/** "Conta armada" que explica um número: + entradas, − saídas, = resultado. */
export function Decomposicao({ linhas }: { linhas: ParcelaConta[] }) {
  return (
    <dl className="space-y-1.5 text-[15px]">
      {linhas.map((l) => (
        <div
          key={l.rotulo}
          className={cn("flex items-baseline justify-between gap-3", l.sinal === "=" && "border-t border-sep/60 pt-1.5 font-semibold")}
        >
          <dt className={cn(l.sinal === "=" ? "text-label" : "text-label-2/60")}>{l.rotulo}</dt>
          <dd className="valor whitespace-nowrap">
            {l.sinal !== "=" && <span className="mr-1 text-label-2/60">{l.sinal}</span>}
            {formatBRL(l.sinal === "=" ? l.valor : Math.abs(l.valor))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
