import { z } from "zod";
import { siteConfig } from "@/lib/config";

const numeroOpcional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().nonnegative().nullable()
);

export function garantiaPorEstado(estado: "NOVO" | "SEMINOVO") {
  return estado === "NOVO" ? siteConfig.garantias.novo : siteConfig.garantias.seminovo;
}

export const produtoSchema = z
  .object({
    modelo: z.string().trim().min(2, "Informe o modelo").max(80),
    armazenamento: z.string().trim().min(2, "Informe o armazenamento").max(20),
    cor: z.string().trim().min(2, "Informe a cor").max(40),
    estado: z.enum(["NOVO", "SEMINOVO"], { message: "Estado inválido" }),
    preco: z.coerce.number({ message: "Preço inválido" }).positive("Preço deve ser maior que zero"),
    precoPix: numeroOpcional,
    bateria: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z.coerce.number().int().min(0).max(100).nullable()
    ),
    imagem: z.preprocess((v) => (v === "" ? null : v), z.string().url("Imagem inválida").nullable()),
    destaque: z.coerce.boolean().default(false),
    disponivel: z.coerce.boolean().default(true),
    ordem: z.coerce.number().int().default(0),
  })
  .transform((d) => ({ ...d, garantia: garantiaPorEstado(d.estado) }));

export type ProdutoInput = z.infer<typeof produtoSchema>;

export const usuarioSchema = z
  .string()
  .trim()
  .min(3, "Usuário deve ter ao menos 3 caracteres")
  .max(40)
  .regex(/^[a-z0-9._-]+$/i, "Usuário só pode ter letras, números, ponto, hífen e underline");

export const senhaSchema = z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72);

export const loginSchema = z.object({
  usuario: z.string().trim().min(1),
  senha: z.string().min(1),
});
