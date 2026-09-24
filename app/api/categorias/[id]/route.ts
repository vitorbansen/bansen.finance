import { lerCorpo, rota } from "@/lib/server/api";
import { atualizarCategoria, excluirCategoria } from "@/lib/server/categorias";
import { categoriaAtualizarSchema } from "@/lib/validators";

type P = { id: string };

export const PATCH = rota<P>(async ({ req, userId, params }) =>
  atualizarCategoria(userId, params.id, await lerCorpo(req, categoriaAtualizarSchema)),
);

export const DELETE = rota<P>(async ({ userId, params }) => excluirCategoria(userId, params.id));
