import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/tasks/currency";
import { useTaskStore } from "@/lib/tasks/store";

export function AlarmOverlay() {
  const alarm = useTaskStore((s) => s.ringing[0] ?? null);
  const remaining = useTaskStore((s) => Math.max(0, s.ringing.length - 1));
  const completeFromAlarm = useTaskStore((s) => s.completeFromAlarm);
  const snoozeAlarm = useTaskStore((s) => s.snoozeAlarm);
  const dismissAlarm = useTaskStore((s) => s.dismissAlarm);

  if (!alarm) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tally-alarm-title"
      aria-describedby="tally-alarm-desc"
    >
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-[var(--shadow-border-hover)]">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="tally-alarm-pulse grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"
          >
            <Bell className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Reminder
            </p>
            <h2
              id="tally-alarm-title"
              className="font-display mt-1 text-2xl leading-tight font-medium tracking-tight"
            >
              {alarm.title}
            </h2>
            <p id="tally-alarm-desc" className="mt-1.5 text-sm text-muted-foreground">
              {alarm.whenLabel}
              {alarm.amount != null
                ? ` · ${formatMoney(alarm.amount, alarm.currency)}`
                : ""}
            </p>
            {remaining > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {remaining} more waiting
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button className="w-full" onClick={() => completeFromAlarm(alarm.taskId)}>
            Mark done
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => snoozeAlarm(alarm.taskId, 10)}
          >
            Snooze 10 min
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => dismissAlarm(alarm.taskId)}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
