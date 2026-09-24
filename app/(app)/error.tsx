"use client";

import { useEffect } from "react";
import { WifiOff } from "lucide-react";
import { Vazio } from "@/components/ui/Estados";

export default function ErroTela({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="pt-safe">
      <Vazio
        className="pt-24"
        icone={<WifiOff size={44} />}
        titulo="Não foi possível carregar"
        texto="Verifique sua conexão e tente de novo."
        acao={
          <button type="button" className="btn-primario" onClick={reset}>
            Tentar de novo
          </button>
        }
      />
    </div>
  );
}
