/** Dinheiro é sempre inteiro em centavos. Nada de float. */
export type Centavos = number;

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 123456 → "R$ 1.234,56" (espaço comum no lugar do NBSP do Intl). */
export function formatBRL(centavos: Centavos): string {
  return fmt.format(centavos / 100).replace(/ /g, " ");
}

/** "+R$ 10,00" / "−R$ 10,00" */
export function formatBRLSinal(centavos: Centavos): string {
  if (centavos === 0) return formatBRL(0);
  return `${centavos > 0 ? "+" : "−"}${formatBRL(Math.abs(centavos))}`;
}

/**
 * Converte texto digitado em centavos: "1.234,56" → 123456, "R$ 10" → 1000, "0,5" → 50.
 * Retorna null se não houver número válido.
 */
export function parseBRL(texto: string): Centavos | null {
  const limpo = texto.replace(/[^\d,.-]/g, "");
  if (!/\d/.test(limpo)) return null;
  const negativo = limpo.startsWith("-");
  const semSinal = limpo.replace(/-/g, "");
  const virgula = semSinal.lastIndexOf(",");
  const inteiro = (virgula >= 0 ? semSinal.slice(0, virgula) : semSinal).replace(/\./g, "");
  const decimal = virgula >= 0 ? semSinal.slice(virgula + 1).replace(/\D/g, "") : "";
  if (decimal.length > 2 || /\D/.test(inteiro)) return null;
  const valor = Number(inteiro || "0") * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(valor)) return null;
  return negativo ? -valor : valor;
}

/**
 * Máscara de digitação estilo app de banco: só dígitos, os dois últimos são centavos.
 * "123456" → 123456 (R$ 1.234,56).
 */
export function centavosDeDigitos(digitos: string): Centavos {
  const d = digitos.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
  return d ? Number(d) : 0;
}

/** Divide em n parcelas inteiras cuja soma é exatamente o total; o resto vai para a 1ª. */
export function dividirParcelas(total: Centavos, n: number): Centavos[] {
  if (!Number.isInteger(total) || total <= 0) throw new Error("Total deve ser inteiro positivo");
  if (!Number.isInteger(n) || n < 1) throw new Error("Número de parcelas inválido");
  const base = Math.floor(total / n);
  const resto = total - base * n;
  return Array.from({ length: n }, (_, i) => (i === 0 ? base + resto : base));
}

export function soma(valores: Centavos[]): Centavos {
  return valores.reduce((a, b) => a + b, 0);
}
