import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormProduto } from "@/components/admin/FormProduto";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({ params }: { params: { id: string } }) {
  const p = await prisma.produto.findUnique({ where: { id: params.id } });
  if (!p) notFound();

  return (
    <div>
      <h1 className="display text-3xl md:text-4xl">Editar aparelho</h1>
      <div className="mt-10">
        <FormProduto
          id={p.id}
          inicial={{
            modelo: p.modelo,
            armazenamento: p.armazenamento,
            cor: p.cor,
            estado: p.estado,
            preco: String(Number(p.preco)),
            precoPix: p.precoPix != null ? String(Number(p.precoPix)) : "",
            bateria: p.bateria != null ? String(p.bateria) : "",
            imagem: p.imagem ?? "",
            destaque: p.destaque,
            disponivel: p.disponivel,
            ordem: String(p.ordem),
          }}
        />
      </div>
    </div>
  );
}
