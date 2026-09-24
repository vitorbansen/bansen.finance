"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ActionSheet, type OpcaoAcao } from "@/components/ui/ActionSheet";
import { api } from "@/lib/cliente";
import type { Cadastros, LancamentoDTO } from "@/lib/types";
import { LancamentoSheet } from "./LancamentoSheet";

type Pergunta = { titulo?: string; mensagem?: string; opcoes: OpcaoAcao[] };

type Ctx = {
  cadastros: Cadastros;
  /** Abre o formulário: sem argumento = novo lançamento; com lançamento = edição. */
  abrirLancamento: (l?: LancamentoDTO) => void;
  perguntar: (p: Pergunta) => void;
  avisar: (mensagem: string, erro?: boolean) => void;
  /** Recarrega os dados da tela (server components). */
  atualizar: () => void;
  alternarPago: (l: LancamentoDTO) => Promise<void>;
  confirmarExclusao: (l: LancamentoDTO, depois?: () => void) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp fora do AppProvider");
  return c;
}

export function AppProvider({ cadastros, children }: { cadastros: Cadastros; children: React.ReactNode }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<{ aberto: boolean; lancamento?: LancamentoDTO }>({ aberto: false });
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [aviso, setAviso] = useState<{ id: number; mensagem: string; erro?: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const avisar = useCallback((mensagem: string, erro?: boolean) => {
    clearTimeout(timer.current);
    setAviso({ id: Date.now(), mensagem, erro });
    timer.current = setTimeout(() => setAviso(null), erro ? 4000 : 2200);
  }, []);

  const atualizar = useCallback(() => router.refresh(), [router]);

  const alternarPago = useCallback(
    async (l: LancamentoDTO) => {
      try {
        const novo = await api<LancamentoDTO>("POST", `/api/lancamentos/${l.id}/pagar`, {});
        avisar(novo.status === "PAGO" ? (novo.tipo === "ENTRADA" ? "Marcado como recebido" : "Marcado como pago") : "Marcado como pendente");
        atualizar();
      } catch (e) {
        avisar((e as Error).message, true);
      }
    },
    [avisar, atualizar],
  );

  const confirmarExclusao = useCallback(
    (l: LancamentoDTO, depois?: () => void) => {
      const excluir = async (escopo: "esta" | "proximas" | "todas") => {
        try {
          await api("DELETE", `/api/lancamentos/${l.id}?escopo=${escopo}`);
          avisar("Excluído");
          depois?.();
          atualizar();
        } catch (e) {
          avisar((e as Error).message, true);
        }
      };
      if (l.recorrenciaId) {
        setPergunta({
          titulo: "Excluir lançamento recorrente",
          mensagem: l.descricao,
          opcoes: [
            { rotulo: "Só esta ocorrência", destrutiva: true, aoTocar: () => excluir("esta") },
            { rotulo: "Esta e as próximas", destrutiva: true, aoTocar: () => excluir("proximas") },
          ],
        });
      } else if (l.compraParceladaId) {
        setPergunta({
          titulo: "Excluir compra parcelada",
          mensagem: l.descricao,
          opcoes: [
            { rotulo: "Só esta parcela", destrutiva: true, aoTocar: () => excluir("esta") },
            { rotulo: `Compra inteira (${l.parcelaTotal} parcelas)`, destrutiva: true, aoTocar: () => excluir("todas") },
          ],
        });
      } else {
        setPergunta({
          titulo: l.pagamentoFatura ? "A fatura voltará a ficar em aberto." : undefined,
          mensagem: l.descricao,
          opcoes: [{ rotulo: "Excluir lançamento", destrutiva: true, aoTocar: () => excluir("esta") }],
        });
      }
    },
    [avisar, atualizar],
  );

  const valor = useMemo<Ctx>(
    () => ({
      cadastros,
      abrirLancamento: (l) => setSheet({ aberto: true, lancamento: l }),
      perguntar: setPergunta,
      avisar,
      atualizar,
      alternarPago,
      confirmarExclusao,
    }),
    [cadastros, avisar, atualizar, alternarPago, confirmarExclusao],
  );

  return (
    <AppCtx.Provider value={valor}>
      {children}
      <LancamentoSheet
        aberto={sheet.aberto}
        lancamento={sheet.lancamento}
        aoFechar={() => setSheet({ aberto: false })}
      />
      <ActionSheet
        aberto={!!pergunta}
        titulo={pergunta?.titulo}
        mensagem={pergunta?.mensagem}
        opcoes={pergunta?.opcoes ?? []}
        aoFechar={() => setPergunta(null)}
      />
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-[70] flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {aviso && (
            <motion.div
              key={aviso.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`rounded-full px-4 py-2.5 text-[15px] font-medium shadow-lg backdrop-blur-xl ${
                aviso.erro ? "bg-vermelho text-white" : "bg-card/95 text-label"
              }`}
              role={aviso.erro ? "alert" : "status"}
            >
              {aviso.mensagem}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppCtx.Provider>
  );
}
