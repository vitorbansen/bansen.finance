import { cn } from "@/lib/utils";

/** Estado vazio: ícone, frase curta e ação opcional. */
export function Vazio({
  icone,
  titulo,
  texto,
  acao,
  className,
}: {
  icone?: React.ReactNode;
  titulo: string;
  texto?: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-8 py-12 text-center", className)}>
      {icone && <div className="mb-3 text-label-3/30">{icone}</div>}
      <p className="text-[17px] font-semibold">{titulo}</p>
      {texto && <p className="mt-1 text-[15px] text-label-2/60">{texto}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-fill/[0.16]", className)} aria-hidden />;
}

/** Placeholder genérico de tela: título + cartões + lista. */
export function TelaCarregando({ cartoes = 2, linhas = 6 }: { cartoes?: number; linhas?: number }) {
  return (
    <div className="space-y-4 px-4 pt-4" aria-busy aria-label="Carregando">
      <Esqueleto className="h-9 w-40" />
      {Array.from({ length: cartoes }).map((_, i) => (
        <Esqueleto key={i} className="h-28 w-full rounded-xl" />
      ))}
      <div className="grupo">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Esqueleto className="h-8 w-8" />
            <div className="flex-1 space-y-1.5">
              <Esqueleto className="h-4 w-2/3" />
              <Esqueleto className="h-3 w-1/3" />
            </div>
            <Esqueleto className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Barra de progresso fina (metas de caixinha, limite do cartão). */
export function Progresso({ valor, cor, className, rotulo }: { valor: number; cor?: string; className?: string; rotulo: string }) {
  const pct = Math.max(0, Math.min(1, valor));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-fill/[0.16]", className)}
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div className="h-full rounded-full bg-tint transition-[width]" style={{ width: `${pct * 100}%`, backgroundColor: cor }} />
    </div>
  );
}
