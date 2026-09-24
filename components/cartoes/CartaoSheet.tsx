"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha, Erro, Selecao } from "@/components/ui/Campos";
import { CORES } from "@/components/ui/Icone";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { SeletorCor } from "@/components/ui/SeletorCor";
import { api } from "@/lib/cliente";
import type { CartaoDTO } from "@/lib/types";

const DIAS = Array.from({ length: 31 }, (_, i) => ({ valor: String(i + 1), rotulo: `Dia ${i + 1}` }));

export function CartaoSheet({ aberto, cartao, aoFechar }: { aberto: boolean; cartao?: CartaoDTO; aoFechar: () => void }) {
  const { cadastros, avisar, atualizar, perguntar } = useApp();
  const router = useRouter();
  const contas = cadastros.contas.filter((c) => !c.arquivada && c.tipo !== "INVESTIMENTO");
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState(0);
  const [fechamento, setFechamento] = useState("3");
  const [vencimento, setVencimento] = useState("10");
  const [contaId, setContaId] = useState("");
  const [cor, setCor] = useState(CORES[8]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setNome(cartao?.nome ?? "");
    setLimite(cartao?.limite ?? 0);
    setFechamento(String(cartao?.diaFechamento ?? 3));
    setVencimento(String(cartao?.diaVencimento ?? 10));
    setContaId(cartao?.contaPagamentoId ?? contas[0]?.id ?? "");
    setCor(cartao?.cor ?? CORES[8]);
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, cartao]);

  async function salvar() {
    setErro(null);
    if (!nome.trim()) return setErro("Informe o nome do cartão");
    if (!contaId) return setErro("Escolha a conta que paga a fatura");
    setSalvando(true);
    try {
      const corpo = {
        nome: nome.trim(),
        limite,
        diaFechamento: Number(fechamento),
        diaVencimento: Number(vencimento),
        contaPagamentoId: contaId,
        cor,
      };
      if (cartao) await api("PATCH", `/api/cartoes/${cartao.id}`, corpo);
      else await api("POST", "/api/cartoes", corpo);
      avisar(cartao ? "Cartão atualizado" : "Cartão criado");
      aoFechar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const remover = () =>
    perguntar({
      titulo: "Remover cartão",
      mensagem: "Cartões com compras são arquivados (o histórico fica).",
      opcoes: [
        {
          rotulo: "Excluir cartão",
          destrutiva: true,
          aoTocar: async () => {
            try {
              await api("DELETE", `/api/cartoes/${cartao!.id}`);
              avisar("Cartão excluído");
            } catch {
              await api("PATCH", `/api/cartoes/${cartao!.id}`, { arquivado: true });
              avisar("Cartão arquivado");
            }
            aoFechar();
            router.push("/cartoes");
            atualizar();
          },
        },
      ],
    });

  return (
    <BottomSheet
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={cartao ? "Editar cartão" : "Novo cartão"}
      acao={
        <button type="button" className="btn-texto px-2 font-semibold" disabled={salvando} onClick={salvar}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="grupo">
          <input className="campo px-4" placeholder="Nome (ex.: Nubank)" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} aria-label="Nome do cartão" />
          <CampoLinha rotulo="Limite" htmlFor="limite">
            <MoneyInput id="limite" valor={limite} aoMudar={setLimite} className="text-right text-label-2/60" aria-label="Limite" />
          </CampoLinha>
          <CampoLinha rotulo="Fecha" htmlFor="fech">
            <Selecao id="fech" valor={fechamento} aoMudar={setFechamento} opcoes={DIAS} />
          </CampoLinha>
          <CampoLinha rotulo="Vence" htmlFor="venc">
            <Selecao id="venc" valor={vencimento} aoMudar={setVencimento} opcoes={DIAS} />
          </CampoLinha>
          <CampoLinha rotulo="Paga com" htmlFor="conta-pag">
            <Selecao id="conta-pag" valor={contaId} aoMudar={setContaId} opcoes={contas.map((c) => ({ valor: c.id, rotulo: c.nome }))} vazio={contaId ? undefined : "Escolher"} />
          </CampoLinha>
        </div>
        <p className="px-4 text-[13px] text-label-2/60">
          Compras a partir do dia do fechamento caem na fatura seguinte.
          {cartao && " Mudar os dias vale para compras novas."}
        </p>
        <SeletorCor valor={cor} aoMudar={setCor} />
        <Erro mensagem={erro} />
        {cartao && (
          <button type="button" className="btn-perigo w-full" onClick={remover}>
            <Trash2 size={18} /> Remover cartão
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
