import { cn } from "@/lib/utils";
import { accentToneStyles, type AccentTone } from "@/lib/accent-styles";
import { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  action,
  className,
  label,
  accent,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  label?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        accent && "accent-panel p-6 sm:p-8",
        className,
      )}
    >
      <div className="animate-fade-in">
        {label && <p className="label-caps mb-2">{label}</p>}
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight sm:text-3xl",
            accent ? "gradient-text" : "text-foreground",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 animate-fade-in">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  accent = "neutral",
  tone,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  trend?: string;
  accent?: "neutral" | "blue" | "green" | "purple" | "amber";
  tone?: AccentTone;
}) {
  const legacyAccents = {
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    blue: "bg-[#8ec5ff]/15 text-[#2563eb] dark:bg-[#8ec5ff]/20 dark:text-[#8ec5ff]",
    green: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    purple: "bg-[#a78bfa]/15 text-[#7c3aed] dark:bg-[#a78bfa]/20 dark:text-[#c4b5fd]",
    amber: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  };

  const toneStyle = tone ? accentToneStyles[tone] : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md",
        toneStyle
          ? cn("bg-gradient-to-br", toneStyle.stat, toneStyle.glow)
          : "border-border",
      )}
    >
      {toneStyle && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-90",
            toneStyle.stripe,
          )}
        />
      )}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
            toneStyle ? toneStyle.icon : legacyAccents[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="label-caps !text-[10px]">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        {detail && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  label,
  tone = "blue",
  children,
  className,
  action,
  contentClassName,
  inline,
}: {
  title: string;
  label?: string;
  tone?: AccentTone;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  contentClassName?: string;
  /** Render children inside the header block instead of a separate content area */
  inline?: boolean;
}) {
  const style = accentToneStyles[tone];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "px-5 py-3.5 bg-gradient-to-r",
          style.stat,
          inline
            ? "space-y-3"
            : "flex items-center justify-between gap-3 border-b border-border",
        )}
      >
        <div className={cn(inline ? undefined : "min-w-0")}>
          {label && <p className="label-caps mb-0.5 !text-[10px]">{label}</p>}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {action}
        {inline && children}
      </div>
      {!inline && (
        <div className={cn("p-4", contentClassName)}>{children}</div>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-gradient-to-br from-[#8ec5ff]/5 via-transparent to-[#a78bfa]/5 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ec5ff]/20 to-[#a78bfa]/20">
        <Icon className="h-7 w-7 text-[#7c3aed] dark:text-[#c4b5fd]" />
      </div>
      <h3 className="mt-4 text-base font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const colors = [
    "bg-[#8ec5ff]/20 text-[#2563eb] dark:text-[#8ec5ff]",
    "bg-[#a78bfa]/20 text-[#7c3aed] dark:text-[#c4b5fd]",
    "bg-[#5eead4]/20 text-[#0d9488] dark:text-[#5eead4]",
    "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  ];

  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium",
        sizes[size],
        colors[colorIndex],
      )}
    >
      {initials}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse-soft rounded-lg bg-neutral-200 dark:bg-neutral-800",
        className,
      )}
    />
  );
}

export function LoadingRegion({
  loading,
  statusLabel,
  children,
  className,
}: {
  loading: boolean;
  statusLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-busy={loading || undefined}
      aria-live="polite"
      className={className}
    >
      {loading && (
        <span className="sr-only" role="status">
          {statusLabel}
        </span>
      )}
      {children}
    </div>
  );
}
