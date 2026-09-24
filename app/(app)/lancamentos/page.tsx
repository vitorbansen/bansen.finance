import { Cabecalho } from "@/components/ui/Cabecalho";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Filtros } from "@/components/lancamentos/Filtros";
import { ListaLancamentos } from "@/components/lancamentos/ListaLancamentos";
import { requireUserPage } from "@/lib/auth";
import { hojeSP } from "@/lib/finance/dates";
import { formatBRL } from "@/lib/finance/money";
import { mesDaUrl } from "@/lib/mes-da-url";
import { listarLancamentos } from "@/lib/server/lancamentos";
import { lancamentosQuerySchema } from "@/lib/validators";

type SP = Record<string, string | undefined>;

export default async function Lancamentos({ searchParams }: { searchParams: SP }) {
  const user = await requireUserPage();
  const mes = mesDaUrl(searchParams);
  // Filtros inválidos na URL são ignorados em vez de quebrar a tela.
  const filtros = lancamentosQuerySchema.safeParse({ ...searchParams, mes });
  const f = filtros.success ? filtros.data : { mes };
  const lancamentos = await listarLancamentos(user.id, f);
  const filtrado = Object.keys(f).some((k) => k !== "mes" && f[k as keyof typeof f]);

  const entradas = lancamentos.filter((l) => l.tipo === "ENTRADA").reduce((a, l) => a + l.valor, 0);
  const saidas = lancamentos.filter((l) => l.tipo === "SAIDA" && !l.pagamentoFatura).reduce((a, l) => a + l.valor, 0);

  return (
    <>
      <Cabecalho titulo="Lançamentos">
        <MonthPicker mes={mes} />
      </Cabecalho>
      <Filtros />
      <div className="mx-4 grid grid-cols-2 gap-3 pb-1">
        <div className="rounded-xl bg-card px-3.5 py-2.5">
          <p className="text-[13px] text-label-2/60">Entradas</p>
          <p className="valor text-[17px] font-semibold text-verde">{formatBRL(entradas)}</p>
        </div>
        <div className="rounded-xl bg-card px-3.5 py-2.5">
          <p className="text-[13px] text-label-2/60">Gastos</p>
          <p className="valor text-[17px] font-semibold">{formatBRL(saidas)}</p>
        </div>
      </div>
      <ListaLancamentos lancamentos={lancamentos} hoje={hojeSP()} filtrado={filtrado} />
    </>
  );
}
