import { NextResponse } from "next/server";
import { lerCorpo, rota } from "@/lib/server/api";
import { criarConta, listarContas } from "@/lib/server/contas";
import { contaSchema } from "@/lib/validators";

export const GET = rota(async ({ req, userId }) => listarContas(userId, req.nextUrl.searchParams.get("arquivadas") === "1"));

export const POST = rota(async ({ req, userId }) =>
  NextResponse.json(await criarConta(userId, await lerCorpo(req, contaSchema)), { status: 201 }),
);
