import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
}); 

export const metadata: Metadata = {
  title: `${siteConfig.nome} | ${siteConfig.tagline}`,
  description: `Catálogo de iPhones novos e seminovos com garantia. Entrega para todo o Brasil e retirada em ${siteConfig.cidade}/${siteConfig.uf}. Fale conosco pelo WhatsApp.`,
  openGraph: {
    siteName: siteConfig.nome,
    title: `${siteConfig.nome} | ${siteConfig.tagline}`,
    description: "iPhones novos e seminovos com garantia. Entrega para todo o Brasil.",
    locale: "pt_BR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-black font-sans">{children}</body>
    </html>
  );
}
