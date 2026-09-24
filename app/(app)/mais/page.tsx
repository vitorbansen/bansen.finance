import { Landmark, Repeat, Tags, UserRound } from "lucide-react";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Grupo, Linha } from "@/components/ui/Lista";
import { ExportarCsv, Sair } from "@/components/mais/AcoesConta";
import { requireUserPage } from "@/lib/auth";
import { formatBRL } from "@/lib/finance/money";
import { listarRecorrencias } from "@/lib/server/recorrencias";

const quadrado = (cor: string, icone: React.ReactNode) => (
  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-white" style={{ backgroundColor: cor }}>
    {icone}
  </span>
);

export default async function Mais() {
  const user = await requireUserPage();
  const { totais } = await listarRecorrencias(user.id);

  return (
    <>
      <Cabecalho titulo="Mais" />
      <div className="space-y-2 px-4">
        <Grupo titulo="Planejamento">
          <Linha
            href="/mais/recorrencias"
            icone={quadrado("#AF52DE", <Repeat size={17} />)}
            titulo="Recorrências"
            subtitulo="Assinaturas, contas fixas, salário"
            direita={<span className="valor">{formatBRL(totais.saidas)}/mês</span>}
          />
        </Grupo>
        <Grupo titulo="Cadastros">
          <Linha href="/mais/contas" icone={quadrado("#0A84FF", <Landmark size={17} />)} titulo="Contas" />
          <Linha href="/mais/categorias" icone={quadrado("#FF9500", <Tags size={17} />)} titulo="Categorias" />
        </Grupo>
        <Grupo titulo="Dados">
          <ExportarCsv />
        </Grupo>
        <Grupo titulo="Conta">
          <Linha icone={quadrado("#8E8E93", <UserRound size={17} />)} titulo={user.nome} subtitulo={user.email} />
          <Sair />
        </Grupo>
        <p className="px-4 pt-4 text-center text-[13px] text-label-2/60">
          Dica: no Safari, toque em Compartilhar › Adicionar à Tela de Início para usar como app.
        </p>
      </div>
    </>
  );
}
