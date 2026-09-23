# Controle Financeiro

App pessoal de finanças, **mobile-first para iPhone** (Safari / Tela de Início como PWA).
Mostra o que entrou e saiu, recorrências (salário, aluguel, assinaturas), faturas do cartão com
parcelamento, dinheiro guardado em caixinhas e — principalmente — **quanto sobra este mês e quanto
vai sobrar no próximo**.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + Prisma/Postgres (Neon) + zod + jose/bcrypt.

## Rodar

```bash
npm install
npm run prisma:migrate   # cria/atualiza as tabelas
npm run db:seed          # opcional: usuário demo@exemplo.com / demo12345 com dados de exemplo
npm run dev              # http://localhost:3000
```

Crie sua conta em `/cadastro` ou pelo terminal: `npm run setup:usuario -- email senha "Nome"`
(rodar de novo com o mesmo e-mail troca a senha).

No iPhone: abra no Safari → Compartilhar → **Adicionar à Tela de Início**.

## Scripts

| Script              | O quê                                   |
| ------------------- | --------------------------------------- |
| `npm run lint`      | ESLint (next/core-web-vitals)           |
| `npm run typecheck` | `tsc --noEmit`                          |
| `npm test`          | testes do domínio (`node:test` via tsx) |
| `npm run build`     | `prisma generate` + `next build`        |

## Variáveis de ambiente (`.env`)

| Variável       | O quê                                                     |
| -------------- | --------------------------------------------------------- |
| `DATABASE_URL` | Neon (host `-pooler`) com `&schema=nkiphones`             |
| `DIRECT_URL`   | Neon sem `-pooler` (usado só pelas migrações)             |
| `JWT_SECRET`   | segredo da sessão (32+ caracteres aleatórios)             |
| `SEED_SENHA`   | opcional, senha do usuário demo do seed                   |

## Regras importantes

- Dinheiro é sempre **inteiro em centavos** (banco e cálculos).
- Datas de competência são `date` (sem hora) e "hoje" é calculado em `America/Sao_Paulo`.
- Compra no cartão no **dia do fechamento ou depois** cai na fatura seguinte.
- Recorrências viram lançamentos **pendentes** ao abrir o mês (idempotente: nunca duplica).
- Todos os cálculos ficam em `lib/finance/` (domínio puro, testado).

## Estrutura

```
app/
  (auth)/            # login, cadastro
  (app)/             # Início, Lançamentos, Cartões, Guardado, Mais (tab bar)
  api/               # rotas REST (validação zod, sempre filtradas pelo usuário)
  manifest.ts        # PWA
components/          # ui/ (bottom sheet, input de valor, seletor de mês…) e telas
lib/
  finance/           # domínio puro: dinheiro, datas, fatura, parcelas, recorrência, resumo + testes
  server/            # services com Prisma
  auth.ts, jwt.ts    # sessão
prisma/              # schema, migrations, seed
```

## Deploy (Vercel)

1. Variáveis do `.env` em *Environment Variables*.
2. Build padrão (`npm run build`) já roda `prisma generate`.
3. `npx prisma migrate deploy` apontando para o banco de produção.
