import { imagemSplash } from "@/lib/pwa-arte";

/** Splash (apple-touch-startup-image) em pixels físicos, ex.: /splash/1170/2532. */
export async function GET(_req: Request, { params }: { params: { w: string; h: string } }) {
  const w = Number(params.w);
  const h = Number(params.h);
  const valido = (n: number) => Number.isInteger(n) && n >= 640 && n <= 3000;
  if (!valido(w) || !valido(h)) return new Response("Tamanho inválido", { status: 404 });
  const img = imagemSplash(w, h);
  img.headers.set("Cache-Control", "public, max-age=604800, immutable");
  return img;
}
