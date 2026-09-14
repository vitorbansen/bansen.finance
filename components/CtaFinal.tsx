import { Reveal } from "@/components/Reveal";
import { siteConfig } from "@/lib/config";
import { whatsappLink } from "@/lib/utils";

export function CtaFinal() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Reveal>
        <h2 className="display text-5xl leading-none md:text-8xl">Encontrou o seu?</h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="muted mt-6 text-lg md:text-2xl">Chame no WhatsApp. Respondemos rápido.</p>
      </Reveal>
      <Reveal delay={0.2}>
        <a
          href={whatsappLink(siteConfig.mensagemPadrao)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-12 inline-flex rounded-full bg-gold px-10 py-5 text-base font-medium text-black transition duration-300 hover:bg-ash md:text-lg"
        >
          Falar no WhatsApp
        </a>
      </Reveal>
    </section>
  );
}
