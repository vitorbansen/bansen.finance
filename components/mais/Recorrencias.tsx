"use client";

import { useEffect, useState } from "react";
import { Plus, Repeat, Trash2 } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha, Erro, Interruptor, Selecao } from "@/components/ui/Campos";
import { IconeQuadrado } from "@/components/ui/Icone";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Vazio } from "@/components/ui/Estados";
import { Segmented } from "@/components/ui/Segmented";
import { api } from "@/lib/cliente";
import { formatarData, hojeSP, partes } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { Frequencia, RecorrenciaDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function quando(r: RecorrenciaDTO) {
  if (r.frequencia === "SEMANAL") return `Toda ${SEMANA[r.dia]}`.replace("Toda domingo", "Todo domingo").replace("Toda sábado", "Todo sábado");
  if (r.frequencia === "ANUAL") return `Todo ano em ${String(r.dia).padStart(2, "0")}/${String(partes(r.dataInicio)[1]).padStart(2, "0")}`;
  return `Todo dia ${r.dia}`;
}

export function Recorrencias({ recorrencias }: { recorrencias: RecorrenciaDTO[] }) {
  const { cadastros } = useApp();
  const [editando, setEditando] = useState<RecorrenciaDTO | "nova" | null>(null);
  const saidas = recorrencias.filter((r) => r.tipo === "SAIDA");
  const entradas = recorrencias.filter((r) => r.tipo === "ENTRADA");

  const linha = (r: RecorrenciaDTO) => {
    const cat = cadastros.categorias.find((c) => c.id === r.categoriaId);
    const cartao = cadastros.cartoes.find((c) => c.id === r.cartaoId);
    const origem = cartao ? `Cartão ${cartao.nome}` : cadastros.contas.find((c) => c.id === r.contaId)?.nome;
    return (
      <li key={r.id}>
        <button
          type="button"
          onClick={() => setEditando(r)}
          className={cn("flex min-h-[56px] w-full items-center gap-3 bg-card px-4 py-2 text-left active:bg-fill/20", !r.ativa && "opacity-50")}
        >
          <IconeQuadrado icone={cat?.icone ?? "circle"} cor={cat?.cor ?? "#8E8E93"} tamanho={32} className="rounded-full" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px]">{r.descricao}</span>
            <span className="block truncate text-[13px] text-label-2/60">
              {r.ativa ? quando(r) : "Pausada"}
              {origem && ` · ${origem}`}
              {r.dataFim && ` · até ${formatarData(r.dataFim)}`}
            </span>
          </span>
          <span className={cn("valor text-[17px]", r.tipo === "ENTRADA" && "text-verde")}>{formatBRL(r.valor)}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      <div className="flex justify-end px-2">
        <button type="button" className="btn-texto gap-1 px-2" onClick={() => setEditando("nova")}>
          <Plus size={20} /> Nova
        </button>
      </div>
      {recorrencias.length === 0 ? (
        <Vazio
          className="pt-12"
          icone={<Repeat size={44} />}
          titulo="Nenhuma recorrência"
          texto="Cadastre salário, aluguel, assinaturas… Elas aparecem sozinhas como pendentes em cada mês."
          acao={
            <button type="button" className="btn-primario" onClick={() => setEditando("nova")}>
              Adicionar
            </button>
          }
        />
      ) : (
        <div className="space-y-2 px-4">
          {saidas.length > 0 && (
            <section>
              <h2 className="grupo-titulo">Saídas</h2>
              <ul className="grupo">{saidas.map(linha)}</ul>
            </section>
          )}
          {entradas.length > 0 && (
            <section>
              <h2 className="grupo-titulo">Entradas</h2>
              <ul className="grupo">{entradas.map(linha)}</ul>
            </section>
          )}
          <p className="px-4 pt-2 text-[13px] text-label-2/60">
            Alterações valem do mês atual em diante — o que já passou fica como estava.
          </p>
        </div>
      )}
      <RecorrenciaSheet alvo={editando} aoFechar={() => setEditando(null)} />
    </>
  );
}

type Form = {
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  valor: number;
  categoriaId: string;
  origem: string;
  frequencia: Frequencia;
  dia: string;
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
};

function RecorrenciaSheet({ alvo, aoFechar }: { alvo: RecorrenciaDTO | "nova" | null; aoFechar: () => void }) {
  const { cadastros, avisar, atualizar, perguntar } = useApp();
  const existente = alvo && alvo !== "nova" ? alvo : null;
  const [f, setF] = useState<Form | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!alvo) return;
    const conta = cadastros.contas.find((c) => c.tipo === "CORRENTE" && !c.arquivada) ?? cadastros.contas[0];
    const r = existente;
    setF({
      tipo: r?.tipo ?? "SAIDA",
      descricao: r?.descricao ?? "",
      valor: r?.valor ?? 0,
      categoriaId: r?.categoriaId ?? "",
      origem: r?.cartaoId ? `cartao:${r.cartaoId}` : r?.contaId ? `conta:${r.contaId}` : conta ? `conta:${conta.id}` : "",
      frequencia: r?.frequencia ?? "MENSAL",
      dia: String(r?.dia ?? partes(hojeSP())[2]),
      dataInicio: r?.dataInicio ?? hojeSP(),
      dataFim: r?.dataFim ?? "",
      ativa: r?.ativa ?? true,
    });
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo]);

  if (!f) return <BottomSheet aberto={false} aoFechar={aoFechar}>{null}</BottomSheet>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF({ ...f, [k]: v });
  const [tipoOrigem, idOrigem] = f.origem.split(":");
  const categorias = cadastros.categorias.filter((c) => !c.arquivada && (c.tipo === "AMBOS" || c.tipo === f.tipo));
  const dias =
    f.frequencia === "SEMANAL"
      ? SEMANA.map((d, i) => ({ valor: String(i), rotulo: d[0].toUpperCase() + d.slice(1) }))
      : Array.from({ length: 31 }, (_, i) => ({ valor: String(i + 1), rotulo: `Dia ${i + 1}` }));

  async function salvar() {
    if (!f) return;
    setErro(null);
    if (!f.descricao.trim()) return setErro("Informe a descrição");
    if (f.valor <= 0) return setErro("Informe o valor");
    if (!f.origem) return setErro("Escolha a conta ou o cartão");
    const corpo = {
      descricao: f.descricao.trim(),
      valor: f.valor,
      categoriaId: f.categoriaId || null,
      contaId: tipoOrigem === "conta" ? idOrigem : null,
      cartaoId: tipoOrigem === "cartao" ? idOrigem : null,
      frequencia: f.frequencia,
      dia: Number(f.dia),
      dataFim: f.dataFim || null,
    };
    setSalvando(true);
    try {
      if (existente) {
        // Só o que mudou: mudar a regra divide a recorrência; pausar/retomar não.
        const atual: Record<string, unknown> = { ...existente, ativa: existente.ativa };
        const mudou = Object.fromEntries(
          Object.entries({ ...corpo, ativa: f.ativa }).filter(([k, v]) => (atual[k] ?? null) !== v),
        );
        if (Object.keys(mudou).length) await api("PATCH", `/api/recorrencias/${existente.id}`, mudou);
      } else {
        await api("POST", "/api/recorrencias", { ...corpo, tipo: f.tipo, dataInicio: f.dataInicio });
      }
      avisar(existente ? "Recorrência atualizada" : "Recorrência criada");
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
      titulo: "Excluir recorrência",
      mensagem: "Os lançamentos já pagos ficam no histórico; os pendentes futuros somem.",
      opcoes: [
        {
          rotulo: "Excluir",
          destrutiva: true,
          aoTocar: async () => {
            try {
              await api("DELETE", `/api/recorrencias/${existente!.id}`);
              avisar("Recorrência excluída");
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
      titulo={existente ? "Editar recorrência" : "Nova recorrência"}
      acao={
        <button type="button" className="btn-texto px-2 font-semibold" disabled={salvando} onClick={salvar}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        {!existente && (
          <Segmented
            aria-label="Tipo"
            valor={f.tipo}
            aoMudar={(tipo) => setF({ ...f, tipo, categoriaId: "", origem: tipo === "ENTRADA" && tipoOrigem === "cartao" ? "" : f.origem })}
            opcoes={[
              { valor: "SAIDA", rotulo: "Saída" },
              { valor: "ENTRADA", rotulo: "Entrada" },
            ]}
          />
        )}
        <MoneyInput grande valor={f.valor} aoMudar={(v) => set("valor", v)} />
        <div className="grupo">
          <input className="campo px-4" placeholder="Descrição (ex.: Netflix)" value={f.descricao} onChange={(e) => set("descricao", e.target.value)} maxLength={120} aria-label="Descrição" />
          <CampoLinha rotulo="Categoria" htmlFor="rc-cat">
            <Selecao id="rc-cat" valor={f.categoriaId} aoMudar={(v) => set("categoriaId", v)} vazio="Sem categoria" opcoes={categorias.map((c) => ({ valor: c.id, rotulo: c.nome }))} />
          </CampoLinha>
          <CampoLinha rotulo={f.tipo === "ENTRADA" ? "Entra em" : "Paga com"} htmlFor="rc-origem">
            <Selecao
              id="rc-origem"
              valor={f.origem}
              aoMudar={(v) => set("origem", v)}
              vazio={f.origem ? undefined : "Escolher"}
              grupos={[
                { rotulo: "Contas", opcoes: cadastros.contas.filter((c) => !c.arquivada).map((c) => ({ valor: `conta:${c.id}`, rotulo: c.nome })) },
                ...(f.tipo === "SAIDA"
                  ? [{ rotulo: "Cartões", opcoes: cadastros.cartoes.filter((c) => !c.arquivado).map((c) => ({ valor: `cartao:${c.id}`, rotulo: `💳 ${c.nome}` })) }]
                  : []),
              ]}
            />
          </CampoLinha>
        </div>
        <div className="grupo">
          <CampoLinha rotulo="Repete" htmlFor="rc-freq">
            <Selecao
              id="rc-freq"
              valor={f.frequencia}
              aoMudar={(v) => setF({ ...f, frequencia: v as Frequencia, dia: v === "SEMANAL" ? "1" : String(partes(f.dataInicio)[2]) })}
              opcoes={[
                { valor: "MENSAL", rotulo: "Todo mês" },
                { valor: "SEMANAL", rotulo: "Toda semana" },
                { valor: "ANUAL", rotulo: "Todo ano" },
              ]}
            />
          </CampoLinha>
          <CampoLinha rotulo={f.frequencia === "SEMANAL" ? "Dia da semana" : "Vence no dia"} htmlFor="rc-dia">
            <Selecao id="rc-dia" valor={f.dia} aoMudar={(v) => set("dia", v)} opcoes={dias} />
          </CampoLinha>
          {!existente && (
            <CampoLinha rotulo="Começa em" htmlFor="rc-ini">
              <input id="rc-ini" type="date" value={f.dataInicio} onChange={(e) => e.target.value && set("dataInicio", e.target.value)} className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none" />
            </CampoLinha>
          )}
          <CampoLinha rotulo="Termina em" htmlFor="rc-fim">
            <input id="rc-fim" type="date" value={f.dataFim} onChange={(e) => set("dataFim", e.target.value)} className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none" />
          </CampoLinha>
          {existente && (
            <CampoLinha rotulo="Ativa" htmlFor="rc-ativa">
              <Interruptor id="rc-ativa" ligado={f.ativa} aoMudar={(v) => set("ativa", v)} rotulo="Recorrência ativa" />
            </CampoLinha>
          )}
        </div>
        <p className="px-4 text-[13px] text-label-2/60">
          {f.frequencia === "ANUAL" ? "Repete todo ano no mês de início. " : ""}
          Deixe &quot;Termina em&quot; vazio para não ter fim.
          {existente ? " Pausar remove as ocorrências pendentes a partir de hoje." : ""}
        </p>
        <Erro mensagem={erro} />
        {existente && (
          <button type="button" className="btn-perigo w-full" onClick={excluir}>
            <Trash2 size={18} /> Excluir recorrência
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
