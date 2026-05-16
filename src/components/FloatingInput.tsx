import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightEl?: ReactNode;
  error?: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, rightEl, error, className, onFocus, onBlur, value, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = value !== undefined && value !== "";
    const floating = focused || hasValue;

    return (
      <div className="w-full">
        <div
          className={cn(
            "relative flex items-center rounded-2xl border bg-surface transition-colors duration-150",
            focused ? "border-primary/60 ring-1 ring-primary/20" : "border-border/60",
            error && "border-destructive/60 ring-0"
          )}
        >
          <input
            ref={ref}
            value={value}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={cn(
              "w-full bg-transparent pb-2.5 pt-6 text-sm text-foreground outline-none",
              rightEl ? "pl-4 pr-11" : "px-4",
              className
            )}
            placeholder=""
            {...props}
          />
          <label
            className={cn(
              "pointer-events-none absolute left-4 select-none transition-all duration-150",
              floating
                ? "top-2.5 text-[10px] uppercase tracking-wider text-primary/80"
                : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            )}
          >
            {label}
          </label>
          {rightEl && (
            <div className="absolute right-3.5 flex items-center">{rightEl}</div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 pl-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";
