-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('NOVO', 'SEMINOVO');

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "armazenamento" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'NOVO',
    "garantia" TEXT NOT NULL,
    "preco" DECIMAL(12,2) NOT NULL,
    "precoPix" DECIMAL(12,2),
    "bateria" INTEGER,
    "imagem" TEXT,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Produto_estado_disponivel_idx" ON "Produto"("estado", "disponivel");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
