"use client";

import { useEffect, useState } from "react";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/app/AppProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha, Erro, Selecao } from "@/components/ui/Campos";
import { ICONES, IconeQuadrado } from "@/components/ui/Icone";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Progresso, Vazio } from "@/components/ui/Estados";
import { Segmented } from "@/components/ui/Segmented";
import { SeletorCor } from "@/components/ui/SeletorCor";
import { api } from "@/lib/cliente";
import { diffDias, formatarData, hojeSP } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { CaixinhaDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

type Caixinha = CaixinhaDTO & { depositadoNoMes: number };

export function Caixinhas({ caixinhas }: { caixinhas: Caixinha[] }) {
  const [movendo, setMovendo] = useState<Caixinha | null>(null);
  const [editando, setEditando] = useState<Caixinha | "nova" | null>(null);

  return (
    <>
      <div className="flex items-center justify-between px-4 pb-1 pt-5">
        <h2 className="text-[13px] uppercase tracking-wide text-label-2/60">Caixinhas</h2>
        <button type="button" className="btn-texto gap-1 text-[15px]" onClick={() => setEditando("nova")}>
          <Plus size={18} /> Nova
        </button>
      </div>

      {caixinhas.length === 0 ? (
        <div className="mx-4 rounded-2xl bg-card">
          <Vazio
            icone={<PiggyBank size={44} />}
            titulo="Nenhuma caixinha"
            texto="Separe dinheiro para uma meta: reserva de emergência, viagem, carro…"
            acao={
              <button type="button" className="btn-primario" onClick={() => setEditando("nova")}>
                Criar caixinha
              </button>
            }
          />
        </div>
      ) : (
        <ul className="space-y-3 px-4">
          {caixinhas.map((c) => {
            const progresso = c.valorAlvo ? c.saldo / c.valorAlvo : null;
            const falta = c.valorAlvo ? Math.max(0, c.valorAlvo - c.saldo) : 0;
            const faltaMes = c.planejadoMensal ? Math.max(0, c.planejadoMensal - c.depositadoNoMes) : 0;
            return (
              <li key={c.id} className="rounded-2xl bg-card p-4">
                <div>
                  <div className="flex items-center gap-3">
                    <IconeQuadrado icone={c.icone} cor={c.cor} tamanho={40} className="rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-semibold">{c.nome}</p>
                      <p className="text-[13px] text-label-2/60">
                        {c.valorAlvo ? `Meta ${formatBRL(c.valorAlvo)}` : "Sem meta"}
                        {c.prazo && ` · até ${formatarData(c.prazo)}`}
                      </p>
                    </div>
                    <p className="valor text-[20px] font-bold tracking-tight">{formatBRL(c.saldo)}</p>
                  </div>
                  {progresso !== null && (
                    <div className="mt-3">
                      <Progresso valor={progresso} cor={c.cor} rotulo={`Progresso de ${c.nome}`} />
                      <p className="mt-1.5 flex justify-between text-[13px] text-label-2/60">
                        <span>{Math.min(100, Math.round(progresso * 100))}%</span>
                        <span>{falta > 0 ? `Faltam ${formatBRL(falta)}` : "Meta atingida"}</span>
                      </p>
                    </div>
                  )}
                  {c.planejadoMensal ? (
                    <p className={cn("mt-2 text-[13px]", faltaMes > 0 ? "text-laranja" : "text-verde")}>
                      {faltaMes > 0
                        ? `Guardar ${formatBRL(faltaMes)} este mês (planejado ${formatBRL(c.planejadoMensal)})`
                        : `Planejado do mês já guardado`}
                    </p>
                  ) : null}
                  {c.valorAlvo && c.prazo && falta > 0 && <Ritmo falta={falta} prazo={c.prazo} />}
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn-secundario flex-1 text-[15px]" onClick={() => setMovendo(c)}>
                    Depositar / Resgatar
                  </button>
                  <button type="button" className="btn-secundario px-4 text-[15px]" onClick={() => setEditando(c)}>
                    Editar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <MovimentarSheet caixinha={movendo} aoFechar={() => setMovendo(null)} />
      <CaixinhaSheet alvo={editando} aoFechar={() => setEditando(null)} />
    </>
  );
}

/** Quanto por mês seria preciso para bater a meta no prazo. */
function Ritmo({ falta, prazo }: { falta: number; prazo: string }) {
  const meses = Math.max(1, Math.ceil(diffDias(hojeSP(), prazo) / 30));
  return <p className="mt-1 text-[13px] text-label-2/60">Para chegar no prazo: {formatBRL(Math.ceil(falta / meses))}/mês</p>;
}

function MovimentarSheet({ caixinha, aoFechar }: { caixinha: Caixinha | null; aoFechar: () => void }) {
  const { cadastros, avisar, atualizar } = useApp();
  const contas = cadastros.contas.filter((c) => !c.arquivada);
  const [tipo, setTipo] = useState<"DEPOSITO" | "RESGATE">("DEPOSITO");
  const [valor, setValor] = useState(0);
  const [contaId, setContaId] = useState("");
  const [data, setData] = useState(hojeSP());
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!caixinha) return;
    setTipo("DEPOSITO");
    setValor(caixinha.planejadoMensal ? Math.max(0, caixinha.planejadoMensal - caixinha.depositadoNoMes) : 0);
    setContaId((contas.find((c) => c.tipo === "CORRENTE") ?? contas[0])?.id ?? "");
    setData(hojeSP());
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caixinha]);

  async function salvar() {
    if (!caixinha) return;
    if (valor <= 0) return setErro("Informe o valor");
    if (!contaId) return setErro("Escolha a conta");
    setSalvando(true);
    setErro(null);
    try {
      await api("POST", `/api/caixinhas/${caixinha.id}/movimentar`, { tipo, valor, contaId, data });
      avisar(tipo === "DEPOSITO" ? `Guardado em ${caixinha.nome}` : `Resgatado de ${caixinha.nome}`);
      aoFechar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <BottomSheet
      aberto={!!caixinha}
      aoFechar={aoFechar}
      titulo={caixinha?.nome}
      acao={
        <button type="button" className="btn-texto px-2 font-semibold" disabled={salvando} onClick={salvar}>
          {salvando ? "Salvando…" : "Confirmar"}
        </button>
      }
    >
      {caixinha && (
        <div className="space-y-4 pt-2">
          <Segmented
            aria-label="Operação"
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[
              { valor: "DEPOSITO", rotulo: "Depositar" },
              { valor: "RESGATE", rotulo: "Resgatar" },
            ]}
          />
          <div className="py-2">
            <MoneyInput grande valor={valor} aoMudar={setValor} autoFocus />
            <p className="text-center text-[13px] text-label-2/60">Saldo da caixinha: {formatBRL(caixinha.saldo)}</p>
          </div>
          <div className="grupo">
            <CampoLinha rotulo={tipo === "DEPOSITO" ? "Sai de" : "Vai para"} htmlFor="mv-conta">
              <Selecao id="mv-conta" valor={contaId} aoMudar={setContaId} opcoes={contas.map((c) => ({ valor: c.id, rotulo: c.nome }))} />
            </CampoLinha>
            <CampoLinha rotulo="Data" htmlFor="mv-data">
              <input
                id="mv-data"
                type="date"
                value={data}
                onChange={(e) => e.target.value && setData(e.target.value)}
                className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none"
              />
            </CampoLinha>
          </div>
          <p className="px-4 text-[13px] text-label-2/60">Movimentar a caixinha não conta como gasto nem como receita.</p>
          <Erro mensagem={erro} />
        </div>
      )}
    </BottomSheet>
  );
}

const ICONES_CAIXINHA = ["piggy-bank", "shield", "plane", "car", "house", "graduation-cap", "gift", "smartphone", "heart-pulse", "target", "sparkles", "trending-up"];

function CaixinhaSheet({ alvo, aoFechar }: { alvo: Caixinha | "nova" | null; aoFechar: () => void }) {
  const { avisar, atualizar, perguntar } = useApp();
  const existente = alvo && alvo !== "nova" ? alvo : null;
  const [nome, setNome] = useState("");
  const [valorAlvo, setValorAlvo] = useState(0);
  const [planejado, setPlanejado] = useState(0);
  const [prazo, setPrazo] = useState("");
  const [cor, setCor] = useState("#34C759");
  const [icone, setIcone] = useState("piggy-bank");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!alvo) return;
    setNome(existente?.nome ?? "");
    setValorAlvo(existente?.valorAlvo ?? 0);
    setPlanejado(existente?.planejadoMensal ?? 0);
    setPrazo(existente?.prazo ?? "");
    setCor(existente?.cor ?? "#34C759");
    setIcone(existente?.icone ?? "piggy-bank");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo]);

  async function salvar() {
    if (!nome.trim()) return setErro("Informe o nome");
    setSalvando(true);
    setErro(null);
    const corpo = {
      nome: nome.trim(),
      valorAlvo: valorAlvo || null,
      planejadoMensal: planejado || null,
      prazo: prazo || null,
      cor,
      icone,
    };
    try {
      if (existente) await api("PATCH", `/api/caixinhas/${existente.id}`, corpo);
      else await api("POST", "/api/caixinhas", corpo);
      avisar(existente ? "Caixinha atualizada" : "Caixinha criada");
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
      titulo: "Excluir caixinha",
      mensagem: existente!.saldo > 0 ? "Resgate o saldo antes de excluir." : existente!.nome,
      opcoes: [
        {
          rotulo: "Excluir",
          destrutiva: true,
          aoTocar: async () => {
            try {
              await api("DELETE", `/api/caixinhas/${existente!.id}`);
              avisar("Caixinha excluída");
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
      titulo={existente ? "Editar caixinha" : "Nova caixinha"}
      acao={
        <button type="button" className="btn-texto px-2 font-semibold" disabled={salvando} onClick={salvar}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="grupo">
          <input className="campo px-4" placeholder="Nome (ex.: Reserva de emergência)" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} aria-label="Nome" />
          <CampoLinha rotulo="Meta" htmlFor="cx-alvo">
            <MoneyInput id="cx-alvo" valor={valorAlvo} aoMudar={setValorAlvo} className="text-right text-label-2/60" aria-label="Valor da meta" />
          </CampoLinha>
          <CampoLinha rotulo="Guardar por mês" htmlFor="cx-plan">
            <MoneyInput id="cx-plan" valor={planejado} aoMudar={setPlanejado} className="text-right text-label-2/60" aria-label="Guardar por mês" />
          </CampoLinha>
          <CampoLinha rotulo="Prazo" htmlFor="cx-prazo">
            <input
              id="cx-prazo"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none"
            />
          </CampoLinha>
        </div>
        <p className="px-4 text-[13px] text-label-2/60">
          Meta, prazo e valor mensal são opcionais. O valor mensal é descontado do seu saldo livre até ser depositado.
        </p>
        <div>
          <p className="grupo-titulo pt-0">Ícone</p>
          <div className="grupo flex flex-wrap gap-2 p-3" role="radiogroup" aria-label="Ícone">
            {ICONES_CAIXINHA.filter((i) => ICONES[i]).map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={icone === i}
                aria-label={i}
                onClick={() => setIcone(i)}
                className={cn("flex h-11 w-11 items-center justify-center rounded-xl", icone === i && "ring-2 ring-tint")}
              >
                <IconeQuadrado icone={i} cor={cor} tamanho={32} />
              </button>
            ))}
          </div>
        </div>
        <SeletorCor valor={cor} aoMudar={setCor} />
        <Erro mensagem={erro} />
        {existente && (
          <button type="button" className="btn-perigo w-full" onClick={excluir}>
            <Trash2 size={18} /> Excluir caixinha
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
