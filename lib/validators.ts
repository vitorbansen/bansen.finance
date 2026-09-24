import { z } from "zod";
import { isDataISO, isMesISO } from "@/lib/finance/dates";

// ---------------------------------------------------------------- auth

export const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido").max(120);

export const senhaSchema = z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  senha: z.string().min(1),
});

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(60),
  email: emailSchema,
  senha: senhaSchema,
});

// ---------------------------------------------------------------- básicos

const vazioParaNull = (v: unknown) => (v === "" ? null : v);

export const idSchema = z.string().cuid("Id inválido");
const idOpcional = z.preprocess(vazioParaNull, idSchema.nullish());
export const dataSchema = z.string().refine(isDataISO, "Data inválida (use AAAA-MM-DD)");
export const mesSchema = z.string().refine(isMesISO, "Mês inválido (use AAAA-MM)");
/** Valor em centavos, inteiro e positivo (máx. R$ 100 milhões). */
export const centavosSchema = z
  .number({ invalid_type_error: "Valor inválido", required_error: "Informe o valor" })
  .int("Valor deve estar em centavos")
  .positive("Valor deve ser maior que zero")
  .max(10_000_000_000, "Valor muito alto");
const centavosComSinal = z.number({ invalid_type_error: "Valor inválido" }).int().min(-10_000_000_000).max(10_000_000_000);
const corSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida");
const iconeSchema = z.string().regex(/^[a-z0-9-]{1,40}$/, "Ícone inválido");
const texto = (max: number, msg = "Campo obrigatório") => z.string().trim().min(1, msg).max(max, `Máximo de ${max} caracteres`);
const observacaoSchema = z
  .string()
  .trim()
  .max(500, "Observação muito longa")
  .nullish()
  .transform((v) => v || null);
const diaDoMes = z.number().int().min(1, "Dia inválido").max(31, "Dia inválido");

export const tipoContaSchema = z.enum(["CORRENTE", "CARTEIRA", "INVESTIMENTO"]);
export const tipoCategoriaSchema = z.enum(["ENTRADA", "SAIDA", "AMBOS"]);
export const statusSchema = z.enum(["PAGO", "PENDENTE"]);
export const frequenciaSchema = z.enum(["MENSAL", "SEMANAL", "ANUAL"]);
const tipoMovimento = z.enum(["ENTRADA", "SAIDA"]);

// ---------------------------------------------------------------- contas

export const contaSchema = z.object({
  nome: texto(40, "Informe o nome da conta"),
  tipo: tipoContaSchema,
  saldoInicial: centavosComSinal.default(0),
  cor: corSchema.optional(),
  ordem: z.number().int().optional(),
});
export const contaAtualizarSchema = contaSchema.partial().extend({ arquivada: z.boolean().optional() });

// ---------------------------------------------------------------- categorias

export const categoriaSchema = z.object({
  nome: texto(30, "Informe o nome da categoria"),
  icone: iconeSchema.default("circle"),
  cor: corSchema.default("#8E8E93"),
  tipo: tipoCategoriaSchema.default("SAIDA"),
});
export const categoriaAtualizarSchema = categoriaSchema.partial().extend({ arquivada: z.boolean().optional() });

// ---------------------------------------------------------------- cartões

const cartaoBase = z.object({
  nome: texto(40, "Informe o nome do cartão"),
  limite: z.number().int().nonnegative("Limite inválido").max(10_000_000_000),
  diaFechamento: diaDoMes,
  diaVencimento: diaDoMes,
  contaPagamentoId: idSchema,
  cor: corSchema.optional(),
});
export const cartaoSchema = cartaoBase;
export const cartaoAtualizarSchema = cartaoBase.partial().extend({ arquivado: z.boolean().optional() });

export const pagarFaturaSchema = z.object({
  data: dataSchema,
  /** Conta que paga; padrão: a conta vinculada ao cartão. */
  contaId: idOpcional,
});

// ---------------------------------------------------------------- lançamentos

const origem = <T extends { contaId?: string | null; cartaoId?: string | null; tipo?: string }>(
  d: T,
  ctx: z.RefinementCtx,
) => {
  if (!!d.contaId === !!d.cartaoId) {
    ctx.addIssue({ code: "custom", message: "Escolha uma conta ou um cartão", path: ["contaId"] });
  }
  if (d.cartaoId && d.tipo === "ENTRADA") {
    ctx.addIssue({ code: "custom", message: "Cartão de crédito só aceita saídas", path: ["cartaoId"] });
  }
};

