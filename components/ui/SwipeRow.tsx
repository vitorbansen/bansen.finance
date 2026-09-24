"use client";

import { useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

export type AcaoSwipe = {
  rotulo: string;
  icone: React.ReactNode;
  cor: string;
  aoTocar: () => void;
};

const LARGURA_ACAO = 72;

/**
 * Linha que desliza para a esquerda revelando ações (estilo Mail do iOS).
 * Tocar na linha chama `aoTocar` — assim tudo também funciona sem gesto.
 */
export function SwipeRow({
  acoes,
  aoTocar,
  children,
}: {
  acoes: AcaoSwipe[];
  aoTocar?: () => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  // Ações ficam invisíveis em repouso (senão as bordas coloridas vazam no canto arredondado).
  const opacidadeAcoes = useTransform(x, (v) => (v < -1 ? 1 : 0));
  const [aberta, setAberta] = useState(false);
  const arrastou = useRef(false);
  const largura = acoes.length * LARGURA_ACAO;

  const fechar = () => {
    animate(x, 0, { type: "spring", damping: 30, stiffness: 400 });
    setAberta(false);
  };

  const aoSoltar = (_: unknown, info: PanInfo) => {
    const abrir = info.offset.x < -largura / 3 || info.velocity.x < -400;
    animate(x, abrir ? -largura : 0, { type: "spring", damping: 30, stiffness: 400 });
    setAberta(abrir);
  };

  return (
    <div className="relative overflow-hidden bg-card">
      <motion.div className="absolute inset-y-0 right-0 flex" aria-hidden={!aberta} style={{ opacity: opacidadeAcoes }}>
        {acoes.map((a) => (
          <button
            key={a.rotulo}
            type="button"
            tabIndex={aberta ? 0 : -1}
            onClick={() => {
              fechar();
              a.aoTocar();
            }}
            className="flex flex-col items-center justify-center gap-0.5 text-[12px] font-medium text-white"
            style={{ width: LARGURA_ACAO, backgroundColor: a.cor }}
          >
            {a.icone}
            {a.rotulo}
          </button>
        ))}
      </motion.div>
      <motion.div
        className={cn("relative bg-card", "touch-pan-y")}
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -largura, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragStart={() => (arrastou.current = true)}
        onDragEnd={(e, info) => {
          aoSoltar(e, info);
          setTimeout(() => (arrastou.current = false), 0);
        }}
        onClickCapture={(e) => {
          if (arrastou.current) {
            e.stopPropagation();
            e.preventDefault();
          } else if (aberta) {
            e.stopPropagation();
            fechar();
          }
        }}
      >
        {aoTocar ? (
          <div
            role="button"
            tabIndex={0}
            onClick={aoTocar}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                aoTocar();
              }
            }}
            className="block w-full cursor-pointer text-left outline-none focus-visible:bg-fill/20 active:bg-fill/20"
          >
            {children}
          </div>
        ) : (
          children
        )}
      </motion.div>
    </div>
  );
}
