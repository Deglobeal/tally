import { Bell, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTaskDate } from "@/lib/tasks/dates";
import { formatMoney } from "@/lib/tasks/currency";
import { nextFireAt } from "@/lib/tasks/reminder";
import { useTaskStore } from "@/lib/tasks/store";
import { PRIORITY_LABEL, type Priority, type Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANT: Record<Priority, "high" | "medium" | "low"> = {
  0: "low",
  1: "medium",
  2: "high",
};

const PRIORITY_DOT: Record<Priority, string> = {
  0: "bg-priority-low",
  1: "bg-priority-medium",
  2: "bg-priority-high",
};

export function TaskItem({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (id: string) => void;
}) {
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const toggleNoteChecked = useTaskStore((s) => s.toggleNoteChecked);
  const when = formatTaskDate(task.date, task.time);
  const fireAt = nextFireAt(task);
  const reminderOn = Boolean(task.remind && !task.completed);
  const overdue = reminderOn && fireAt != null && fireAt <= Date.now();

  return (
    <article className="flex gap-1 rounded-2xl bg-card py-1 pr-3 pl-1 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
      <button
        type="button"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        aria-pressed={task.completed}
        onClick={() => toggleComplete(task.id)}
        className="grid size-11 shrink-0 place-items-center self-start"
      >
        <span
          className={cn(
            "grid size-5 place-items-center rounded-sm border-2 transition-colors duration-150",
            task.completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-foreground/30 bg-card",
          )}
        >
          {task.completed ? <Check className="size-3.5" strokeWidth={3} /> : null}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(task.id)}
          className="w-full py-2.5 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                "text-sm leading-snug font-medium sm:text-base",
                task.completed && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </p>
            {task.amount != null ? (
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatMoney(task.amount, task.currency)}
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
            <Badge variant={PRIORITY_VARIANT[task.priority]}>
              {PRIORITY_LABEL[task.priority]}
            </Badge>
            {when ? (
              <span className="text-xs text-muted-foreground">{when}</span>
            ) : null}
            {reminderOn ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  overdue ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Bell className="size-3" />
                {overdue ? "Due" : "Alarm"}
              </span>
            ) : null}
          </div>
        </button>
        {task.note ? (
          <button
            type="button"
            onClick={() => toggleNoteChecked(task.id)}
            className="mb-2.5 flex w-full items-start gap-2 text-left"
          >
            <span
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border transition-colors",
                task.noteChecked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-foreground/25",
              )}
            >
              {task.noteChecked ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
            <span
              className={cn(
                "text-sm text-muted-foreground",
                task.noteChecked && "line-through",
              )}
            >
              {task.note}
            </span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
