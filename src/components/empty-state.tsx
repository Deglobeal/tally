import { ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/lib/tasks/store";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const statusFilter = useTaskStore((s) => s.statusFilter);
  const copy =
    statusFilter === "done"
      ? {
          title: "No completed tasks",
          body: "Finished items will land here, and their amounts will count as spent.",
        }
      : statusFilter === "pending"
        ? {
            title: "All caught up",
            body: "Nothing pending. Add a task when the next thing comes up.",
          }
        : {
            title: "Nothing here yet",
            body: "Add a task, attach an amount if you like, and Tally will keep the running total.",
          };

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-[var(--shadow-border)]">
      <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
        <ListTodo className="size-6" />
      </span>
      <h2 className="mt-4 font-display text-xl font-medium">{copy.title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{copy.body}</p>
      <Button className="mt-5" onClick={onAdd}>
        Add a task
      </Button>
    </div>
  );
}
