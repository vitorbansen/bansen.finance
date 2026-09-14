"use client";

import { motion } from "framer-motion";
import { WhatsappBotao } from "@/components/WhatsappButton";
import type { Produto } from "@/lib/products";
import { formatCurrency, imagemOtimizada, mensagemProduto } from "@/lib/utils";

/** Silhueta usada quando o produto não tem foto cadastrada no admin. */
function Silhueta() {
  return (
    <svg viewBox="0 0 200 400" className="h-[70%] w-auto" aria-hidden>
      <rect x="6" y="6" width="188" height="388" rx="34" fill="none" stroke="#2a2a2a" strokeWidth="3" />
      <rect x="16" y="16" width="168" height="368" rx="26" fill="#050505" />
      <rect x="72" y="28" width="56" height="14" rx="7" fill="#1c1c1c" />
    </svg>
  );
}

export function CardProduto({ produto: p }: { produto: Produto }) {
  const indisponivel = p.disponivel === false;
  const temPix = p.precoPix != null && p.precoPix < p.preco;

  const detalhes = [
    p.armazenamento,
    p.cor,
    `Garantia ${p.garantia}`,
    p.bateria != null ? `Bateria ${p.bateria}%` : null,
  ].filter(Boolean);

  return (
    <motion.article
      whileHover={indisponivel ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={indisponivel ? "group opacity-50" : "group"}
    >
      {/* Imagem */}
      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-3xl bg-surface md:aspect-square">
        {p.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagemOtimizada(p.imagem)}
            alt={p.modelo}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <Silhueta />
        )}
      </div>

      {/* Texto */}
      <div className="mt-8">
        <p className={`text-xs uppercase tracking-[0.2em] ${indisponivel ? "text-neutral-500" : "text-gold"}`}>
          {indisponivel ? "Vendido" : p.estado === "novo" ? "Novo" : "Seminovo"}
        </p>
        <h3 className="display mt-2 text-3xl md:text-4xl">{p.modelo}</h3>
        <p className="muted mt-2 text-base">{detalhes.join(" · ")}</p>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="display text-2xl text-gold md:text-3xl">
              {formatCurrency(temPix ? p.precoPix! : p.preco)}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {temPix ? `à vista no Pix · ${formatCurrency(p.preco)} no cartão` : "à vista"}
            </p>
          </div>

          <WhatsappBotao
            mensagem={mensagemProduto(p)}
            label={indisponivel ? "Indisponível" : "Tenho interesse"}
            disabled={indisponivel}
          />
        </div>
      </div>
    </motion.article>
  );
}
