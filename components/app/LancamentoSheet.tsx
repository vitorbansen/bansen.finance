"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha, Erro, Interruptor, Selecao } from "@/components/ui/Campos";
import { IconeQuadrado } from "@/components/ui/Icone";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Segmented } from "@/components/ui/Segmented";
import { api } from "@/lib/cliente";
import { hojeSP } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { Frequencia, LancamentoDTO, TipoLancamento } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useApp } from "./AppProvider";

type Form = {
  tipo: TipoLancamento;
  valor: number;
  descricao: string;
  categoriaId: string;
  /** "conta:<id>" ou "cartao:<id>" */
  origem: string;
  destino: string;
  data: string;
  pago: boolean;
  parcelas: number;
  repetir: "" | Frequencia;
  observacao: string;
};

const TIPOS: { valor: TipoLancamento; rotulo: string }[] = [
  { valor: "SAIDA", rotulo: "Saída" },
  { valor: "ENTRADA", rotulo: "Entrada" },
  { valor: "TRANSFERENCIA", rotulo: "Transferência" },
];

const REPETIR: { valor: "" | Frequencia; rotulo: string }[] = [
  { valor: "", rotulo: "Não repetir" },
  { valor: "MENSAL", rotulo: "Todo mês" },
  { valor: "SEMANAL", rotulo: "Toda semana" },
  { valor: "ANUAL", rotulo: "Todo ano" },
];

