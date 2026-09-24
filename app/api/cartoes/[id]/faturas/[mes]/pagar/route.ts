import { lerCorpo, rota } from "@/lib/server/api";
import { pagarFaturaDoMes } from "@/lib/server/cartoes";
import { mesSchema, pagarFaturaSchema } from "@/lib/validators";

type P = { id: string; mes: string };

/** Pagar = saída na conta vinculada (ou em contaId) + fatura marcada como paga. */
export const POST = rota<P>(async ({ req, userId, params }) =>
  pagarFaturaDoMes(userId, params.id, mesSchema.parse(params.mes), await lerCorpo(req, pagarFaturaSchema)),
);
