"use client";

import { cn } from "@/lib/utils";
import { useApp } from "./AppProvider";

/** Área principal: esmaece enquanto um novo mês carrega (o cabeçalho fixo continua nítido). */
export function Conteudo({ children }: { children: React.ReactNode }) {
  const { navegando } = useApp();
  return (
    <main
      aria-busy={navegando}
      className={cn(
        "coluna min-h-dvh pb-[calc(env(safe-area-inset-bottom)+140px)] [&>*]:transition-opacity [&>*]:duration-200",
        navegando && "[&>*:not(header)]:opacity-50",
      )}
    >
      {children}
    </main>
  );
}
