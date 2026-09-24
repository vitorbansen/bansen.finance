import { lerCorpo, lerQuery, rota } from "@/lib/server/api";
import { atualizarLancamento, excluirLancamento } from "@/lib/server/lancamentos";
import { lancamentoAtualizarSchema, lancamentoExcluirSchema } from "@/lib/validators";

type P = { id: string };

/** Corpo aceita escopo: "esta" | "proximas" (ocorrências de recorrência). */
export const PATCH = rota<P>(async ({ req, userId, params }) =>
  atualizarLancamento(userId, params.id, await lerCorpo(req, lancamentoAtualizarSchema)),
);

/** ?escopo=esta | proximas (recorrência) | todas (compra parcelada inteira). */
export const DELETE = rota<P>(async ({ req, userId, params }) =>
  excluirLancamento(userId, params.id, lerQuery(req, lancamentoExcluirSchema).escopo),
);
