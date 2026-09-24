import { AppProvider } from "@/components/app/AppProvider";
import { TabBar } from "@/components/app/TabBar";
import { requireUserPage } from "@/lib/auth";
import { carregarCadastros } from "@/lib/server/cadastros";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  const cadastros = await carregarCadastros(user.id);

  return (
    <AppProvider cadastros={cadastros}>
      {/* Espaço para a tab bar + FAB não cobrirem o fim da lista. */}
      <main className="coluna min-h-dvh pb-[calc(env(safe-area-inset-bottom)+140px)]">{children}</main>
      <TabBar />
    </AppProvider>
  );
}
