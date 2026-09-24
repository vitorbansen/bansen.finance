import { TelaCarregando } from "@/components/ui/Estados";

export default function Carregando() {
  return (
    <div className="pt-safe">
      <TelaCarregando cartoes={3} linhas={4} />
    </div>
  );
}
