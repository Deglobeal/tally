import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-lg bg-card px-3 py-3 text-base text-foreground shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 outline-none placeholder:text-muted-foreground disabled:opacity-50 md:text-sm",
        "focus-visible:ring-2 focus-visible:ring-ring/35",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
