import type { NextRequest } from "next/server";
import { imagemIcone } from "@/lib/pwa-arte";

const TAMANHOS = new Set([192, 512]);

/** Ícones do manifest: /icons/192, /icons/512 e /icons/512?maskable=1. */
export async function GET(req: NextRequest, { params }: { params: { size: string } }) {
  const tamanho = Number(params.size);
  if (!TAMANHOS.has(tamanho)) return new Response("Tamanho inválido", { status: 404 });
  const img = imagemIcone(tamanho, { maskable: req.nextUrl.searchParams.get("maskable") === "1" });
  img.headers.set("Cache-Control", "public, max-age=604800, immutable");
  return img;
}
