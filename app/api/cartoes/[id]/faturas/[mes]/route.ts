import { rota } from "@/lib/server/api";
import { detalheFatura } from "@/lib/server/cartoes";
import { mesSchema } from "@/lib/validators";

type P = { id: string; mes: string };

/** Fatura do mês de vencimento (AAAA-MM) com itens. */
export const GET = rota<P>(async ({ userId, params }) => detalheFatura(userId, params.id, mesSchema.parse(params.mes)));
