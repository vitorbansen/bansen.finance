"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type OpcaoAcao = { rotulo: string; destrutiva?: boolean; aoTocar: () => void };

/** Action sheet do iOS: pergunta + opções + Cancelar. Usado para "só esta / esta e as próximas". */
export function ActionSheet({
  aberto,
  titulo,
  mensagem,
  opcoes,
  aoFechar,
}: {
  aberto: boolean;
  titulo?: string;
  mensagem?: string;
  opcoes: OpcaoAcao[];
  aoFechar: () => void;
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" role="alertdialog" aria-modal aria-label={titulo}>
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={aoFechar}
          />
          <motion.div
            className="coluna relative space-y-2 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 400 }}
          >
            <div className="overflow-hidden rounded-[14px] bg-card/95 backdrop-blur-xl">
              {(titulo || mensagem) && (
                <div className="border-b border-sep/60 px-4 py-3 text-center">
                  {titulo && <p className="text-[13px] font-semibold text-label-2/60">{titulo}</p>}
                  {mensagem && <p className="mt-0.5 text-[13px] text-label-2/60">{mensagem}</p>}
                </div>
              )}
              {opcoes.map((o, i) => (
                <button
                  key={o.rotulo}
                  type="button"
                  onClick={() => {
                    aoFechar();
                    o.aoTocar();
                  }}
                  className={cn(
                    "block min-h-[56px] w-full text-[20px] active:bg-fill/20",
                    i > 0 && "border-t border-sep/60",
                    o.destrutiva ? "text-vermelho" : "text-tint",
                  )}
                >
                  {o.rotulo}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={aoFechar}
              className="block min-h-[56px] w-full rounded-[14px] bg-card text-[20px] font-semibold text-tint active:bg-fill/20"
            >
              Cancelar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
