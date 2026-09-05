import { formatMoney } from "@/lib/tasks/currency";
import { periodTasks, sumAmounts } from "@/lib/tasks/totals";
import { useTaskStore } from "@/lib/tasks/store";
import type { Period } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const PERIODS: { id: Period; label: string }[] = [
  { id: "all", label: "All" },
  { id: "day", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export function SummaryCards() {
  const tasks = useTaskStore((s) => s.tasks);
  const period = useTaskStore((s) => s.period);
  const setPeriod = useTaskStore((s) => s.setPeriod);
  const settings = useTaskStore((s) => s.settings);
  const totals = sumAmounts(periodTasks(tasks, period));

  if (!settings.showMoneyTotals) return null;

  return (
    <section className="tally-enter tally-enter-2">
      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-3xl bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Pending
          </p>
          <p className="mt-2 font-display text-2xl leading-none font-medium tracking-tight tabular-nums">
            {formatMoney(totals.pending, settings.defaultCurrency)}
          </p>
        </article>
        <article className="rounded-3xl bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Spent
          </p>
          <p className="mt-2 font-display text-2xl leading-none font-medium tracking-tight tabular-nums">
            {formatMoney(totals.spent, settings.defaultCurrency)}
          </p>
        </article>
      </div>
      <div className="mt-3 flex rounded-full bg-secondary p-1">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "h-9 flex-1 rounded-full text-sm font-medium transition-[background-color,color,transform] duration-150",
              period === p.id
                ? "bg-card text-foreground shadow-[var(--shadow-border)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