export function LancamentoSheet({
  aberto,
  lancamento,
  aoFechar,
}: {
  aberto: boolean;
  lancamento?: LancamentoDTO;
  aoFechar: () => void;
}) {
  const { cadastros, avisar, atualizar, perguntar, confirmarExclusao } = useApp();
  const contas = cadastros.contas.filter((c) => !c.arquivada);
  const cartoes = cadastros.cartoes.filter((c) => !c.arquivado);
  const [f, setF] = useState<Form>(() => inicial());
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const editando = !!lancamento;

  function inicial(l?: LancamentoDTO): Form {
    if (l) {
      return {
        tipo: l.tipo,
        valor: l.valor,
        descricao: l.descricao,
        categoriaId: l.categoriaId ?? "",
        origem: l.cartaoId ? `cartao:${l.cartaoId}` : l.contaId ? `conta:${l.contaId}` : "",
        destino: l.contaDestinoId ?? "",
        data: l.data,
        pago: l.status === "PAGO",
        parcelas: 1,
        repetir: "",
        observacao: l.observacao ?? "",
      };
    }
    const principal = contas.find((c) => c.tipo === "CORRENTE") ?? contas[0];
    return {
      tipo: "SAIDA",
      valor: 0,
      descricao: "",
      categoriaId: "",
      origem: principal ? `conta:${principal.id}` : "",
      destino: "",
      data: hojeSP(),
      pago: true,
      parcelas: 1,
      repetir: "",
      observacao: "",
    };
  }

  useEffect(() => {
    if (aberto) {
      setF(inicial(lancamento));
      setErro(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, lancamento]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const [tipoOrigem, idOrigem] = f.origem.split(":") as ["conta" | "cartao" | "", string];
  const noCartao = tipoOrigem === "cartao";
  const transferencia = f.tipo === "TRANSFERENCIA";

  // Restrições na edição (espelham as regras da API).
  const soDescricao = !!lancamento && (!!lancamento.compraParceladaId || lancamento.pagamentoFatura || !!lancamento.caixinhaId);
  const bloqueiaOrigem = soDescricao || (editando && transferencia);

  const categorias = useMemo(
    () =>
      cadastros.categorias.filter(
        (c) => !c.arquivada && (c.tipo === "AMBOS" || c.tipo === (f.tipo === "ENTRADA" ? "ENTRADA" : "SAIDA")),
      ),
    [cadastros.categorias, f.tipo],
  );

  const mudarTipo = (tipo: TipoLancamento) => {
    setF((x) => {
      const origemInvalida = tipo !== "SAIDA" && x.origem.startsWith("cartao:");
      const conta = contas.find((c) => c.tipo === "CORRENTE") ?? contas[0];
      return {
        ...x,
        tipo,
        categoriaId: "",
        parcelas: 1,
        origem: origemInvalida && conta ? `conta:${conta.id}` : x.origem,
      };
    });
  };

  async function salvar(escopo?: "esta" | "proximas") {
    setErro(null);
    if (f.valor <= 0) return setErro("Informe o valor");
    if (!transferencia && !f.descricao.trim()) return setErro("Informe a descrição");
    if (!f.origem && !soDescricao) return setErro("Escolha a conta ou o cartão");
    if (transferencia && !editando && (!f.destino || f.destino === idOrigem)) {
      return setErro("Escolha uma conta de destino diferente");
    }

    // Recorrente: perguntar o alcance da edição.
    if (lancamento?.recorrenciaId && !escopo) {
      perguntar({
        titulo: "Alterar lançamento recorrente",
        mensagem: "Aplicar a mudança a:",
        opcoes: [
          { rotulo: "Só esta ocorrência", aoTocar: () => salvar("esta") },
          { rotulo: "Esta e as próximas", aoTocar: () => salvar("proximas") },
        ],
      });
      return;
    }

    setSalvando(true);
    try {
      if (lancamento) {
        const corpo: Record<string, unknown> = {
          descricao: f.descricao.trim(),
          observacao: f.observacao,
          escopo: escopo ?? "esta",
        };
        if (!transferencia) corpo.categoriaId = f.categoriaId || null;
        if (!soDescricao) {
          corpo.valor = f.valor;
          corpo.data = f.data;
          if (!noCartao) corpo.status = f.pago ? "PAGO" : "PENDENTE";
          if (!bloqueiaOrigem) corpo[noCartao ? "cartaoId" : "contaId"] = idOrigem;
        }
        await api("PATCH", `/api/lancamentos/${lancamento.id}`, corpo);
        avisar("Alterado");
      } else if (transferencia) {
        await api("POST", "/api/transferencias", {
          contaOrigemId: idOrigem,
          contaDestinoId: f.destino,
          valor: f.valor,
          data: f.data,
          descricao: f.descricao.trim() || undefined,
          observacao: f.observacao,
        });
        avisar("Transferência registrada");
      } else {
        await api("POST", "/api/lancamentos", {
          tipo: f.tipo,
          descricao: f.descricao.trim(),
          valor: f.valor,
          data: f.data,
          status: f.pago ? "PAGO" : "PENDENTE",
          categoriaId: f.categoriaId || null,
          contaId: noCartao ? null : idOrigem,
          cartaoId: noCartao ? idOrigem : null,
          observacao: f.observacao,
          parcelas: noCartao ? f.parcelas : 1,
          repetir: f.repetir ? { frequencia: f.repetir } : null,
        });
        avisar(f.parcelas > 1 && noCartao ? `Compra em ${f.parcelas}x registrada` : "Lançamento salvo");
      }
      aoFechar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const titulo = editando ? "Editar" : "Novo lançamento";
  const valorParcela = f.parcelas > 1 ? Math.floor(f.valor / f.parcelas) : 0;

  return (
    <BottomSheet
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={titulo}
      acao={
        <button type="button" className="btn-texto px-2 font-semibold" disabled={salvando} onClick={() => salvar()}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
        className="space-y-4 pb-2 pt-2"
      >
        {!editando && (
          <Segmented opcoes={TIPOS} valor={f.tipo} aoMudar={mudarTipo} aria-label="Tipo de lançamento" />
        )}

        <div className="py-2">
          <MoneyInput
            grande
            valor={f.valor}
            aoMudar={(v) => set("valor", v)}
            autoFocus={!editando}
            className={cn(
              soDescricao && "opacity-40",
              f.tipo === "ENTRADA" && "text-verde",
            )}
            aria-label="Valor"
          />
          {soDescricao && (
            <p className="text-center text-[13px] text-label-2/60">
              {lancamento?.compraParceladaId
                ? "Parcela: só descrição, categoria e observação podem mudar."
                : "Este lançamento só aceita mudar descrição e observação."}
            </p>
          )}
        </div>

        <div className="grupo">
          <input
            className="campo px-4"
            placeholder={transferencia ? "Descrição (opcional)" : "Descrição"}
            value={f.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            maxLength={120}
            enterKeyHint="done"
            aria-label="Descrição"
          />
        </div>

        {!transferencia && !lancamento?.pagamentoFatura && !lancamento?.caixinhaId && (
          <div>
            <p className="grupo-titulo pt-0">Categoria</p>
            <div className="sem-barra -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Categoria">
              {categorias.map((c) => {
                const on = f.categoriaId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set("categoriaId", on ? "" : c.id)}
                    className={cn(
                      "flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-[15px] transition",
                      on ? "border-tint bg-tint/10 text-label" : "border-transparent bg-card text-label",
                    )}
                  >
                    <IconeQuadrado icone={c.icone} cor={c.cor} tamanho={28} className="rounded-full" />
                    {c.nome}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grupo">
          <CampoLinha rotulo={transferencia ? "De" : f.tipo === "ENTRADA" ? "Entrou em" : "Pago com"} htmlFor="origem">
            <Selecao
              id="origem"
              valor={f.origem}
              aoMudar={(v) => setF((x) => ({ ...x, origem: v, parcelas: 1 }))}
              vazio={f.origem ? undefined : "Escolher"}
              className={cn(bloqueiaOrigem && "pointer-events-none opacity-40")}
              grupos={[
                { rotulo: "Contas", opcoes: contas.map((c) => ({ valor: `conta:${c.id}`, rotulo: c.nome })) },
                ...(f.tipo === "SAIDA"
                  ? [{ rotulo: "Cartões de crédito", opcoes: cartoes.map((c) => ({ valor: `cartao:${c.id}`, rotulo: `Cartão ${c.nome}` })) }]
                  : []),
              ]}
            />
          </CampoLinha>
          {transferencia && (
            <CampoLinha rotulo="Para" htmlFor="destino">
              <Selecao
                id="destino"
                valor={f.destino}
                aoMudar={(v) => set("destino", v)}
                vazio={f.destino ? undefined : "Escolher"}
                className={cn(editando && "pointer-events-none opacity-40")}
                opcoes={contas.filter((c) => `conta:${c.id}` !== f.origem).map((c) => ({ valor: c.id, rotulo: c.nome }))}
              />
            </CampoLinha>
          )}
          <CampoLinha rotulo="Data" htmlFor="data">
            <input
              id="data"
              type="date"
              value={f.data}
              onChange={(e) => e.target.value && set("data", e.target.value)}
              disabled={soDescricao}
              className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none disabled:opacity-40"
            />
          </CampoLinha>
          {!noCartao && !transferencia && !soDescricao && (
            <CampoLinha rotulo={f.tipo === "ENTRADA" ? "Recebido" : "Pago"} htmlFor="pago">
              <Interruptor id="pago" ligado={f.pago} aoMudar={(v) => set("pago", v)} rotulo="Já foi pago" />
            </CampoLinha>
          )}
          {noCartao && !editando && f.repetir === "" && (
            <CampoLinha rotulo="Parcelas">
              <div className="flex items-center gap-3">
                {f.parcelas > 1 && f.valor > 0 && (
                  <span className="valor text-[15px] text-label-2/60">{f.parcelas}x {formatBRL(valorParcela)}</span>
                )}
                <div className="flex items-center overflow-hidden rounded-lg bg-fill/[0.12]">
                  <button
                    type="button"
                    className="h-11 w-11 text-[20px] text-label disabled:opacity-30"
                    disabled={f.parcelas <= 1}
                    onClick={() => set("parcelas", f.parcelas - 1)}
                    aria-label="Menos parcelas"
                  >
                    −
                  </button>
                  <span className="valor w-8 text-center text-[17px]" aria-live="polite">
                    {f.parcelas}
                  </span>
                  <button
                    type="button"
                    className="h-11 w-11 text-[20px] text-label disabled:opacity-30"
                    disabled={f.parcelas >= 48}
                    onClick={() => set("parcelas", f.parcelas + 1)}
                    aria-label="Mais parcelas"
                  >
                    +
                  </button>
                </div>
              </div>
            </CampoLinha>
          )}
          {!editando && !transferencia && f.parcelas === 1 && (
            <CampoLinha rotulo="Repetir" htmlFor="repetir">
              <Selecao
                id="repetir"
                valor={f.repetir}
                aoMudar={(v) => set("repetir", v as Form["repetir"])}
                opcoes={REPETIR.map((r) => ({ valor: r.valor, rotulo: r.rotulo }))}
              />
            </CampoLinha>
          )}
        </div>

        <div className="grupo">
          <textarea
            className="campo min-h-[72px] resize-none px-4"
            placeholder="Observação"
            value={f.observacao}
            onChange={(e) => set("observacao", e.target.value)}
            maxLength={500}
            aria-label="Observação"
          />
        </div>

        <Erro mensagem={erro} />

        {lancamento && (
          <button
            type="button"
            className="btn-perigo w-full"
            onClick={() => confirmarExclusao(lancamento, aoFechar)}
          >
            <Trash2 size={18} /> Excluir
          </button>
        )}
        <button type="submit" className="sr-only">
          Salvar
        </button>
      </form>
    </BottomSheet>
  );
}
