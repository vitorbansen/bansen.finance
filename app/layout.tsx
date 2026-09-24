import type { Metadata, Viewport } from "next";
import "./globals.css";

/** Telas de iPhone (pontos CSS × escala) para a splash do app na Tela de Início. */
const SPLASHES: [w: number, h: number, escala: number][] = [
  [375, 667, 2], // SE / 8
  [375, 812, 3], // X / 11 Pro / 12 mini / 13 mini
  [414, 896, 2], // XR / 11
  [414, 896, 3], // XS Max / 11 Pro Max
  [390, 844, 3], // 12 / 13 / 14
  [393, 852, 3], // 14 Pro / 15 / 16
  [402, 874, 3], // 16 Pro
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [430, 932, 3], // 14 Pro Max / 15 Plus / 16 Plus
  [440, 956, 3], // 16 Pro Max
];

export const metadata: Metadata = {
  title: "Finanças",
  description: "Controle financeiro pessoal: entradas, saídas, cartões, recorrências e quanto sobra no mês.",
  applicationName: "Finanças",
  appleWebApp: {
    capable: true,
    title: "Finanças",
    statusBarStyle: "black-translucent",
    startupImage: SPLASHES.map(([w, h, e]) => ({
      url: `/splash/${w * e}/${h * e}`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${e}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">{children}</body>
    </html>
  );
}
