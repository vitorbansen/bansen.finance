import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "@/lib/config";
import type { Produto } from "@/lib/products";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Monta o link https://wa.me/<numero>?text=<mensagem url-encoded>. */
export function whatsappLink(message: string, phone: string = siteConfig.whatsapp) {
  return `https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(message)}`;
}

/**
 * Mensagem pré-preenchida gerada a partir do produto.
 * Exemplo: "Olá! Tenho interesse no iPhone 15 Pro Max 256GB Titânio Azul (seminovo). Está disponível?"
 */
export function mensagemProduto(p: Produto) {
  return `Olá! Tenho interesse no ${p.modelo} ${p.armazenamento} ${p.cor} (${p.estado}). Está disponível?`;
}

export function whatsappLinkProduto(p: Produto) {
  return whatsappLink(mensagemProduto(p));
}

/** Insere transformações do Cloudinary (formato/qualidade automáticos + largura máxima). */
export function imagemOtimizada(url: string, largura = 1200) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${largura},c_limit/`);
}
