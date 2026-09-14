import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, imagemOtimizada } from "@/lib/utils";
import { DeleteProdutoButton } from "./DeleteProdutoButton";

export const dynamic = "force-dynamic";

export default async function AdminProdutosPage() {
  const produtos = await prisma.produto.findMany({
    orderBy: [{ destaque: "desc" }, { ordem: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl md:text-4xl">Produtos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {produtos.length} {produtos.length === 1 ? "aparelho" : "aparelhos"}
          </p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-primary">
          <Plus className="h-4 w-4" /> Novo
        </Link>
      </div>

      {produtos.length === 0 ? (
        <p className="mt-16 text-center text-sm text-neutral-500">
          Nenhum aparelho cadastrado. Clique em &ldquo;Novo&rdquo; para começar.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {produtos.map((p) => (
            <li key={p.id} className="flex items-center gap-4 py-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface">
                {p.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagemOtimizada(p.imagem, 200)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-neutral-600">sem foto</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-semibold text-ash">{p.modelo}</p>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    {p.estado === "NOVO" ? "Novo" : "Seminovo"}
                  </span>
                  {p.destaque && (
                    <span className="text-[10px] uppercase tracking-[0.15em] text-gold">Destaque</span>
                  )}
                  {!p.disponivel && (
                    <span className="text-[10px] uppercase tracking-[0.15em] text-red-400">Vendido</span>
                  )}
                </div>
                <p className="truncate text-sm text-neutral-400">
                  {p.armazenamento} · {p.cor} · {p.garantia}
                  {p.bateria != null ? ` · Bateria ${p.bateria}%` : ""}
                </p>
                <p className="mt-0.5 text-sm text-ash">
                  {formatCurrency(Number(p.precoPix ?? p.preco))}
                  {p.precoPix != null && (
                    <span className="text-neutral-500"> · {formatCurrency(Number(p.preco))} cartão</span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-sm">
                <Link href={`/admin/produtos/${p.id}`} className="text-neutral-300 transition hover:text-ash">
                  Editar
                </Link>
                <DeleteProdutoButton id={p.id} modelo={p.modelo} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
