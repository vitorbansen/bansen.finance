import { PrismaClient } from "@prisma/client";
import { produtosSeed } from "../lib/products";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.produto.count();
  if (total > 0) {
    console.log(`Tabela já tem ${total} produto(s); seed ignorado.`);
    return;
  }

  await prisma.produto.createMany({
    data: produtosSeed.map((p, i) => ({
      modelo: p.modelo,
      armazenamento: p.armazenamento,
      cor: p.cor,
      estado: p.estado === "novo" ? "NOVO" : "SEMINOVO",
      garantia: p.garantia,
      preco: p.preco,
      precoPix: p.precoPix ?? null,
      bateria: p.bateria ?? null,
      destaque: p.destaque ?? false,
      disponivel: p.disponivel ?? true,
      ordem: i,
    })),
  });
  console.log(`✓ ${produtosSeed.length} produtos de exemplo inseridos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
