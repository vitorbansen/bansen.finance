import { Landmark } from "lucide-react";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Grupo, Linha } from "@/components/ui/Lista";
import { Caixinhas } from "@/components/guardado/Caixinhas";
import { requireUserPage } from "@/lib/auth";
import { formatBRL } from "@/lib/finance/money";
import { listarCaixinhas } from "@/lib/server/caixinhas";
import { listarContas } from "@/lib/server/contas";

export default async function Guardado() {
  const user = await requireUserPage();
  const [caixinhas, contas] = await Promise.all([listarCaixinhas(user.id), listarContas(user.id)]);
  const investimentos = contas.filter((c) => c.tipo === "INVESTIMENTO");
  const emCaixinhas = caixinhas.reduce((a, c) => a + c.saldo, 0);
  const emInvestimentos = investimentos.reduce((a, c) => a + c.saldo, 0);

  return (
    <>
      <Cabecalho titulo="Guardado" />
      <div className="px-4">
        <section className="rounded-2xl bg-card p-5">
          <p className="text-[15px] text-label-2/60">Total guardado</p>
          <p className="valor text-[34px] font-bold leading-tight tracking-tight">{formatBRL(emCaixinhas + emInvestimentos)}</p>
          <div className="mt-2 flex gap-6 text-[13px] text-label-2/60">
            <span>Caixinhas: {formatBRL(emCaixinhas)}</span>
            <span>Investimentos: {formatBRL(emInvestimentos)}</span>
          </div>
        </section>
      </div>

      <Caixinhas caixinhas={caixinhas} />

      {investimentos.length > 0 && (
        <Grupo titulo="Contas de investimento" className="px-4" rodape="Gerencie em Mais › Contas.">
          {investimentos.map((c) => (
            <Linha
              key={c.id}
              icone={
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-white" style={{ backgroundColor: c.cor }}>
                  <Landmark size={17} />
                </span>
              }
              titulo={c.nome}
              direita={<span className="valor text-label">{formatBRL(c.saldo)}</span>}
            />
          ))}
        </Grupo>
      )}
    </>
  );
}
