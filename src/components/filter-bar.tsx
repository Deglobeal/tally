import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/lib/tasks/store";
import type { SortKey, StatusFilter } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "done", label: "Done" },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "created", label: "Newest" },
  { id: "date", label: "Date" },
  { id: "priority", label: "Priority" },
  { id: "amount", label: "Amount" },
];

export function FilterBar() {
  const statusFilter = useTaskStore((s) => s.statusFilter);
  const setStatusFilter = useTaskStore((s) => s.setStatusFilter);
  const sortKey = useTaskStore((s) => s.sortKey);
  const setSortKey = useTaskStore((s) => s.setSortKey);
  const sortLabel = SORTS.find((s) => s.id === sortKey)?.label ?? "Sort";

  return (
    <div className="tally-enter tally-enter-3 flex items-center gap-2">
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-150",
              statusFilter === f.id
                ? "bg-ink text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full">
            <ArrowUpDown className="size-3.5" />
            {sortLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SORTS.map((s) => (
            <DropdownMenuItem key={s.id} onSelect={() => setSortKey(s.id)}>
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
