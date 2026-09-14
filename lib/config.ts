/**
 * ============================================================
 *  CONFIGURAÇÃO DA LOJA — EDITE AQUI
 * ============================================================
 *  Tudo que é "dado da loja" (WhatsApp, endereço, redes sociais)
 *  fica centralizado neste arquivo. Os componentes só leem daqui.
 */

export const siteConfig = {
  nome: "NK iPhones",
  tagline: "Especialista em linha Apple",

  /**
   * WHATSAPP — somente números, com DDI (55) + DDD + número.
   * Ex.: "5547988135268"  →  https://wa.me/5547988135268
   */
  whatsapp: "5547988135268",

  /** Mensagem usada nos botões genéricos (header, botão flutuante, footer). */
  mensagemPadrao: "Olá! Vim pelo site da NK iPhones e gostaria de mais informações.",

  /** Localização exibida no hero e no footer. */
  cidade: "Joinville",
  uf: "SC",

  /** Redes sociais — deixe como "" para esconder o ícone. */
  instagramUrl: "https://instagram.com/nkiphones",
  facebookUrl: "",
  tiktokUrl: "",

  /** Garantia por estado do aparelho — preenchida automaticamente no cadastro. */
  garantias: {
    novo: "1 ano Apple",
    seminovo: "3 meses loja",
  },

  /** Diferenciais exibidos no hero. */
  diferenciais: [
    { titulo: "Entrega para todo o Brasil", descricao: "Envio rastreado e com seguro" },
    { titulo: "Retirada em Joinville/SC", descricao: "Combine pelo WhatsApp" },
    { titulo: "Garantia", descricao: "1 ano Apple nos novos, 3 meses da loja nos seminovos" },
    { titulo: "Pix, cartão ou boleto", descricao: "Parcelamento em até 12x" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
