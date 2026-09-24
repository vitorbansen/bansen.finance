import type { Metadata } from "next";
import { FormAuth } from "@/components/auth/FormAuth";

export const metadata: Metadata = { title: "Criar conta · Finanças" };

export default function Cadastro() {
  return <FormAuth modo="cadastro" />;
}
