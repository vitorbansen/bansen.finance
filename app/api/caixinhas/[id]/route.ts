import { lerCorpo, rota } from "@/lib/server/api";
import { atualizarCaixinha, excluirCaixinha, extratoCaixinha } from "@/lib/server/caixinhas";
import { caixinhaAtualizarSchema } from "@/lib/validators";

type P = { id: string };

export const GET = rota<P>(async ({ userId, params }) => extratoCaixinha(userId, params.id));

export const PATCH = rota<P>(async ({ req, userId, params }) =>
  atualizarCaixinha(userId, params.id, await lerCorpo(req, caixinhaAtualizarSchema)),
);

export const DELETE = rota<P>(async ({ userId, params }) => excluirCaixinha(userId, params.id));
