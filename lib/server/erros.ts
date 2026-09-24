/** Erro com status HTTP — a rota devolve `{ error: message }` com esse status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const naoEncontrado = (oque = "Registro") => new HttpError(404, `${oque} não encontrado`);
export const conflito = (mensagem: string) => new HttpError(409, mensagem);
export const invalido = (mensagem: string) => new HttpError(400, mensagem);
