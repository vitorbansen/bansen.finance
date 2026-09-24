import { lerCorpo, rota } from "@/lib/server/api";
import { atualizarCartao, excluirCartao } from "@/lib/server/cartoes";
import { cartaoAtualizarSchema } from "@/lib/validators";

type P = { id: string };

export const PATCH = rota<P>(async ({ req, userId, params }) =>
  atualizarCartao(userId, params.id, await lerCorpo(req, cartaoAtualizarSchema)),
);

export const DELETE = rota<P>(async ({ userId, params }) => excluirCartao(userId, params.id));
