import { siteConfig } from "@/lib/config";
import { whatsappLink } from "@/lib/utils";

const redes = [
  { href: siteConfig.instagramUrl, label: "Instagram" },
  { href: siteConfig.facebookUrl, label: "Facebook" },
  { href: siteConfig.tiktokUrl, label: "TikTok" },
].filter((r) => r.href);

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="wrap flex flex-col gap-6 py-10 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
        <p>
          <span className="text-neutral-300">{siteConfig.nome}</span> · {siteConfig.tagline} ·{" "}
          {siteConfig.cidade}/{siteConfig.uf}
        </p>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <a
            href={whatsappLink(siteConfig.mensagemPadrao)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-ash"
          >
            WhatsApp
          </a>
          {redes.map((r) => (
            <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" className="transition hover:text-ash">
              {r.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="wrap pb-8 text-[11px] text-neutral-600">
        © {new Date().getFullYear()} {siteConfig.nome}. iPhone e Apple são marcas registradas da Apple Inc.
      </div>
    </footer>
  );
}
