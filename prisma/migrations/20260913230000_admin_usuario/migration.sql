-- Login passa a ser por usuário em vez de e-mail. Remove o admin temporário de teste.
DELETE FROM "Admin";
ALTER TABLE "Admin" RENAME COLUMN "email" TO "usuario";
ALTER INDEX "Admin_email_key" RENAME TO "Admin_usuario_key";
