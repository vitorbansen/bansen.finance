import { Cabecalho } from "@/components/ui/Cabecalho";
import { Categorias } from "@/components/mais/Categorias";
import { requireUserPage } from "@/lib/auth";

/** As categorias já vêm do layout (cadastros); a página só monta a tela. */
export default async function CategoriasPage() {
  await requireUserPage();
  return (
    <>
      <Cabecalho titulo="Categorias" voltar={{ href: "/mais", rotulo: "Mais" }} />
      <Categorias />
    </>
  );
}
