"use client";

import { cn } from "@/lib/utils";

/** Linha de formulário dentro de um .grupo: rótulo à esquerda, controle à direita. */
export function CampoLinha({
  rotulo,
  htmlFor,
  children,
  className,
}: {
  rotulo: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[44px] items-center gap-3 bg-card px-4", className)}>
      <label htmlFor={htmlFor} className="shrink-0 text-[17px] text-label">
        {rotulo}
      </label>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  );
}

type OpcaoSelect = { valor: string; rotulo: string };

/** Select nativo (no iPhone abre o seletor de rolagem do sistema). */
export function Selecao({
  id,
  valor,
  aoMudar,
  opcoes,
  grupos,
  vazio,
  className,
}: {
  id?: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes?: OpcaoSelect[];
  grupos?: { rotulo: string; opcoes: OpcaoSelect[] }[];
  vazio?: string;
  className?: string;
}) {
  return (
    <select
      id={id}
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className={cn("min-h-[44px] max-w-full appearance-none truncate bg-transparent text-right text-[17px] text-label-2/60 outline-none", className)}
    >
      {vazio !== undefined && <option value="">{vazio}</option>}
      {opcoes?.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
      {grupos?.map((g) =>
        g.opcoes.length ? (
          <optgroup key={g.rotulo} label={g.rotulo}>
            {g.opcoes.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </optgroup>
        ) : null,
      )}
    </select>
  );
}

/** Interruptor estilo iOS. */
export function Interruptor({
  id,
  ligado,
  aoMudar,
  rotulo,
}: {
  id?: string;
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  rotulo: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => aoMudar(!ligado)}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors",
        ligado ? "bg-[#34C759]" : "bg-fill/[0.16]",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform",
          ligado ? "translate-x-[22px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

/** Mensagem de erro de formulário. */
export function Erro({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;
  return (
    <p role="alert" className="px-4 pt-3 text-[15px] text-vermelho">
      {mensagem}
    </p>
  );
}
