import {
  Baby,
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  Circle,
  Coffee,
  Coins,
  CreditCard,
  Dog,
  Dumbbell,
  Ellipsis,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Music,
  PartyPopper,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Tv,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Ícones disponíveis para categorias e caixinhas (nome salvo no banco → componente). */
export const ICONES: Record<string, LucideIcon> = {
  house: House,
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  car: Car,
  fuel: Fuel,
  bus: Bus,
  tv: Tv,
  wifi: Wifi,
  smartphone: Smartphone,
  zap: Zap,
  "party-popper": PartyPopper,
  film: Film,
  music: Music,
  "gamepad-2": Gamepad2,
  coffee: Coffee,
  "heart-pulse": HeartPulse,
  pill: Pill,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  gift: Gift,
  dog: Dog,
  baby: Baby,
  wrench: Wrench,
  receipt: Receipt,
  wallet: Wallet,
  briefcase: Briefcase,
  banknote: Banknote,
  "hand-coins": HandCoins,
  coins: Coins,
  "trending-up": TrendingUp,
  landmark: Landmark,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  shield: Shield,
  plane: Plane,
  target: Target,
  sparkles: Sparkles,
  ellipsis: Ellipsis,
  circle: Circle,
};

/** Paleta das cores do sistema iOS para categorias, contas, cartões e caixinhas. */
export const CORES = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#00C7BE",
  "#30B0C7",
  "#0A84FF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#A2845E",
  "#8E8E93",
];

/** Ícone dentro de um quadrado arredondado colorido (estilo Ajustes do iOS). */
export function IconeQuadrado({
  icone,
  cor,
  tamanho = 30,
  className,
}: {
  icone: string;
  cor: string;
  tamanho?: number;
  className?: string;
}) {
  const Comp = ICONES[icone] ?? Circle;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[8px] text-white", className)}
      style={{ backgroundColor: cor, width: tamanho, height: tamanho }}
      aria-hidden
    >
      <Comp size={Math.round(tamanho * 0.58)} strokeWidth={2.2} />
    </span>
  );
}
