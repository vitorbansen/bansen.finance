"use client";

import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, Banknote, Landmark, Plus, Trash2, Wallet } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha, Erro } from "@/components/ui/Campos";
import { Linha } from "@/components/ui/Lista";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Segmented } from "@/components/ui/Segmented";
import { SeletorCor } from "@/components/ui/SeletorCor";
import { api } from "@/lib/cliente";
import { formatBRL } from "@/lib/finance/money";
import type { ContaDTO, TipoConta } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIPOS: Record<TipoConta, { rotulo: string; icone: typeof Landmark }> = {
  CORRENTE: { rotulo: "Conta corrente", icone: Landmark },
  CARTEIRA: { rotulo: "Carteira / dinheiro", icone: Wallet },
  INVESTIMENTO: { rotulo: "Investimento / reserva", icone: Banknote },
};

export function Contas() {
  const { cadastros } = useApp();
  const [editando, setEditando] = useState<ContaDTO | "nova" | null>(null);
  const ativas = cadastros.contas.filter((c) => !c.arquivada);
  const arquivadas = cadastros.contas.filter((c) => c.arquivada);
  const total = ativas.reduce((a, c) => a + c.saldo, 0);

  const linha = (c: ContaDTO) => {
    const Icone = TIPOS[c.tipo].icone;
    return (
      <Linha
        key={c.id}
        icone={
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-white" style={{ backgroundColor: c.cor }}>
            <Icone size={17} />
          </span>
        }
        titulo={c.nome}
        subtitulo={TIPOS[c.tipo].rotulo}
        direita={<span className={cn("valor", c.saldo < 0 ? "text-vermelho" : "text-label")}>{formatBRL(c.saldo)}</span>}
        seta
        onClick={() => setEditando(c)}
      />
    );
  };

  return (
    <>
      <div className="flex items-center justify-between px-4">
        <p className="text-[15px] text-label-2/60">
          Total: <span className="valor font-semibold text-label">{formatBRL(total)}</span>
        </p>
        <button type="button" className="btn-texto gap-1" onClick={() => setEditando("nova")}>
          <Plus size={20} /> Nova
        </button>
      </div>
      <div className="space-y-2 px-4">
        <div className="grupo">{ativas.map(linha)}</div>
        {arquivadas.length > 0 && (
          <section>
            <h2 className="grupo-titulo">Arquivadas</h2>
            <div className="grupo opacity-60">{arquivadas.map(linha)}</div>
          </section>
        )}
        <p className="px-4 pt-2 text-[13px] text-label-2/60">
          Para transferir entre contas, use o botão + e escolha &quot;Transferência&quot;.
        </p>
      </div>
      <ContaSheet alvo={editando} aoFechar={() => setEditando(null)} />
    </>
  );
}

function ContaSheet({ alvo, aoFechar }: { alvo: ContaDTO | "nova" | null; aoFechar: () => void }) {
  const { avisar, atualizar, perguntar } = useApp();
  const existente = alvo && alvo !== "nova" ? alvo : null;
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("CORRENTE");
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [negativo, setNegativo] = useState(false);
  const [cor, setCor] = useState("#0A84FF");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!alvo) return;
    setNome(existente?.nome ?? "");
    setTipo(existente?.tipo ?? "CORRENTE");
    setSaldoInicial(Math.abs(existente?.saldoInicial ?? 0));
    setNegativo((existente?.saldoInicial ?? 0) < 0);
    setCor(existente?.cor ?? "#0A84FF");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo]);

  async function salvar() {
    if (!nome.trim()) return setErro("Informe o nome");
    setSalvando(true);
    setErro(null);
    try {
      const corpo = { nome: nome.trim(), tipo, saldoInicial: negativo ? -saldoInicial : saldoInicial, cor };
      if (existente) await api("PATCH", `/api/contas/${existente.id}`, corpo);
      else await api("POST", "/api/contas", corpo);
      avisar(existente ? "Conta atualizada" : "Conta criada");
      aoFechar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const arquivar = async (arquivada: boolean) => {
    try {
      await api("PATCH", `/api/contas/${existente!.id}`, { arquivada });
      avisar(arquivada ? "Conta arquivada" : "Conta reativada");
      aoFechar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const excluir = () =>
    perguntar({
      titulo: "Excluir conta",
      mensagem: "Só é possível excluir contas sem movimentação. Com histórico, arquive.",
      opcoes: [
        {
          rotulo: "Excluir",
          destrutiva: true,
          aoTocar: async () => {
            try {
              await api("DELETE", `/api/contas/${existente!.id}`);
              avisar("Conta excluída");
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
      titulo={existente ? "Editar conta" : "Nova conta"}
      acao={
        <button type="button" className="btn-texto px-2 font-semibold" disabled={salvando} onClick={salvar}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="grupo">
          <input className="campo px-4" placeholder="Nome (ex.: Itaú)" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} aria-label="Nome da conta" />
        </div>
        <Segmented
          aria-label="Tipo de conta"
          valor={tipo}
          aoMudar={setTipo}
          opcoes={[
            { valor: "CORRENTE", rotulo: "Corrente" },
            { valor: "CARTEIRA", rotulo: "Carteira" },
            { valor: "INVESTIMENTO", rotulo: "Investimento" },
          ]}
        />
        <div className="grupo">
          <CampoLinha rotulo="Saldo inicial" htmlFor="ct-saldo">
            <MoneyInput id="ct-saldo" valor={saldoInicial} aoMudar={setSaldoInicial} className={cn("text-right", negativo ? "text-vermelho" : "text-label-2/60")} aria-label="Saldo inicial" />
          </CampoLinha>
          <CampoLinha rotulo="Saldo negativo" htmlFor="ct-neg">
            <button
              id="ct-neg"
              type="button"
              role="switch"
              aria-checked={negativo}
              onClick={() => setNegativo(!negativo)}
              className={cn("min-h-[36px] rounded-lg px-3 text-[15px]", negativo ? "bg-vermelho/15 text-vermelho" : "bg-fill/[0.12] text-label-2/60")}
            >
              {negativo ? "Sim (cheque especial)" : "Não"}
            </button>
          </CampoLinha>
        </div>
        <p className="px-4 text-[13px] text-label-2/60">
          {tipo === "INVESTIMENTO"
            ? "Contas de investimento entram no total guardado e ficam fora do saldo livre do mês."
            : "O saldo atual é o saldo inicial mais os lançamentos pagos."}
        </p>
        <SeletorCor valor={cor} aoMudar={setCor} />
        <Erro mensagem={erro} />
        {existente && (
          <div className="flex gap-2">
            <button type="button" className="btn-secundario flex-1" onClick={() => arquivar(!existente.arquivada)}>
              {existente.arquivada ? <ArchiveRestore size={18} /> : <Archive size={18} />}
              {existente.arquivada ? "Reativar" : "Arquivar"}
            </button>
            <button type="button" className="btn-perigo flex-1" onClick={excluir}>
              <Trash2 size={18} /> Excluir
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
