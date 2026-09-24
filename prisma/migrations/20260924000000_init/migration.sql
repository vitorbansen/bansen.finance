-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('CORRENTE', 'CARTEIRA', 'INVESTIMENTO');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('ENTRADA', 'SAIDA', 'AMBOS');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('PAGO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "Frequencia" AS ENUM ('MENSAL', 'SEMANAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('DEPOSITO', 'RESGATE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoConta" NOT NULL DEFAULT 'CORRENTE',
    "saldoInicial" INTEGER NOT NULL DEFAULT 0,
    "cor" TEXT NOT NULL DEFAULT '#0A84FF',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT NOT NULL DEFAULT 'circle',
    "cor" TEXT NOT NULL DEFAULT '#8E8E93',
    "tipo" "TipoCategoria" NOT NULL DEFAULT 'SAIDA',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cartao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "limite" INTEGER NOT NULL,
    "diaFechamento" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "contaPagamentoId" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#820AD1',
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL,
    "cartaoId" TEXT NOT NULL,
    "mes" DATE NOT NULL,
    "dataFechamento" DATE NOT NULL,
    "dataVencimento" DATE NOT NULL,
    "pagaEm" DATE,
    "lancamentoPagamentoId" TEXT,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraParcelada" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cartaoId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "descricao" TEXT NOT NULL,
    "valorTotal" INTEGER NOT NULL,
    "nParcelas" INTEGER NOT NULL,
    "dataCompra" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompraParcelada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recorrencia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "categoriaId" TEXT,
    "contaId" TEXT,
    "cartaoId" TEXT,
    "frequencia" "Frequencia" NOT NULL DEFAULT 'MENSAL',
    "dia" INTEGER NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecorrenciaExcecao" (
    "id" TEXT NOT NULL,
    "recorrenciaId" TEXT NOT NULL,
    "data" DATE NOT NULL,

    CONSTRAINT "RecorrenciaExcecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "status" "StatusLancamento" NOT NULL DEFAULT 'PAGO',
    "observacao" TEXT,
    "categoriaId" TEXT,
    "contaId" TEXT,
    "contaDestinoId" TEXT,
    "cartaoId" TEXT,
    "faturaId" TEXT,
    "recorrenciaId" TEXT,
    "ocorrenciaData" DATE,
    "editado" BOOLEAN NOT NULL DEFAULT false,
    "compraParceladaId" TEXT,
    "parcelaNumero" INTEGER,
    "parcelaTotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caixinha" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorAlvo" INTEGER,
    "prazo" DATE,
    "planejadoMensal" INTEGER,
    "cor" TEXT NOT NULL DEFAULT '#30D158',
    "icone" TEXT NOT NULL DEFAULT 'piggy-bank',
    "arquivada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caixinha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoCaixinha" (
    "id" TEXT NOT NULL,
    "caixinhaId" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "valor" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "contaId" TEXT NOT NULL,
    "lancamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoCaixinha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Conta_userId_idx" ON "Conta"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_userId_nome_key" ON "Categoria"("userId", "nome");

-- CreateIndex
CREATE INDEX "Cartao_userId_idx" ON "Cartao"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_lancamentoPagamentoId_key" ON "Fatura"("lancamentoPagamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_cartaoId_mes_key" ON "Fatura"("cartaoId", "mes");

-- CreateIndex
CREATE INDEX "CompraParcelada_userId_idx" ON "CompraParcelada"("userId");

-- CreateIndex
CREATE INDEX "Recorrencia_userId_ativa_idx" ON "Recorrencia"("userId", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "RecorrenciaExcecao_recorrenciaId_data_key" ON "RecorrenciaExcecao"("recorrenciaId", "data");

-- CreateIndex
CREATE INDEX "Lancamento_userId_data_idx" ON "Lancamento"("userId", "data");

-- CreateIndex
CREATE INDEX "Lancamento_contaId_data_idx" ON "Lancamento"("contaId", "data");

-- CreateIndex
CREATE INDEX "Lancamento_contaDestinoId_idx" ON "Lancamento"("contaDestinoId");

-- CreateIndex
CREATE INDEX "Lancamento_faturaId_idx" ON "Lancamento"("faturaId");

-- CreateIndex
CREATE INDEX "Lancamento_cartaoId_idx" ON "Lancamento"("cartaoId");

-- CreateIndex
CREATE INDEX "Lancamento_compraParceladaId_idx" ON "Lancamento"("compraParceladaId");

-- CreateIndex
CREATE UNIQUE INDEX "Lancamento_recorrenciaId_ocorrenciaData_key" ON "Lancamento"("recorrenciaId", "ocorrenciaData");

-- CreateIndex
CREATE INDEX "Caixinha_userId_idx" ON "Caixinha"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoCaixinha_lancamentoId_key" ON "MovimentacaoCaixinha"("lancamentoId");

-- CreateIndex
CREATE INDEX "MovimentacaoCaixinha_caixinhaId_data_idx" ON "MovimentacaoCaixinha"("caixinhaId", "data");

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_contaPagamentoId_fkey" FOREIGN KEY ("contaPagamentoId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_lancamentoPagamentoId_fkey" FOREIGN KEY ("lancamentoPagamentoId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraParcelada" ADD CONSTRAINT "CompraParcelada_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraParcelada" ADD CONSTRAINT "CompraParcelada_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraParcelada" ADD CONSTRAINT "CompraParcelada_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrencia" ADD CONSTRAINT "Recorrencia_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecorrenciaExcecao" ADD CONSTRAINT "RecorrenciaExcecao_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaDestinoId_fkey" FOREIGN KEY ("contaDestinoId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_compraParceladaId_fkey" FOREIGN KEY ("compraParceladaId") REFERENCES "CompraParcelada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixinha" ADD CONSTRAINT "Caixinha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoCaixinha" ADD CONSTRAINT "MovimentacaoCaixinha_caixinhaId_fkey" FOREIGN KEY ("caixinhaId") REFERENCES "Caixinha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoCaixinha" ADD CONSTRAINT "MovimentacaoCaixinha_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoCaixinha" ADD CONSTRAINT "MovimentacaoCaixinha_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

