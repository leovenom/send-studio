import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "active:scale-[0.98] focus-ring",
          variant === "primary" && "btn-accent",
          variant === "secondary" && "btn-accent-secondary",
          variant === "outline" && "btn-accent-secondary",
          variant === "ghost" &&
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium text-muted transition-all hover:bg-accent hover:text-foreground",
          variant === "danger" &&
            "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 font-medium text-white shadow-sm transition-all hover:bg-red-700",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          size === "icon" && "h-9 w-9",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
