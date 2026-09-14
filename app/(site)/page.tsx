import { Hero } from "@/components/Hero";
import { Diferenciais } from "@/components/Diferenciais";
import { Catalogo } from "@/components/Catalogo";
import { CtaFinal } from "@/components/CtaFinal";
import { getProdutos } from "@/lib/produtos-db";

// Página cacheada; o admin chama revalidatePath("/") a cada alteração de produto.
export const revalidate = 300;

export default async function HomePage() {
  const produtos = await getProdutos();

  return (
    <>
      <Hero />
      <Diferenciais />
      <Catalogo produtos={produtos} />
      <CtaFinal />
    </>
  );
}
