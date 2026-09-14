"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ usuario: "", senha: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data?.error ?? "Erro ao autenticar");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <Logo className="text-6xl" />
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="usuario">
              Usuário
            </label>
            <input
              id="usuario"
              type="text"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              className="input"
              autoComplete="current-password"
              required
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
            />
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-600">
          <Link href="/" className="transition hover:text-neutral-300">
            Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}
