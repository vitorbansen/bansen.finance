import Link from "next/link";
import { ChevronRight, PiggyBank } from "lucide-react";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Vazio } from "@/components/ui/Estados";
import { CartaoExpansivel } from "@/components/inicio/CartaoExpansivel";
import { Decomposicao } from "@/components/inicio/Decomposicao";
import { GastosPorCategoria } from "@/components/inicio/GastosPorCategoria";
import { ProximosVencimentos } from "@/components/inicio/ProximosVencimentos";
import { requireUserPage } from "@/lib/auth";
import { addMesesMes, mesAtualSP, nomeMes, nomeMesCurto } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { mesDaUrl } from "@/lib/mes-da-url";
import { montarResumo } from "@/lib/server/resumo";
import { cn } from "@/lib/utils";

export default async function Inicio({ searchParams }: { searchParams: { mes?: string } }) {
  const user = await requireUserPage();
  const mes = mesDaUrl(searchParams);
  const r = await montarResumo(user.id, mes);
  const { saldoLivre: sl, projecao: pj, resumo } = r;
  const atual = mes === mesAtualSP();
  const nomeProximo = nomeMes(addMesesMes(mes, 1)).split(" ")[0];
  const primeiroNome = user.nome.split(" ")[0];

  return (
    <>
      <Cabecalho titulo={atual ? `Olá, ${primeiroNome}` : "Resumo"}>
        <MonthPicker mes={mes} />
      </Cabecalho>

      <div className="space-y-3 px-4 pt-2">
        <CartaoExpansivel
          destaque
          rotulo={atual ? "Livre para gastar este mês" : `Saldo livre em ${nomeMes(mes).split(" ")[0]}`}
          valor={<span className={cn(sl.saldoLivre < 0 && "text-vermelho")}>{formatBRL(sl.saldoLivre)}</span>}
          legenda={sl.saldoLivre < 0 ? "As contas previstas passam do que você tem." : "Depois de pagar tudo o que está previsto."}
        >
          <Decomposicao
            linhas={[
              { rotulo: "Saldo em contas", valor: sl.saldoContas, sinal: "+" },
              { rotulo: "Entradas previstas", valor: sl.entradasPendentes, sinal: "+" },
              { rotulo: "Saídas previstas", valor: sl.saidasPendentes, sinal: "−" },
              { rotulo: "Faturas a vencer", valor: sl.faturasAVencer, sinal: "−" },
              { rotulo: "Planejado para guardar", valor: sl.guardar, sinal: "−" },
              { rotulo: "Saldo livre", valor: sl.saldoLivre, sinal: "=" },
            ]}
          />
        </CartaoExpansivel>

        <CartaoExpansivel
          rotulo={`Previsão para ${nomeProximo}`}
          valor={<span className={cn(pj.saldo < 0 && "text-vermelho")}>{formatBRL(pj.saldo)}</span>}
          legenda="O que deve sobrar no fim do próximo mês."
        >
          <Decomposicao
            linhas={[
              { rotulo: "Sobra deste mês", valor: pj.sobraDoMes, sinal: "+" },
              { rotulo: "Entradas previstas", valor: pj.entradas, sinal: "+" },
              { rotulo: "Contas fixas e pendentes", valor: pj.saidas, sinal: "−" },
              { rotulo: "Fatura do cartão", valor: pj.faturas, sinal: "−" },
              { rotulo: "Guardar nas caixinhas", valor: pj.guardar, sinal: "−" },
              { rotulo: "Previsão", valor: pj.saldo, sinal: "=" },
            ]}
          />
        </CartaoExpansivel>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/mais/contas" className="rounded-2xl bg-card p-4 active:opacity-70">
            <p className="text-[13px] text-label-2/60">Saldo em contas</p>
            <p className={cn("valor mt-0.5 text-[20px] font-bold tracking-tight", r.saldoTotal < 0 && "text-vermelho")}>
              {formatBRL(r.saldoTotal)}
            </p>
          </Link>
          <Link href="/guardado" className="rounded-2xl bg-card p-4 active:opacity-70">
            <p className="flex items-center gap-1 text-[13px] text-label-2/60">
              <PiggyBank size={14} aria-hidden /> Guardado
            </p>
            <p className="valor mt-0.5 text-[20px] font-bold tracking-tight">{formatBRL(r.totalGuardado)}</p>
          </Link>
        </div>

        <section className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold capitalize">{nomeMes(mes).split(" ")[0]}</h2>
            <Link href={`/lancamentos${atual ? "" : `?mes=${mes}`}`} className="flex min-h-[32px] items-center text-[15px] text-tint">
              Lançamentos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[13px] text-label-2/60">Entradas</p>
              <p className="valor text-[17px] font-semibold text-verde">{formatBRL(resumo.entradasRealizadas)}</p>
              {resumo.entradasPrevistas > 0 && (
                <p className="valor text-[13px] text-label-2/60">+ {formatBRL(resumo.entradasPrevistas)} previsto</p>
              )}
            </div>
            <div>
              <p className="text-[13px] text-label-2/60">Saídas</p>
              <p className="valor text-[17px] font-semibold">{formatBRL(resumo.saidasRealizadas)}</p>
              {resumo.saidasPrevistas > 0 && (
                <p className="valor text-[13px] text-label-2/60">+ {formatBRL(resumo.saidasPrevistas)} previsto</p>
              )}
            </div>
          </div>
          <p className="mt-2 text-[12px] text-label-2/60">Compras no cartão entram quando a fatura vence.</p>
        </section>
      </div>

      <h2 className="grupo-titulo mx-4 px-0">Próximos 7 dias</h2>
      <div className="px-4">
        <ProximosVencimentos itens={r.proximosVencimentos} />
      </div>

      <h2 className="grupo-titulo mx-4 px-0">Gastos por categoria</h2>
      <div className="px-4">
        {r.gastos.categorias.length ? (
          <GastosPorCategoria
            categorias={r.gastos.categorias}
            total={r.gastos.total}
            totalAnterior={r.gastos.totalAnterior}
            nomeMesAnterior={nomeMesCurto(addMesesMes(mes, -1))}
          />
        ) : (
          <div className="rounded-2xl bg-card">
            <Vazio titulo="Nenhum gasto neste mês" texto="Toque no + para registrar o primeiro." />
          </div>
        )}
      </div>
    </>
  );
}
