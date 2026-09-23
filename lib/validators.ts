import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido").max(120);

export const senhaSchema = z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  senha: z.string().min(1),
});

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(60),
  email: emailSchema,
  senha: senhaSchema,
});
