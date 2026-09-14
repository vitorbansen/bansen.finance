import Link from "next/link";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/lib/config";
import { whatsappLink } from "@/lib/utils";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
      <div className="wrap flex h-12 items-center justify-between text-sm">
        <Link href="/" className="flex items-center gap-2 pl-2">
          <Logo compact className="text-xl" />
          <span className="font-semibold tracking-tight text-ash">iPhones</span>
        </Link>

        <nav className="flex items-center gap-6 text-neutral-400">
          <a href="#catalogo" className="hidden transition hover:text-ash sm:inline">
            Catálogo
          </a>
          <a
            href={whatsappLink(siteConfig.mensagemPadrao)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-ash"
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
