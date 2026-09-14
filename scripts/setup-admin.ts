/**
 * Cria ou atualiza o usuário do painel /admin.
 *   npm run setup:admin                          → modo interativo
 *   npm run setup:admin -- usuario senha "Nome"  → sem perguntas
 */
import { createInterface } from "readline";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { senhaSchema, usuarioSchema } from "../lib/validators";

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
  const [argUsuario, argSenha, argNome] = process.argv.slice(2);

  console.log("\n=== Usuário do painel ===\n");

  const usuarioRaw = argUsuario ?? (await ask("Usuário: "));
  const u = usuarioSchema.safeParse(usuarioRaw);
  if (!u.success) falhar("Usuário inválido:", u.error.errors);
  const usuario = u.data!.toLowerCase();

  const senha = argSenha ?? (await ask("Senha (mín. 8 caracteres): "));
  const s = senhaSchema.safeParse(senha);
  if (!s.success) falhar("Senha inválida:", s.error.errors);

  const nome = argNome ?? (await ask("Nome de exibição: "));
  const hash = await bcrypt.hash(senha, 12);

  const existente = await prisma.admin.findUnique({ where: { usuario } });
  if (existente) {
    await prisma.admin.update({ where: { usuario }, data: { senha: hash, nome } });
    console.log(`\n✓ Senha do usuário "${usuario}" atualizada.`);
  } else {
    await prisma.admin.create({ data: { usuario, nome, senha: hash } });
    console.log(`\n✓ Usuário "${usuario}" criado.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
