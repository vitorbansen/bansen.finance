import { Cabecalho } from "@/components/ui/Cabecalho";
import { Recorrencias } from "@/components/mais/Recorrencias";
import { requireUserPage } from "@/lib/auth";
import { formatBRL } from "@/lib/finance/money";
import { listarRecorrencias } from "@/lib/server/recorrencias";

export default async function RecorrenciasPage() {
  const user = await requireUserPage();
  const { recorrencias, totais } = await listarRecorrencias(user.id);
  return (
    <>
      <Cabecalho titulo="Recorrências" voltar={{ href: "/mais", rotulo: "Mais" }} />
      <div className="px-4 pb-2">
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4">
            <p className="text-[13px] text-label-2/60">Comprometido por mês</p>
            <p className="valor text-[22px] font-bold tracking-tight">{formatBRL(totais.saidas)}</p>
          </div>
          <div className="rounded-2xl bg-card p-4">
            <p className="text-[13px] text-label-2/60">Entradas fixas</p>
            <p className="valor text-[22px] font-bold tracking-tight text-verde">{formatBRL(totais.entradas)}</p>
          </div>
        </section>
      </div>
      <Recorrencias recorrencias={recorrencias} />
    </>
  );
}
