/**
 * Tipo do produto usado pelo site + dados iniciais (seed).
 *
 * Os produtos reais ficam no banco e são gerenciados em /admin.
 * A lista abaixo só é usada por `npm run db:seed` quando a tabela está vazia.
 */

export type EstadoProduto = "novo" | "seminovo";

export type Produto = {
  id: string;
  modelo: string;
  armazenamento: string;
  cor: string;
  estado: EstadoProduto;
  garantia: string;
  preco: number;
  precoPix?: number;
  bateria?: number;
  imagem?: string;
  destaque?: boolean;
  disponivel?: boolean;
};

export const produtosSeed: Omit<Produto, "id">[] = [
  {
    modelo: "iPhone 16 Pro Max",
    armazenamento: "256GB",
    cor: "Titânio Deserto",
    estado: "novo",
    garantia: "1 ano Apple",
    preco: 9299,
    precoPix: 8999,
    destaque: true,
  },
  {
    modelo: "iPhone 16 Pro",
    armazenamento: "128GB",
    cor: "Titânio Preto",
    estado: "novo",
    garantia: "1 ano Apple",
    preco: 7699,
    precoPix: 7399,
  },
  {
    modelo: "iPhone 16",
    armazenamento: "128GB",
    cor: "Preto",
    estado: "novo",
    garantia: "1 ano Apple",
    preco: 5899,
    precoPix: 5699,
  },
  {
    modelo: "iPhone 15 Pro Max",
    armazenamento: "256GB",
    cor: "Titânio Azul",
    estado: "seminovo",
    garantia: "3 meses loja",
    preco: 6499,
    precoPix: 6299,
    bateria: 94,
    destaque: true,
  },
  {
    modelo: "iPhone 14",
    armazenamento: "128GB",
    cor: "Estelar",
    estado: "seminovo",
    garantia: "3 meses loja",
    preco: 3599,
    precoPix: 3449,
    bateria: 89,
  },
  {
    modelo: "iPhone 13",
    armazenamento: "128GB",
    cor: "Meia-noite",
    estado: "seminovo",
    garantia: "3 meses loja",
    preco: 2899,
    precoPix: 2799,
    bateria: 91,
  },
];
