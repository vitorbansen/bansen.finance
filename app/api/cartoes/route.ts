import { NextResponse } from "next/server";
import { lerCorpo, rota } from "@/lib/server/api";
import { criarCartao, listarCartoes } from "@/lib/server/cartoes";
import { cartaoSchema } from "@/lib/validators";

export const GET = rota(async ({ req, userId }) => listarCartoes(userId, req.nextUrl.searchParams.get("arquivados") === "1"));

export const POST = rota(async ({ req, userId }) =>
  NextResponse.json(await criarCartao(userId, await lerCorpo(req, cartaoSchema)), { status: 201 }),
);
