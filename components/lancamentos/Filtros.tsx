"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha, Selecao } from "@/components/ui/Campos";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/utils";

const CHAVES = ["tipo", "status", "categoriaId", "contaId", "cartaoId", "q"] as const;
type Chave = (typeof CHAVES)[number];

/** Busca + sheet de filtros (tipo, status, categoria, conta/cartão), tudo na URL. */
export function Filtros() {
  const { cadastros } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState(params.get("q") ?? "");
  const [f, setF] = useState<Record<Chave, string>>(() => ler());

  function ler() {
    return Object.fromEntries(CHAVES.map((k) => [k, params.get(k) ?? ""])) as Record<Chave, string>;
  }

  const aplicar = (novo: Partial<Record<Chave, string>>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(novo)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };

  const ativos = CHAVES.filter((k) => k !== "q" && params.get(k)).length;
  const origem = f.cartaoId ? `cartao:${f.cartaoId}` : f.contaId ? `conta:${f.contaId}` : "";

  return (
    <>
      <div className="flex items-center gap-2 px-4 pb-2">
        <form
          role="search"
          className="flex min-h-[44px] flex-1 items-center gap-1.5 rounded-[10px] bg-fill/[0.12] px-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            aplicar({ q: busca.trim() });
            (document.activeElement as HTMLElement | null)?.blur();
          }}
        >
          <Search size={16} className="shrink-0 text-label-2/60" aria-hidden />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Buscar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-label-2/60"
            aria-label="Buscar lançamentos"
          />
          {busca && (
            <button
              type="button"
              aria-label="Limpar busca"
              className="-mr-2 flex h-11 w-11 items-center justify-center text-label-2/60"
              onClick={() => {
                setBusca("");
                aplicar({ q: "" });
              }}
            >
              <X size={16} />
            </button>
          )}
        </form>
        <button
          type="button"
          onClick={() => {
            setF(ler());
            setAberto(true);
          }}
          className={cn("btn-texto relative rounded-[10px] px-2", ativos > 0 && "bg-tint/10")}
          aria-label={`Filtros${ativos ? ` (${ativos} ativos)` : ""}`}
        >
          <SlidersHorizontal size={20} />
          {ativos > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-tint px-1 text-[11px] font-semibold text-white">
              {ativos}
            </span>
          )}
        </button>
      </div>

      <BottomSheet
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Filtros"
        acao={
          <button
            type="button"
            className="btn-texto px-2 font-semibold"
            onClick={() => {
              aplicar({ tipo: f.tipo, status: f.status, categoriaId: f.categoriaId, contaId: f.contaId, cartaoId: f.cartaoId });
              setAberto(false);
            }}
          >
            Aplicar
          </button>
        }
      >
        <div className="space-y-4 pt-2">
          <Segmented
            aria-label="Tipo"
            valor={f.tipo}
            aoMudar={(tipo) => setF({ ...f, tipo })}
            opcoes={[
              { valor: "", rotulo: "Todos" },
              { valor: "ENTRADA", rotulo: "Entradas" },
              { valor: "SAIDA", rotulo: "Saídas" },
              { valor: "TRANSFERENCIA", rotulo: "Transf." },
            ]}
          />
          <Segmented
            aria-label="Status"
            valor={f.status}
            aoMudar={(status) => setF({ ...f, status })}
            opcoes={[
              { valor: "", rotulo: "Qualquer status" },
              { valor: "PAGO", rotulo: "Pagos" },
              { valor: "PENDENTE", rotulo: "Pendentes" },
            ]}
          />
          <div className="grupo">
            <CampoLinha rotulo="Categoria" htmlFor="f-cat">
              <Selecao
                id="f-cat"
                valor={f.categoriaId}
                aoMudar={(categoriaId) => setF({ ...f, categoriaId })}
                vazio="Todas"
                opcoes={cadastros.categorias.map((c) => ({ valor: c.id, rotulo: c.nome }))}
              />
            </CampoLinha>
            <CampoLinha rotulo="Conta ou cartão" htmlFor="f-origem">
              <Selecao
                id="f-origem"
                valor={origem}
                aoMudar={(v) => {
                  const [t, id] = v.split(":");
                  setF({ ...f, contaId: t === "conta" ? id : "", cartaoId: t === "cartao" ? id : "" });
                }}
                vazio="Todos"
                grupos={[
                  { rotulo: "Contas", opcoes: cadastros.contas.map((c) => ({ valor: `conta:${c.id}`, rotulo: c.nome })) },
                  { rotulo: "Cartões", opcoes: cadastros.cartoes.map((c) => ({ valor: `cartao:${c.id}`, rotulo: c.nome })) },
                ]}
              />
            </CampoLinha>
          </div>
          {ativos > 0 && (
            <button
              type="button"
              className="btn-secundario w-full"
              onClick={() => {
                aplicar({ tipo: "", status: "", categoriaId: "", contaId: "", cartaoId: "" });
                setAberto(false);
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
