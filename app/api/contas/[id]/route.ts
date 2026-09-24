import { lerCorpo, rota } from "@/lib/server/api";
import { atualizarConta, excluirConta } from "@/lib/server/contas";
import { contaAtualizarSchema } from "@/lib/validators";

type P = { id: string };

export const PATCH = rota<P>(async ({ req, userId, params }) =>
  atualizarConta(userId, params.id, await lerCorpo(req, contaAtualizarSchema)),
);

export const DELETE = rota<P>(async ({ userId, params }) => excluirConta(userId, params.id));
