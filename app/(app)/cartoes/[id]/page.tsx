import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { DetalheFatura } from "@/components/cartoes/DetalheFatura";
import { requireUserPage } from "@/lib/auth";
import { hojeSP, isMesISO } from "@/lib/finance/dates";
import { faturaDaCompra } from "@/lib/finance/fatura";
import { prisma } from "@/lib/prisma";
import { detalheFatura } from "@/lib/server/cartoes";

export default async function Fatura({ params, searchParams }: { params: { id: string }; searchParams: { mes?: string } }) {
  const user = await requireUserPage();
  const cartao = await prisma.cartao.findFirst({ where: { id: params.id, userId: user.id } });
  if (!cartao) notFound();
  // Sem ?mes=, abre a fatura em que cai uma compra feita hoje.
  const aberta = faturaDaCompra(hojeSP(), cartao).mes;
  const mes = searchParams.mes && isMesISO(searchParams.mes) ? searchParams.mes : aberta;
  const d = await detalheFatura(user.id, cartao.id, mes);

  return (
    <>
      <Cabecalho titulo={cartao.nome} voltar={{ href: "/cartoes", rotulo: "Cartões" }}>
        <MonthPicker mes={mes} inicial={aberta} />
      </Cabecalho>
      <DetalheFatura cartao={d.cartao} fatura={d.fatura} itens={d.itens} />
    </>
  );
}
