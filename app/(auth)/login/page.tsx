import type { Metadata } from "next";
import { FormAuth } from "@/components/auth/FormAuth";

export const metadata: Metadata = { title: "Entrar · Finanças" };

export default function Login() {
  return <FormAuth modo="login" />;
}
