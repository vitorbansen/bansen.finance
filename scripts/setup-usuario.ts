/**
 * Cria um usuário ou redefine a senha de um existente.
 *   npm run setup:usuario                          → modo interativo
 *   npm run setup:usuario -- email senha "Nome"    → sem perguntas
 */
import { createInterface } from "readline";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { emailSchema, senhaSchema } from "../lib/validators";
import { criarDadosIniciais } from "../lib/server/dados-iniciais";

const prisma = new PrismaClient();

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function falhar(msg: string, issues?: { message: string }[]) {
  console.error(`\n${msg}`);
  issues?.forEach((e) => console.error(" -", e.message));
  process.exit(1);
}

async function main() {
  const [argEmail, argSenha, argNome] = process.argv.slice(2);

  console.log("\n=== Usuário ===\n");

  const e = emailSchema.safeParse(argEmail ?? (await ask("E-mail: ")));
  if (!e.success) falhar("E-mail inválido:", e.error.errors);
  const email = e.data!;

  const senha = argSenha ?? (await ask("Senha (mín. 8 caracteres): "));
  const s = senhaSchema.safeParse(senha);
  if (!s.success) falhar("Senha inválida:", s.error.errors);
  const hash = await bcrypt.hash(senha, 12);

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    await prisma.usuario.update({ where: { email }, data: { senha: hash } });
    console.log(`\n✓ Senha de "${email}" atualizada.`);
    return;
  }

  const nome = argNome ?? (await ask("Nome: "));
  await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({ data: { email, nome, senha: hash } });
    await criarDadosIniciais(tx, usuario.id);
  });
  console.log(`\n✓ Usuário "${email}" criado.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
