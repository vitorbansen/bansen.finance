import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-sm text-neutral-500">404</p>
      <h1 className="display mt-4 text-4xl md:text-6xl">Página não encontrada.</h1>
      <Link href="/" className="mt-10 text-neutral-400 underline-offset-4 transition hover:text-ash hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
