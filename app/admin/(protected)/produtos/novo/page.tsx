import { FormProduto } from "@/components/admin/FormProduto";

export default function NovoProdutoPage() {
  return (
    <div>
      <h1 className="display text-3xl md:text-4xl">Novo aparelho</h1>
      <div className="mt-10">
        <FormProduto />
      </div>
    </div>
  );
}
