import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { siteConfig } from "@/lib/config";
import { whatsappLink } from "@/lib/utils";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Reveal immediate>
        <Logo className="text-[7rem] md:text-[10rem] lg:text-[12rem]" />
      </Reveal>

      <Reveal immediate delay={0.15}>
        <p className="muted mx-auto mt-10 max-w-xl text-lg md:text-2xl">
          {siteConfig.tagline}. Novos e seminovos com garantia, em {siteConfig.cidade} e para todo o Brasil.
        </p>
      </Reveal>

      <Reveal immediate delay={0.3} className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        <a
          href="#catalogo"
          className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-black transition hover:bg-gold-light"
        >
          Ver catálogo
        </a>
        <a
          href={whatsappLink(siteConfig.mensagemPadrao)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-neutral-400 transition hover:text-ash"
        >
          Falar no WhatsApp &rarr;
        </a>
      </Reveal>
    </section>
  );
}
