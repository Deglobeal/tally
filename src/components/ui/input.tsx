import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-lg bg-card px-3 py-2 text-base text-foreground shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 outline-none placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:opacity-50 md:text-sm",
        "focus-visible:ring-2 focus-visible:ring-ring/35",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
