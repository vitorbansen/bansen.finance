import { NextResponse } from "next/server";
import { lerCorpo, rota } from "@/lib/server/api";
import { criarTransferencia } from "@/lib/server/lancamentos";
import { transferenciaSchema } from "@/lib/validators";

export const POST = rota(async ({ req, userId }) =>
  NextResponse.json(await criarTransferencia(userId, await lerCorpo(req, transferenciaSchema)), { status: 201 }),
);
