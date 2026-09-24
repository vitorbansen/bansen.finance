import { mesAtualSP } from "@/lib/finance/dates";
import { lerQuery, rota } from "@/lib/server/api";
import { montarResumo } from "@/lib/server/resumo";
import { mesQuerySchema } from "@/lib/validators";

export const GET = rota(async ({ req, userId }) =>
  montarResumo(userId, lerQuery(req, mesQuerySchema).mes ?? mesAtualSP()),
);
