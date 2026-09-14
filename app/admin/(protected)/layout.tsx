import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "./LogoutButton";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="wrap flex h-14 items-center justify-between text-sm">
          <Link href="/admin" className="flex items-center gap-2 pl-2">
            <Logo compact className="text-xl" />
            <span className="font-semibold tracking-tight text-ash">Admin</span>
          </Link>
          <nav className="flex items-center gap-5 text-neutral-400">
            <Link href="/admin" className="transition hover:text-ash">
              Produtos
            </Link>
            <Link href="/" target="_blank" className="transition hover:text-ash">
              Ver site
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="wrap py-10">{children}</main>
    </div>
  );
}
