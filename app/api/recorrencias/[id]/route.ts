import { lerCorpo, rota } from "@/lib/server/api";
import { atualizarRecorrencia, excluirRecorrencia } from "@/lib/server/recorrencias";
import { recorrenciaAtualizarSchema } from "@/lib/validators";

type P = { id: string };

export const PATCH = rota<P>(async ({ req, userId, params }) =>
  atualizarRecorrencia(userId, params.id, await lerCorpo(req, recorrenciaAtualizarSchema)),
);

export const DELETE = rota<P>(async ({ userId, params }) => excluirRecorrencia(userId, params.id));
