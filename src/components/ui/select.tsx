import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:border-foreground focus-ring",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  children,
  className,
  htmlFor,
  required,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted",
        className,
      )}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string | null;
}) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export function FieldGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}
