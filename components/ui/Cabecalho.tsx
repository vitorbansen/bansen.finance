import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Título grande do iOS, com botão de voltar e ação à direita opcionais. */
export function Cabecalho({
  titulo,
  voltar,
  acao,
  children,
}: {
  titulo: string;
  voltar?: { href: string; rotulo: string };
  acao?: React.ReactNode;
  /** Conteúdo abaixo do título (ex.: seletor de mês). */
  children?: React.ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-30 bg-bg/85 backdrop-blur-xl">
      <div className="flex min-h-[44px] items-center justify-between px-2">
        {voltar ? (
          <Link href={voltar.href} className="btn-texto -ml-1 gap-0.5 pr-2">
            <ChevronLeft size={26} className="-mr-0.5" />
            {voltar.rotulo}
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center">{acao}</div>
      </div>
      <h1 className="px-4 pb-1 text-[32px] font-bold leading-tight tracking-tight">{titulo}</h1>
      {children && <div className="px-2 pb-1">{children}</div>}
    </header>
  );
}
