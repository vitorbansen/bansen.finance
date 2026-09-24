import { Cabecalho } from "@/components/ui/Cabecalho";
import { ListaCartoes } from "@/components/cartoes/ListaCartoes";
import { requireUserPage } from "@/lib/auth";
import { listarCartoes } from "@/lib/server/cartoes";

export default async function Cartoes() {
  const user = await requireUserPage();
  const itens = await listarCartoes(user.id);
  return (
    <>
      <Cabecalho titulo="Cartões" />
      <ListaCartoes itens={itens} />
    </>
  );
}
