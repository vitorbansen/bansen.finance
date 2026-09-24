import { NextResponse } from "next/server";
import { lerCorpo, lerQuery, rota } from "@/lib/server/api";
import { criarLancamento, listarLancamentos } from "@/lib/server/lancamentos";
import { lancamentoCriarSchema, lancamentosQuerySchema } from "@/lib/validators";

export const GET = rota(async ({ req, userId }) => listarLancamentos(userId, lerQuery(req, lancamentosQuerySchema)));

/** Compra parcelada gera N lançamentos — por isso retorna uma lista. */
export const POST = rota(async ({ req, userId }) =>
  NextResponse.json(await criarLancamento(userId, await lerCorpo(req, lancamentoCriarSchema)), { status: 201 }),
);
