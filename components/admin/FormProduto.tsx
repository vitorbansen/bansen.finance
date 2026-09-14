"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
import { garantiaPorEstado } from "@/lib/validators";

export type FormProdutoValues = {
  modelo: string;
  armazenamento: string;
  cor: string;
  estado: "NOVO" | "SEMINOVO";
  preco: string;
  precoPix: string;
  bateria: string;
  imagem: string;
  destaque: boolean;
  disponivel: boolean;
  ordem: string;
};

const vazio: FormProdutoValues = {
  modelo: "",
  armazenamento: "",
  cor: "",
  estado: "NOVO",
  preco: "",
  precoPix: "",
  bateria: "",
  imagem: "",
  destaque: false,
  disponivel: true,
  ordem: "0",
};

type Props = { id?: string; inicial?: Partial<FormProdutoValues> };

export function FormProduto({ id, inicial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormProdutoValues>({ ...vazio, ...inicial });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  function set<K extends keyof FormProdutoValues>(key: K, value: FormProdutoValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function enviarFoto(file: File) {
    setEnviandoFoto(true);
    setErro(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setEnviandoFoto(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro(data?.error ?? "Erro ao enviar a foto");
      return;
    }
    set("imagem", data.url);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const res = await fetch(id ? `/api/produtos/${id}` : "/api/produtos", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const primeiro = data?.issues?.fieldErrors
        ? (Object.values(data.issues.fieldErrors).flat()[0] as string | undefined)
        : undefined;
      setErro(primeiro ?? data?.error ?? "Erro ao salvar");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-10 md:grid-cols-[280px_1fr]">
      {/* Foto */}
      <div>
        <p className="label">Foto</p>
        <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-surface">
          {form.imagem ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imagem} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => set("imagem", "")}
                aria-label="Remover foto"
                className="absolute right-3 top-3 rounded-full bg-black/70 p-1.5 text-ash transition hover:bg-black"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={enviandoFoto}
              className="flex flex-col items-center gap-2 text-sm text-neutral-500 transition hover:text-ash disabled:opacity-50"
            >
              <ImagePlus className="h-6 w-6" />
              {enviandoFoto ? "Enviando..." : "Adicionar foto"}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) enviarFoto(f);
            e.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-neutral-600">
          Foto em pé (retrato), com o aparelho centralizado. A imagem preenche o bloco no site.
        </p>
      </div>

      {/* Campos */}
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="modelo">Modelo</label>
            <input id="modelo" className="input" placeholder="iPhone 16 Pro Max" required value={form.modelo} onChange={(e) => set("modelo", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="armazenamento">Armazenamento</label>
            <input id="armazenamento" className="input" placeholder="256GB" required value={form.armazenamento} onChange={(e) => set("armazenamento", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="cor">Cor</label>
            <input id="cor" className="input" placeholder="Titânio Deserto" required value={form.cor} onChange={(e) => set("cor", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="estado">Estado</label>
            <select id="estado" className="input" value={form.estado} onChange={(e) => set("estado", e.target.value as "NOVO" | "SEMINOVO")}>
              <option value="NOVO">Novo</option>
              <option value="SEMINOVO">Seminovo</option>
            </select>
          </div>
          <div>
            <p className="label">Garantia</p>
            <p className="input cursor-default border-dashed text-neutral-400">
              {garantiaPorEstado(form.estado)} <span className="text-neutral-600">— automática</span>
            </p>
          </div>
          <div>
            <label className="label" htmlFor="preco">Preço no cartão (R$)</label>
            <input id="preco" className="input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="9299" required value={form.preco} onChange={(e) => set("preco", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="precoPix">Preço no Pix (R$) <span className="normal-case text-neutral-600">— opcional</span></label>
            <input id="precoPix" className="input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="8999" value={form.precoPix} onChange={(e) => set("precoPix", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="bateria">Bateria (%) <span className="normal-case text-neutral-600">— seminovos</span></label>
            <input id="bateria" className="input" type="number" min="0" max="100" inputMode="numeric" placeholder="94" value={form.bateria} onChange={(e) => set("bateria", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ordem">Ordem <span className="normal-case text-neutral-600">— menor aparece antes</span></label>
            <input id="ordem" className="input" type="number" inputMode="numeric" value={form.ordem} onChange={(e) => set("ordem", e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-neutral-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#D4AF37]" checked={form.destaque} onChange={(e) => set("destaque", e.target.checked)} />
            Destaque
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#D4AF37]" checked={form.disponivel} onChange={(e) => set("disponivel", e.target.checked)} />
            Disponível
          </label>
        </div>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <div className="flex items-center gap-4 border-t border-white/[0.06] pt-6">
          <button className="btn-primary" disabled={salvando || enviandoFoto}>
            {salvando ? "Salvando..." : id ? "Salvar alterações" : "Cadastrar"}
          </button>
          <Link href="/admin" className="text-sm text-neutral-500 transition hover:text-ash">
            Cancelar
          </Link>
        </div>
      </div>
    </form>
  );
}
