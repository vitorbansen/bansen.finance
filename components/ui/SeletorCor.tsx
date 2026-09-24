"use client";

import { Check } from "lucide-react";
import { CORES } from "./Icone";

export function SeletorCor({ valor, aoMudar }: { valor: string; aoMudar: (cor: string) => void }) {
  return (
    <div>
      <p className="grupo-titulo pt-0">Cor</p>
      <div className="grupo flex flex-wrap justify-between gap-y-2 p-3" role="radiogroup" aria-label="Cor">
        {CORES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={valor.toLowerCase() === c.toLowerCase()}
            aria-label={c}
            onClick={() => aoMudar(c)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ backgroundColor: c }}>
              {valor.toLowerCase() === c.toLowerCase() && <Check size={18} strokeWidth={3} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
