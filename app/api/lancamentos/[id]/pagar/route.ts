import { z } from "zod";
import { lerCorpo, rota } from "@/lib/server/api";
import { marcarStatus } from "@/lib/server/lancamentos";
import { statusSchema } from "@/lib/validators";

type P = { id: string };

/** Marca como pago/pendente. Sem status no corpo, alterna. */
export const POST = rota<P>(async ({ req, userId, params }) => {
  const { status } = await lerCorpo(req, z.object({ status: statusSchema.optional() }));
  return marcarStatus(userId, params.id, status);
});