export const lancamentoCriarSchema = z
  .object({
    tipo: tipoMovimento,
    descricao: texto(120, "Informe a descrição"),
    valor: centavosSchema,
    data: dataSchema,
    status: statusSchema.default("PAGO"),
    categoriaId: idOpcional,
    contaId: idOpcional,
    cartaoId: idOpcional,
    observacao: observacaoSchema,
    parcelas: z.number().int().min(1).max(48, "Máximo de 48 parcelas").default(1),
    /** Se informado, cria uma recorrência a partir desta data (o lançamento vira a 1ª ocorrência). */
    repetir: z
      .object({ frequencia: frequenciaSchema, dataFim: dataSchema.nullish() })
      .nullish(),
  })
  .superRefine((d, ctx) => {
    origem(d, ctx);
    if (d.parcelas > 1 && !d.cartaoId) {
      ctx.addIssue({ code: "custom", message: "Parcelamento só no cartão", path: ["parcelas"] });
    }
    if (d.parcelas > 1 && d.repetir) {
      ctx.addIssue({ code: "custom", message: "Não é possível parcelar e repetir ao mesmo tempo", path: ["repetir"] });
    }
    if (d.repetir?.dataFim && d.repetir.dataFim < d.data) {
      ctx.addIssue({ code: "custom", message: "Data final antes do início", path: ["repetir"] });
    }
  });

export const escopoSchema = z.enum(["esta", "proximas"]).default("esta");

export const lancamentoAtualizarSchema = z.object({
  descricao: texto(120).optional(),
  valor: centavosSchema.optional(),
  data: dataSchema.optional(),
  status: statusSchema.optional(),
  categoriaId: idOpcional,
  contaId: idOpcional,
  cartaoId: idOpcional,
  observacao: observacaoSchema.optional(),
  /** Só para lançamentos gerados por recorrência. */
  escopo: escopoSchema,
});

export const lancamentoExcluirSchema = z.object({
  /** "todas" = compra parcelada inteira. */
  escopo: z.enum(["esta", "proximas", "todas"]).default("esta"),
});

export const lancamentosQuerySchema = z.object({
  mes: mesSchema.optional(),
  tipo: z.enum(["ENTRADA", "SAIDA", "TRANSFERENCIA"]).optional(),
  status: statusSchema.optional(),
  categoriaId: idSchema.optional(),
  contaId: idSchema.optional(),
  cartaoId: idSchema.optional(),
  q: z.string().trim().max(60).optional(),
});

export const transferenciaSchema = z
  .object({
    contaOrigemId: idSchema,
    contaDestinoId: idSchema,
    valor: centavosSchema,
    data: dataSchema,
    descricao: z.string().trim().max(120).optional(),
    observacao: observacaoSchema,
  })
  .refine((d) => d.contaOrigemId !== d.contaDestinoId, {
    message: "Escolha contas diferentes",
    path: ["contaDestinoId"],
  });

// ---------------------------------------------------------------- recorrências

const recorrenciaBase = z.object({
  descricao: texto(120, "Informe a descrição"),
  valor: centavosSchema,
  tipo: tipoMovimento,
  categoriaId: idOpcional,
  contaId: idOpcional,
  cartaoId: idOpcional,
  frequencia: frequenciaSchema.default("MENSAL"),
  /** Dia do mês (1–31) ou da semana (0=dom … 6=sáb) no semanal. */
  dia: z.number().int().min(0).max(31),
  dataInicio: dataSchema,
  dataFim: dataSchema.nullish(),
});

const validarDia = (d: { frequencia?: string; dia?: number }, ctx: z.RefinementCtx) => {
  if (d.dia === undefined) return;
  const ok = d.frequencia === "SEMANAL" ? d.dia <= 6 : d.dia >= 1;
  if (!ok) ctx.addIssue({ code: "custom", message: "Dia inválido para a frequência", path: ["dia"] });
};

export const recorrenciaCriarSchema = recorrenciaBase.superRefine((d, ctx) => {
  origem(d, ctx);
  validarDia(d, ctx);
  if (d.dataFim && d.dataFim < d.dataInicio) {
    ctx.addIssue({ code: "custom", message: "Data final antes do início", path: ["dataFim"] });
  }
});

export const recorrenciaAtualizarSchema = recorrenciaBase
  .omit({ dataInicio: true, tipo: true })
  .partial()
  .extend({ ativa: z.boolean().optional() })
  .superRefine((d, ctx) => {
    if (d.contaId !== undefined || d.cartaoId !== undefined) {
      if (!!d.contaId === !!d.cartaoId) {
        ctx.addIssue({ code: "custom", message: "Escolha uma conta ou um cartão", path: ["contaId"] });
      }
    }
    validarDia(d, ctx);
  });

// ---------------------------------------------------------------- caixinhas

export const caixinhaSchema = z.object({
  nome: texto(40, "Informe o nome"),
  valorAlvo: centavosSchema.nullish(),
  prazo: dataSchema.nullish(),
  planejadoMensal: centavosSchema.nullish(),
  cor: corSchema.optional(),
  icone: iconeSchema.optional(),
});
export const caixinhaAtualizarSchema = caixinhaSchema.partial().extend({ arquivada: z.boolean().optional() });

export const movimentarCaixinhaSchema = z.object({
  tipo: z.enum(["DEPOSITO", "RESGATE"]),
  valor: centavosSchema,
  data: dataSchema,
  contaId: idSchema,
});

// ---------------------------------------------------------------- consultas

export const mesQuerySchema = z.object({ mes: mesSchema.optional() });

export const csvQuerySchema = z
  .object({ de: dataSchema, ate: dataSchema })
  .refine((d) => d.de <= d.ate, { message: "Período inválido", path: ["ate"] });
