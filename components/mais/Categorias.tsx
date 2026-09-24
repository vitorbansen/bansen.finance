"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Erro } from "@/components/ui/Campos";
import { ICONES, IconeQuadrado } from "@/components/ui/Icone";
import { Linha } from "@/components/ui/Lista";
import { Segmented } from "@/components/ui/Segmented";
import { SeletorCor } from "@/components/ui/SeletorCor";
import { api } from "@/lib/cliente";
import type { CategoriaDTO, TipoCategoria } from "@/lib/types";
import { cn } from "@/lib/utils";

const GRUPOS: { tipo: TipoCategoria; titulo: string }[] = [
  { tipo: "SAIDA", titulo: "Saídas" },
  { tipo: "ENTRADA", titulo: "Entradas" },
  { tipo: "AMBOS", titulo: "Entradas e saídas" },
];

export function Categorias() {
  const { cadastros } = useApp();
  const [editando, setEditando] = useState<CategoriaDTO | "nova" | null>(null);
  const ativas = cadastros.categorias.filter((c) => !c.arquivada);

  return (
    <>
      <div className="flex justify-end px-2">
        <button type="button" className="btn-texto gap-1 px-2" onClick={() => setEditando("nova")}>
          <Plus size={20} /> Nova
        </button>
      </div>
      <div className="space-y-2 px-4">
        {GRUPOS.map((g) => {
          const itens = ativas.filter((c) => c.tipo === g.tipo);
          if (!itens.length) return null;
          return (
            <section key={g.tipo}>
              <h2 className="grupo-titulo">{g.titulo}</h2>
              <div className="grupo">
                {itens.map((c) => (
                  <Linha key={c.id} icone={<IconeQuadrado icone={c.icone} cor={c.cor} />} titulo={c.nome} seta onClick={() => setEditando(c)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <CategoriaSheet alvo={editando} aoFechar={() => setEditando(null)} />
    </>
  );
}

function CategoriaSheet({ alvo, aoFechar }: { alvo: CategoriaDTO | "nova" | null; aoFechar: () => void }) {
  const { avisar, atualizar, perguntar } = useApp();
  const existente = alvo && alvo !== "nova" ? alvo : null;
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCategoria>("SAIDA");
  const [icone, setIcone] = useState("circle");
  const [cor, setCor] = useState("#8E8E93");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!alvo) return;
    setNome(existente?.nome ?? "");
    setTipo(existente?.tipo ?? "SAIDA");
    setIcone(existente?.icone ?? "shopping-bag");
    setCor(existente?.cor ?? "#0A84FF");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo]);

  async function salvar() {
    if (!nome.trim()) return setErro("Informe o nome");
    setSalvando(true);
    setErro(null);
    try {
      const corpo = { nome: nome.trim(), tipo, icone, cor };
      if (existente) await api("PATCH", `/api/categorias/${existente.id}`, corpo);
      else await api("POST", "/api/categorias", corpo);
      avisar(existente ? "Categoria atualizada" : "Categoria criada");
      aoFechar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const excluir = () =>
    perguntar({
      titulo: "Excluir categoria",
      mensagem: "Os lançamentos dela ficam sem categoria.",
      opcoes: [
        {
          rotulo: "Excluir",
          destrutiva: true,
          aoTocar: async () => {
            try {
              await api("DELETE", `/api/categorias/${existente!.id}`);
              avisar("Categoria excluída");
              aoFechar();
              atualizar();
            } catch (e) {
              avisar((e as Error).message, true);
            }
          },
        },
      ],
    });

  return (
    <BottomSheet
      aberto={!!alvo}
      aoFechar={aoFechar}
      titulo={existente ? "Editar categoria" : "Nova categoria"}
      acao={
        <button type="button" className="btn-texto px-2 font-semibold" disabled={salvando} onClick={salvar}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="flex justify-center py-2">
          <IconeQuadrado icone={icone} cor={cor} tamanho={64} className="rounded-2xl" />
        </div>
        <div className="grupo">
          <input className="campo px-4" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} aria-label="Nome da categoria" />
        </div>
        <Segmented
          aria-label="Usada em"
          valor={tipo}
          aoMudar={setTipo}
          opcoes={[
            { valor: "SAIDA", rotulo: "Saídas" },
            { valor: "ENTRADA", rotulo: "Entradas" },
            { valor: "AMBOS", rotulo: "Ambos" },
          ]}
        />
        <SeletorCor valor={cor} aoMudar={setCor} />
        <div>
          <p className="grupo-titulo pt-0">Ícone</p>
          <div className="grupo grid grid-cols-7 gap-1 p-2" role="radiogroup" aria-label="Ícone">
            {Object.keys(ICONES).map((i) => {
              const Comp = ICONES[i];
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={icone === i}
                  aria-label={i}
                  onClick={() => setIcone(i)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg text-label-2/60",
                    icone === i && "bg-tint/15 text-tint",
                  )}
                >
                  <Comp size={22} />
                </button>
              );
            })}
          </div>
        </div>
        <Erro mensagem={erro} />
        {existente && (
          <button type="button" className="btn-perigo w-full" onClick={excluir}>
            <Trash2 size={18} /> Excluir categoria
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
