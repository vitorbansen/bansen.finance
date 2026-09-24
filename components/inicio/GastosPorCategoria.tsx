import { IconeQuadrado } from "@/components/ui/Icone";
import { formatBRL } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

type Categoria = { categoriaId: string | null; nome: string; cor: string; icone: string; total: number; anterior: number };

/**
 * Barras horizontais ordenadas (uma cor só — o que importa é o tamanho); o mês anterior aparece
 * como um traço fino na mesma escala. A cor da categoria fica só no ícone, e os valores estão em
 * texto em cada linha, então a lista também é a "tabela" do gráfico.
 */
export function GastosPorCategoria({
  categorias,
  total,
  totalAnterior,
  nomeMesAnterior,
}: {
  categorias: Categoria[];
  total: number;
  totalAnterior: number;
  nomeMesAnterior: string;
}) {
  const visiveis = agrupar(categorias, 7);
  const max = Math.max(1, ...visiveis.map((c) => Math.max(c.total, c.anterior)));
  const variacao = total - totalAnterior;
  const pct = totalAnterior > 0 ? Math.round((variacao / totalAnterior) * 100) : null;

  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="flex items-baseline justify-between">
        <p className="valor text-[22px] font-bold tracking-tight">{formatBRL(total)}</p>
        {pct !== null && (
          <p className={cn("text-[13px] font-medium", variacao > 0 ? "text-vermelho" : "text-verde")}>
            {variacao > 0 ? "▲" : "▼"} {Math.abs(pct)}% vs {nomeMesAnterior}
          </p>
        )}
      </div>
      <div className="mt-1 flex items-center gap-4 text-[12px] text-label-2/60" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-tint" /> Este mês
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded-full bg-label/70" /> {nomeMesAnterior}
        </span>
      </div>

      <ul className="mt-3 space-y-3" aria-label="Gastos por categoria">
        {visiveis.map((c) => (
          <li
            key={c.categoriaId ?? c.nome}
            aria-label={`${c.nome}: ${formatBRL(c.total)} este mês, ${formatBRL(c.anterior)} em ${nomeMesAnterior}`}
          >
            <div className="flex items-center gap-2.5">
              <IconeQuadrado icone={c.icone} cor={c.cor} tamanho={24} className="rounded-[6px]" />
              <span className="min-w-0 flex-1 truncate text-[15px]">{c.nome}</span>
              <span className="valor text-[15px] font-medium">{formatBRL(c.total)}</span>
            </div>
            <div className="relative ml-[34px] mt-1.5 h-2" title={`${nomeMesAnterior}: ${formatBRL(c.anterior)}`}>
              <div className="absolute inset-0 rounded-full bg-fill/[0.12]" />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-tint"
                style={{ width: `${(c.total / max) * 100}%`, minWidth: c.total > 0 ? 4 : 0 }}
              />
              {c.anterior > 0 && (
                <div
                  className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-label/70 ring-2 ring-card"
                  style={{ left: `calc(${(c.anterior / max) * 100}% - 1px)` }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mantém as maiores e junta o resto em "Outras" (não inventa cores novas). */
function agrupar(cats: Categoria[], limite: number): Categoria[] {
  if (cats.length <= limite) return cats;
  const resto = cats.slice(limite - 1);
  return [
    ...cats.slice(0, limite - 1),
    {
      categoriaId: "__outras",
      nome: `Outras (${resto.length})`,
      cor: "#8E8E93",
      icone: "ellipsis",
      total: resto.reduce((a, c) => a + c.total, 0),
      anterior: resto.reduce((a, c) => a + c.anterior, 0),
    },
  ];
}
