import { NextResponse } from "next/server";
import { lerCorpo, lerQuery, rota } from "@/lib/server/api";
import { criarCaixinha, listarCaixinhas } from "@/lib/server/caixinhas";
import { caixinhaSchema, mesQuerySchema } from "@/lib/validators";

export const GET = rota(async ({ req, userId }) => listarCaixinhas(userId, lerQuery(req, mesQuerySchema).mes));

export const POST = rota(async ({ req, userId }) =>
  NextResponse.json(await criarCaixinha(userId, await lerCorpo(req, caixinhaSchema)), { status: 201 }),
);
