import { Cabecalho } from "@/components/ui/Cabecalho";
import { Contas } from "@/components/mais/Contas";
import { requireUserPage } from "@/lib/auth";

/** Contas (com saldo) já vêm do layout via cadastros. */
export default async function ContasPage() {
  await requireUserPage();
  return (
    <>
      <Cabecalho titulo="Contas" voltar={{ href: "/mais", rotulo: "Mais" }} />
      <Contas />
    </>
  );
}
