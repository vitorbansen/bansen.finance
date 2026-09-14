"use client";

import { useMemo, useState } from "react";
import { CardProduto } from "@/components/CardProduto";
import { FiltroEstado, type FiltroEstadoValor } from "@/components/FiltroEstado";
import { Reveal } from "@/components/Reveal";
import type { Produto } from "@/lib/products";

export function Catalogo({ produtos }: { produtos: Produto[] }) {
  const [filtro, setFiltro] = useState<FiltroEstadoValor>("todos");

  const lista = useMemo(
    () => (filtro === "todos" ? produtos : produtos.filter((p) => p.estado === filtro)),
    [produtos, filtro]
  );

  return (
    <section id="catalogo" className="wrap scroll-mt-12 py-24 md:py-40">
      <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="display text-5xl md:text-7xl">Catálogo.</h2>
          <p className="muted mt-4 text-lg md:text-xl">Toque no aparelho e fale direto conosco.</p>
        </div>
        <FiltroEstado valor={filtro} onChange={setFiltro} />
      </Reveal>

      {lista.length === 0 ? (
        <p className="muted mt-24 text-center">Nenhum aparelho nessa categoria no momento.</p>
      ) : (
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-20 md:mt-24 md:grid-cols-2">
          {lista.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.1}>
              <CardProduto produto={p} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
