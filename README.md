# NK iPhones

Catálogo de iPhones (Next.js 14 App Router + TypeScript + Tailwind + Framer Motion) com painel
admin para cadastrar aparelhos. Produtos ficam no Postgres (Neon) via Prisma; fotos no Cloudinary.
Cada card leva o cliente ao WhatsApp com mensagem pré-preenchida.

## Rodar

```bash
npm install
npm run prisma:migrate   # cria/atualiza as tabelas (só na 1ª vez ou quando o schema mudar)
npm run setup:admin      # cria o usuário do painel
npm run dev              # http://localhost:3000
```

Painel: `http://localhost:3000/admin` (não há link no site — acesse pela URL).

## Variáveis de ambiente (`.env`)

| Variável                  | O quê                                                             |
| ------------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`            | Neon (host `-pooler`) com `&schema=nkiphones`                     |
| `DIRECT_URL`              | Neon sem `-pooler` (usado só pelas migrações)                     |
| `JWT_SECRET`              | segredo do login (32+ caracteres aleatórios)                      |
| `CLOUDINARY_*`            | credenciais do Cloudinary (fotos vão para a pasta `nk-iphones`)   |

O banco é o mesmo do projeto de imobiliárias, mas as tabelas ficam isoladas no schema `nkiphones`.

## Onde editar

| O quê                                        | Onde                                   |
| -------------------------------------------- | -------------------------------------- |
| Produtos (modelo, cor, preço, foto…)         | `/admin` no navegador                  |
| WhatsApp, cidade, redes, textos do hero      | `lib/config.ts`                        |
| Mensagem do WhatsApp por produto             | `lib/utils.ts` → `mensagemProduto()`   |
| Cores (preto/dourado)                        | `tailwind.config.ts`                   |
| Dados iniciais de exemplo (`npm run db:seed`)| `lib/products.ts`                      |

## Deploy (Vercel)

1. Importe o repositório na Vercel e cole as variáveis do `.env` em *Environment Variables*.
2. Build command padrão (`npm run build`) já roda `prisma generate`.
3. Rode `npx prisma migrate deploy` uma vez apontando para o banco de produção.
4. Crie o usuário do painel: `npm run setup:admin -- usuario senha "Nome"` (ou interativo). Rodar de novo com o mesmo usuário troca a senha.

## Estrutura

```
app/
  (site)/            # site público: Hero, Diferenciais, Catálogo, CTA
  admin/login        # login
  admin/(protected)/ # lista, novo, editar (exige sessão)
  api/               # auth, produtos (CRUD), upload (Cloudinary)
components/          # UI do site + components/admin/FormProduto
lib/                 # config, prisma, auth/jwt, cloudinary, validators, produtos-db
prisma/              # schema, migrations, seed
scripts/setup-admin.ts
middleware.ts        # protege /admin e as APIs de escrita
```
