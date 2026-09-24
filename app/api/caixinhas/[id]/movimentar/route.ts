import { lerCorpo, rota } from "@/lib/server/api";
import { movimentarCaixinha } from "@/lib/server/caixinhas";
import { movimentarCaixinhaSchema } from "@/lib/validators";

type P = { id: string };

/** Depositar (sai da conta) ou resgatar (volta para a conta). */
export const POST = rota<P>(async ({ req, userId, params }) =>
  movimentarCaixinha(userId, params.id, await lerCorpo(req, movimentarCaixinhaSchema)),
);
