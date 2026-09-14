import { cn, whatsappLink } from "@/lib/utils";

/** Botão pill com mensagem pré-preenchida. Ganha o dourado no hover. */
export function WhatsappBotao({
  mensagem,
  label = "Falar no WhatsApp",
  disabled = false,
  className,
}: {
  mensagem: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-medium transition duration-300";

  if (disabled) {
    return (
      <span className={cn(base, "cursor-not-allowed border-white/10 text-neutral-500", className)}>{label}</span>
    );
  }

  return (
    <a
      href={whatsappLink(mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(base, "border-white/20 text-ash hover:border-gold hover:bg-gold hover:text-black", className)}
    >
      {label}
    </a>
  );
}
