import { lerQuery, rota } from "@/lib/server/api";
import { exportarCsv } from "@/lib/server/csv";
import { csvQuerySchema } from "@/lib/validators";

export const GET = rota(async ({ req, userId }) => {
  const { de, ate } = lerQuery(req, csvQuerySchema);
  return new Response(await exportarCsv(userId, de, ate), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lancamentos_${de}_${ate}.csv"`,
    },
  });
});
