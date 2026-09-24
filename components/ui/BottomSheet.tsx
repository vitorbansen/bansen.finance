"use client";

import { useEffect, useId } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  titulo?: string;
  /** Botão à direita do título (ex.: "Salvar"). */
  acao?: React.ReactNode;
  children: React.ReactNode;
};

/** Sheet que sobe de baixo, estilo iOS. Fecha arrastando a alça para baixo, tocando fora ou no Esc. */
export function BottomSheet({ aberto, aoFechar, titulo, acao, children }: Props) {
  const drag = useDragControls();
  const tituloId = useId();

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto, aoFechar]);

  const aoSoltar = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) aoFechar();
  };

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal aria-labelledby={titulo ? tituloId : undefined}>
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={aoFechar}
          />
          {/* Camada de fora: entrada/saída. Camada de dentro: arrastar para fechar.
              Separadas porque o drag com constraints interrompe a animação de entrada ao re-renderizar. */}
          <motion.div
            className="coluna relative"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
          >
            <motion.div
              className="flex max-h-[92dvh] flex-col rounded-t-[14px] bg-bg shadow-2xl"
              drag="y"
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={aoSoltar}
            >
              <div
                className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2"
                onPointerDown={(e) => drag.start(e)}
              >
                <span className="h-[5px] w-9 rounded-full bg-label-3/30" aria-hidden />
                <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-2 pb-1 pt-1">
                  <button type="button" className="btn-texto justify-self-start px-2" onClick={aoFechar}>
                    Cancelar
                  </button>
                  <h2 id={tituloId} className="truncate text-[17px] font-semibold">
                    {titulo}
                  </h2>
                  <div className="justify-self-end">{acao}</div>
                </div>
              </div>
              <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
