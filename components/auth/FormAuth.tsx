"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { api } from "@/lib/cliente";

/** Login e cadastro compartilham o mesmo layout. */
export function FormAuth({ modo }: { modo: "login" | "cadastro" }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const cadastro = modo === "cadastro";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await api("POST", cadastro ? "/api/auth/cadastro" : "/api/auth/login", cadastro ? { nome, email, senha } : { email, senha });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setErro((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <main className="pt-safe pb-safe coluna flex min-h-dvh flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#34C759] to-[#248A3D] text-white shadow-lg">
          <Wallet size={34} />
        </span>
        <h1 className="text-[28px] font-bold tracking-tight">{cadastro ? "Criar conta" : "Finanças"}</h1>
        <p className="mt-1 text-[15px] text-label-2/60">
          {cadastro ? "Leva menos de um minuto." : "Quanto entrou, quanto saiu e quanto sobra."}
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-4">
        <div className="grupo">
          {cadastro && (
            <input
              className="campo px-4"
              placeholder="Seu nome"
              autoComplete="name"
              required
              minLength={2}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-label="Nome"
            />
          )}
          <input
            className="campo px-4"
            type="email"
            inputMode="email"
            placeholder="E-mail"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="E-mail"
          />
          <input
            className="campo px-4"
            type="password"
            placeholder={cadastro ? "Senha (mín. 8 caracteres)" : "Senha"}
            autoComplete={cadastro ? "new-password" : "current-password"}
            required
            minLength={cadastro ? 8 : undefined}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-label="Senha"
          />
        </div>

        {erro && (
          <p role="alert" className="px-4 text-[15px] text-vermelho">
            {erro}
          </p>
        )}

        <button className="btn-primario w-full" disabled={enviando}>
          {enviando ? "Aguarde…" : cadastro ? "Criar conta" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-[15px] text-label-2/60">
        {cadastro ? "Já tem conta? " : "Primeira vez? "}
        <Link href={cadastro ? "/login" : "/cadastro"} className="font-medium text-tint">
          {cadastro ? "Entrar" : "Criar conta"}
        </Link>
      </p>
    </main>
  );
}
