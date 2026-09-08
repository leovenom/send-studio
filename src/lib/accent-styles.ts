/** Paleta inspirada no portfolio-2026 — rotação de acentos em cards */

export type AccentTone = "blue" | "violet" | "cyan" | "emerald" | "amber";

export const ACCENT_TONES: AccentTone[] = ["blue", "violet", "cyan", "emerald", "amber"];

export const accentToneStyles: Record<
  AccentTone,
  {
    icon: string;
    stripe: string;
    chip: string;
    stat: string;
    glow: string;
  }
> = {
  blue: {
    icon: "bg-[#8ec5ff]/15 text-[#2563eb] dark:bg-[#8ec5ff]/20 dark:text-[#8ec5ff]",
    stripe: "from-[#8ec5ff] via-[#8ec5ff]/80 to-[#5eead4]/60",
    chip: "border-[#8ec5ff]/35 bg-[#8ec5ff]/10 text-[#1d4ed8] dark:text-[#8ec5ff]",
    stat: "from-[#8ec5ff]/12 to-[#5eead4]/8 border-[#8ec5ff]/25",
    glow: "shadow-[0_8px_32px_-8px_rgba(142,197,255,0.45)]",
  },
  violet: {
    icon: "bg-[#a78bfa]/15 text-[#7c3aed] dark:bg-[#a78bfa]/20 dark:text-[#c4b5fd]",
    stripe: "from-[#a78bfa] via-[#c4b5fd]/90 to-[#8ec5ff]/50",
    chip: "border-[#a78bfa]/35 bg-[#a78bfa]/10 text-[#6d28d9] dark:text-[#c4b5fd]",
    stat: "from-[#a78bfa]/12 to-[#c4b5fd]/8 border-[#a78bfa]/25",
    glow: "shadow-[0_8px_32px_-8px_rgba(167,139,250,0.45)]",
  },
  cyan: {
    icon: "bg-[#5eead4]/15 text-[#0d9488] dark:bg-[#5eead4]/20 dark:text-[#5eead4]",
    stripe: "from-[#5eead4] via-[#5eead4]/80 to-[#8ec5ff]/50",
    chip: "border-[#5eead4]/35 bg-[#5eead4]/10 text-[#0f766e] dark:text-[#5eead4]",
    stat: "from-[#5eead4]/12 to-[#8ec5ff]/8 border-[#5eead4]/25",
    glow: "shadow-[0_8px_32px_-8px_rgba(94,234,212,0.4)]",
  },
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    stripe: "from-emerald-400 via-emerald-500/80 to-[#5eead4]/50",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    stat: "from-emerald-500/10 to-[#5eead4]/8 border-emerald-500/25",
    glow: "shadow-[0_8px_32px_-8px_rgba(16,185,129,0.35)]",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    stripe: "from-amber-400 via-amber-500/80 to-[#c4b5fd]/40",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    stat: "from-amber-500/10 to-[#c4b5fd]/6 border-amber-500/25",
    glow: "shadow-[0_8px_32px_-8px_rgba(245,158,11,0.35)]",
  },
};

export function accentAt(index: number): AccentTone {
  return ACCENT_TONES[index % ACCENT_TONES.length];
}
