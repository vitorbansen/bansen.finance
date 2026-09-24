/** fetch para as rotas /api: JSON in/out e erro com a mensagem da API. */
export async function api<T = unknown>(metodo: "GET" | "POST" | "PATCH" | "DELETE", url: string, corpo?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new Error("Sem conexão. Verifique a internet e tente de novo.");
  }
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(dados?.error ?? "Algo deu errado. Tente de novo.");
  return dados as T;
}
