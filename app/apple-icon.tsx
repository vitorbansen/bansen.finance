import { imagemIcone } from "@/lib/pwa-arte";

/** apple-touch-icon: ícone da Tela de Início do iPhone. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return imagemIcone(180);
}
