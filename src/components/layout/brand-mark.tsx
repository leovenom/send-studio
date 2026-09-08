import { cn } from "@/lib/utils";

function SendStudioIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function BrandMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8ec5ff] to-[#a78bfa] text-white shadow-[0_4px_20px_rgba(142,197,255,0.35)]",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
    >
      <SendStudioIcon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </div>
  );
}

export function BrandTitle({ className }: { className?: string }) {
  return (
    <span className={cn("text-sm font-semibold tracking-tight", className)}>
      Send Studio
    </span>
  );
}
