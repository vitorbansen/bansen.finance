import { cn } from "@/lib/utils";

/** Maçã estilizada que encosta no canto superior esquerdo do "N". */
function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <mask id="nk-bite">
          <rect width="100" height="100" fill="white" />
          <circle cx="90" cy="44" r="17" fill="black" />
        </mask>
      </defs>
      <path
        mask="url(#nk-bite)"
        d="M50 34 C40 24 18 26 15 52 C13 74 29 96 43 94 C47 93 48 92 50 92 C52 92 53 93 57 94 C71 96 87 74 85 52 C82 26 60 24 50 34 Z"
        fill="currentColor"
      />
      <path d="M52 30 C52 18 62 8 74 8 C74 20 64 30 52 30 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Logo NK iPhones em vetor. O tamanho é controlado pela classe de fonte
 * do container (ex.: text-[7rem]) — tudo dentro escala em `em`.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col items-center", className)}>
      <span className="relative inline-block leading-[0.78]">
        <AppleMark className="absolute -left-[0.17em] -top-[0.15em] h-[0.34em] w-[0.34em] text-gold" />
        <span className="font-black tracking-[-0.07em] text-gold">NK</span>
      </span>
      {!compact && (
        <span className="mt-[0.1em] pl-[0.45em] text-[0.17em] font-medium uppercase leading-none tracking-[0.45em] text-ash">
          iPhones
        </span>
      )}
    </span>
  );
}
