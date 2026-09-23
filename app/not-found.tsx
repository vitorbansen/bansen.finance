import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-label-3">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Página não encontrada</h1>
      <Link href="/" className="mt-6 text-[17px] text-tint">
        Voltar ao início
      </Link>
    </div>
  );
}
