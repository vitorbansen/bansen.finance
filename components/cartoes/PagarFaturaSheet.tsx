"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha, Erro, Selecao } from "@/components/ui/Campos";
import { api } from "@/lib/cliente";
import { hojeSP, nomeMes } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { CartaoDTO, FaturaDTO } from "@/lib/types";

/** Confirma o pagamento: sai o total da fatura da conta escolhida (padrão: a vinculada ao cartão). */
export function PagarFaturaSheet({
  cartao,
  fatura,
  aoFechar,
}: {
  cartao: CartaoDTO;
  fatura: FaturaDTO | null;
  aoFechar: () => void;
}) {
  const { cadastros, avisar, atualizar } = useApp();
  const [data, setData] = useState(hojeSP());
  const [contaId, setContaId] = useState(cartao.contaPagamentoId);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (fatura) {
      setData(hojeSP());
      setContaId(cartao.contaPagamentoId);
      setErro(null);
    }
  }, [fatura, cartao.contaPagamentoId]);

  async function pagar() {
    if (!fatura) return;
    setSalvando(true);
    setErro(null);
    try {
      await api("POST", `/api/cartoes/${cartao.id}/faturas/${fatura.mes}/pagar`, { data, contaId });
      avisar("Fatura paga");
      aoFechar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <BottomSheet aberto={!!fatura} aoFechar={aoFechar} titulo="Pagar fatura">
      {fatura && (
        <div className="space-y-4 pt-2">
          <div className="py-3 text-center">
            <p className="text-[15px] capitalize text-label-2/60">
              {cartao.nome} · {nomeMes(fatura.mes)}
            </p>
            <p className="valor text-[40px] font-semibold tracking-tight">{formatBRL(fatura.total)}</p>
          </div>
          <div className="grupo">
            <CampoLinha rotulo="Pagar com" htmlFor="pf-conta">
              <Selecao
                id="pf-conta"
                valor={contaId}
                aoMudar={setContaId}
                opcoes={cadastros.contas.filter((c) => !c.arquivada).map((c) => ({ valor: c.id, rotulo: c.nome }))}
              />
            </CampoLinha>
            <CampoLinha rotulo="Data" htmlFor="pf-data">
              <input
                id="pf-data"
                type="date"
                value={data}
                onChange={(e) => e.target.value && setData(e.target.value)}
                className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none"
              />
            </CampoLinha>
          </div>
          <Erro mensagem={erro} />
          <button type="button" className="btn-primario w-full" disabled={salvando} onClick={pagar}>
            {salvando ? "Pagando…" : `Pagar ${formatBRL(fatura.total)}`}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
