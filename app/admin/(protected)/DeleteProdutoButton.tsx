"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function DeleteProdutoButton({ id, modelo }: { id: string; modelo: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!confirmando) return;
    const t = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(t);
  }, [confirmando]);

  async function remover() {
    setLoading(true);
    setErro(false);
    const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setErro(true);
      setConfirmando(false);
    }
  }

  if (confirmando) {
    return (
      <button
        onClick={remover}
        disabled={loading}
        aria-label={`Confirmar exclusão de ${modelo}`}
        className="font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
      >
        {loading ? "Excluindo..." : "Confirmar?"}
      </button>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className={erro ? "text-red-400" : "text-neutral-500 transition hover:text-red-400"}
    >
      {erro ? "Erro, tentar de novo" : "Excluir"}
    </button>
  );
}
