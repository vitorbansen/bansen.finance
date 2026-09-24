"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CampoLinha } from "@/components/ui/Campos";
import { Linha } from "@/components/ui/Lista";
import { useApp } from "@/components/app/AppProvider";
import { hojeSP, mesAtualSP, primeiroDia } from "@/lib/finance/dates";

const quadrado = (cor: string, icone: React.ReactNode) => (
  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-white" style={{ backgroundColor: cor }}>
    {icone}
  </span>
);

/** Linha "Exportar CSV" que abre um sheet com o período. */
export function ExportarCsv() {
  const [aberto, setAberto] = useState(false);
  const [de, setDe] = useState(primeiroDia(mesAtualSP()));
  const [ate, setAte] = useState(hojeSP());
  const valido = de && ate && de <= ate;

  return (
    <>
      <Linha icone={quadrado("#34C759", <Download size={17} />)} titulo="Exportar CSV" seta onClick={() => setAberto(true)} />
      <BottomSheet aberto={aberto} aoFechar={() => setAberto(false)} titulo="Exportar CSV">
        <div className="space-y-4 pt-2">
          <div className="grupo">
            <CampoLinha rotulo="De" htmlFor="csv-de">
              <input id="csv-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none" />
            </CampoLinha>
            <CampoLinha rotulo="Até" htmlFor="csv-ate">
              <input id="csv-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="min-h-[44px] bg-transparent text-right text-[17px] text-label-2/60 outline-none" />
            </CampoLinha>
          </div>
          <p className="px-4 text-[13px] text-label-2/60">Planilha separada por ponto e vírgula, abre direto no Excel e no Numbers.</p>
          <a
            href={valido ? `/api/export/csv?de=${de}&ate=${ate}` : undefined}
            aria-disabled={!valido}
            className={`btn-primario w-full ${valido ? "" : "pointer-events-none opacity-40"}`}
            onClick={() => setTimeout(() => setAberto(false), 300)}
          >
            <Download size={18} /> Baixar
          </a>
        </div>
      </BottomSheet>
    </>
  );
}

export function Sair() {
  const router = useRouter();
  const { perguntar } = useApp();
  return (
    <Linha
      icone={quadrado("#FF3B30", <LogOut size={17} />)}
      titulo={<span className="text-vermelho">Sair</span>}
      onClick={() =>
        perguntar({
          titulo: "Sair da sua conta?",
          opcoes: [
            {
              rotulo: "Sair",
              destrutiva: true,
              aoTocar: async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
                router.refresh();
              },
            },
          ],
        })
      }
    />
  );
}
