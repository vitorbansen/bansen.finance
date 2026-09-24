"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { Vazio, Progresso } from "@/components/ui/Estados";
import { formatarDiaMes, nomeMes } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import type { CartaoDTO, FaturaDTO } from "@/lib/types";
import { CartaoSheet } from "./CartaoSheet";
import { PagarFaturaSheet } from "./PagarFaturaSheet";

type ItemCartao = {
  cartao: CartaoDTO;
  faturaAberta: FaturaDTO;
  faturasAPagar: FaturaDTO[];
  limiteUsado: number;
  limiteDisponivel: number;
};

export function ListaCartoes({ itens }: { itens: ItemCartao[] }) {
  const [novo, setNovo] = useState(false);
  const [pagando, setPagando] = useState<{ cartao: CartaoDTO; fatura: FaturaDTO } | null>(null);

  return (
    <>
      <div className="flex justify-end px-2">
        <button type="button" className="btn-texto gap-1 px-2" onClick={() => setNovo(true)}>
          <Plus size={20} /> Novo cartão
        </button>
      </div>

      {itens.length === 0 ? (
        <Vazio
          className="pt-12"
          icone={<CreditCard size={44} />}
          titulo="Nenhum cartão"
          texto="Cadastre seu cartão para ver a fatura do mês e o limite disponível."
          acao={
            <button type="button" className="btn-primario" onClick={() => setNovo(true)}>
              Adicionar cartão
            </button>
          }
        />
      ) : (
        <div className="space-y-4 px-4">
          {itens.map(({ cartao, faturaAberta, faturasAPagar, limiteUsado, limiteDisponivel }) => (
            <section key={cartao.id} className="space-y-2">
              <Link
                href={`/cartoes/${cartao.id}`}
                className="block overflow-hidden rounded-2xl p-4 text-white shadow-sm active:opacity-80"
                style={{ background: `linear-gradient(135deg, ${cartao.cor}, ${cartao.cor}cc)` }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[17px] font-semibold">{cartao.nome}</p>
                  <CreditCard size={22} aria-hidden className="opacity-80" />
                </div>
                <p className="mt-4 text-[13px] opacity-80">Fatura atual · vence {formatarDiaMes(faturaAberta.vencimento)}</p>
                <p className="valor text-[30px] font-bold tracking-tight">{formatBRL(faturaAberta.total)}</p>
                <p className="text-[13px] opacity-80">Fecha em {formatarDiaMes(faturaAberta.fechamento)}</p>
                {cartao.limite > 0 && (
                  <div className="mt-3">
                    <Progresso valor={limiteUsado / cartao.limite} cor="#fff" className="bg-white/25" rotulo="Limite usado" />
                    <p className="valor mt-1.5 flex justify-between text-[12px] opacity-90">
                      <span>Usado {formatBRL(limiteUsado)}</span>
                      <span>Disponível {formatBRL(limiteDisponivel)}</span>
                    </p>
                  </div>
                )}
              </Link>
              {faturasAPagar.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium capitalize">Fatura de {nomeMes(f.mes).split(" ")[0]} fechada</p>
                    <p className="text-[13px] text-label-2/60">
                      {formatBRL(f.total)} · vence {formatarDiaMes(f.vencimento)}
                    </p>
                  </div>
                  <button type="button" className="btn-primario px-3.5 text-[15px]" onClick={() => setPagando({ cartao, fatura: f })}>
                    Pagar
                  </button>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <CartaoSheet aberto={novo} aoFechar={() => setNovo(false)} />
      {pagando && <PagarFaturaSheet cartao={pagando.cartao} fatura={pagando.fatura} aoFechar={() => setPagando(null)} />}
    </>
  );
}
