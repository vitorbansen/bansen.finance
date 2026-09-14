import { Reveal } from "@/components/Reveal";
import { siteConfig } from "@/lib/config";

export function Diferenciais() {
  return (
    <section className="wrap py-32 md:py-48">
      <div className="grid gap-y-20 md:grid-cols-2 md:gap-x-16 md:gap-y-28">
        {siteConfig.diferenciais.map((d, i) => (
          <Reveal key={d.titulo} delay={(i % 2) * 0.1}>
            <h2 className="display text-4xl leading-[1.05] md:text-6xl">{d.titulo}</h2>
            <p className="muted mt-4 text-lg md:text-xl">{d.descricao}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
