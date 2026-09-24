"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Ellipsis, House, List, PiggyBank, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "./AppProvider";

const ABAS = [
  { href: "/", rotulo: "Início", icone: House },
  { href: "/lancamentos", rotulo: "Lançamentos", icone: List },
  { href: "/cartoes", rotulo: "Cartões", icone: CreditCard },
  { href: "/guardado", rotulo: "Guardado", icone: PiggyBank },
  { href: "/mais", rotulo: "Mais", icone: Ellipsis },
];

/** Tab bar inferior + botão "+" flutuante, respeitando a safe area do iPhone. */
export function TabBar() {
  const pathname = usePathname();
  const { abrirLancamento } = useApp();
  const ativa = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <button
        type="button"
        onClick={() => abrirLancamento()}
        aria-label="Novo lançamento"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] right-[max(16px,calc(50vw-215px+16px))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-tint text-white shadow-lg shadow-tint/30 transition active:scale-95"
      >
        <Plus size={28} strokeWidth={2.4} />
      </button>
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-sep/60 bg-barra/85 backdrop-blur-xl"
        aria-label="Navegação principal"
      >
        <ul className="coluna flex">
          {ABAS.map(({ href, rotulo, icone: Icone }) => {
            const on = ativa(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex h-[50px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                    on ? "text-tint" : "text-label-2/60",
                  )}
                >
                  <Icone size={24} strokeWidth={on ? 2.3 : 1.9} />
                  {rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
