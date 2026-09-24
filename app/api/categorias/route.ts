import { NextResponse } from "next/server";
import { lerCorpo, rota } from "@/lib/server/api";
import { criarCategoria, listarCategorias } from "@/lib/server/categorias";
import { categoriaSchema } from "@/lib/validators";

export const GET = rota(async ({ req, userId }) => listarCategorias(userId, req.nextUrl.searchParams.get("arquivadas") === "1"));

export const POST = rota(async ({ req, userId }) =>
  NextResponse.json(await criarCategoria(userId, await lerCorpo(req, categoriaSchema)), { status: 201 }),
);
