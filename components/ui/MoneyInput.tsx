"use client";

import { centavosDeDigitos, formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

type Props = {
  valor: number;
  aoMudar: (centavos: number) => void;
  grande?: boolean;
  id?: string;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
};

/**
 * Valor em reais com máscara de caixa eletrônico: cada dígito entra pela direita
 * ("1" → R$ 0,01, "123" → R$ 1,23). Estado sempre em centavos inteiros.
 */
export function MoneyInput({ valor, aoMudar, grande, id, className, autoFocus, ...rest }: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      autoFocus={autoFocus}
      aria-label={rest["aria-label"] ?? "Valor"}
      value={formatBRL(valor)}
      onChange={(e) => aoMudar(centavosDeDigitos(e.target.value))}
      // Mantém o cursor no fim: a máscara sempre edita pela direita.
      onFocus={(e) => {
        const el = e.currentTarget;
        requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
      }}
      className={cn(
        "valor w-full bg-transparent text-label outline-none",
        grande ? "text-center text-[40px] font-semibold tracking-tight" : "campo",
        className,
      )}
    />
  );
}
