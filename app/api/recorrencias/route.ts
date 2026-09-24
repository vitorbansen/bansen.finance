import { NextResponse } from "next/server";
import { lerCorpo, rota } from "@/lib/server/api";
import { criarRecorrencia, listarRecorrencias } from "@/lib/server/recorrencias";
import { recorrenciaCriarSchema } from "@/lib/validators";

export const GET = rota(async ({ userId }) => listarRecorrencias(userId));

export const POST = rota(async ({ req, userId }) =>
  NextResponse.json(await criarRecorrencia(userId, await lerCorpo(req, recorrenciaCriarSchema)), { status: 201 }),
);
