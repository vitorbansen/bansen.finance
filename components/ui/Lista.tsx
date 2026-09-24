import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Seção de lista agrupada (inset grouped) com título e rodapé opcionais. */
export function Grupo({
  titulo,
  rodape,
  children,
  className,
}: {
  titulo?: React.ReactNode;
  rodape?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {titulo && <h2 className="grupo-titulo">{titulo}</h2>}
      <div className="grupo">{children}</div>
      {rodape && <p className="px-4 pt-1.5 text-[13px] text-label-2/60">{rodape}</p>}
    </section>
  );
}

type LinhaProps = {
  icone?: React.ReactNode;
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
  direita?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  seta?: boolean;
  className?: string;
};

/** Linha de lista com alvo de toque ≥ 44px. Vira link ou botão conforme as props. */
export function Linha({ icone, titulo, subtitulo, direita, href, onClick, seta, className }: LinhaProps) {
  const conteudo = (
    <>
      {icone}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px] text-label">{titulo}</div>
        {subtitulo && <div className="truncate text-[13px] text-label-2/60">{subtitulo}</div>}
      </div>
      {direita && <div className="shrink-0 text-right text-[17px] text-label-2/60">{direita}</div>}
      {(seta ?? !!href) && <ChevronRight size={18} className="shrink-0 text-label-3/30" aria-hidden />}
    </>
  );
  const classe = cn(
    "flex min-h-[44px] w-full items-center gap-3 bg-card px-4 py-2.5 text-left",
    (href || onClick) && "active:bg-fill/20",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classe}>
        {conteudo}
      </button>
    );
  }
  return <div className={classe}>{conteudo}</div>;
}
