"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type Props = HTMLMotionProps<"div"> & {
  delay?: number;
  /** `true` anima ao montar (hero); padrão anima quando entra na viewport. */
  immediate?: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade + leve subida (opacity 0→1, y 20→0). Usado em todos os blocos do site. */
export function Reveal({ delay = 0, immediate = false, children, ...rest }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      {...(immediate
        ? { animate: { opacity: 1, y: 0 } }
        : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" } })}
      transition={{ duration: 0.6, ease, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
