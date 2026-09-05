import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { parseAmount } from "@/lib/tasks/currency";
import { formatTime } from "@/lib/tasks/dates";
import { requestNotificationPermission } from "@/lib/tasks/notifications";
import { defaultRemindTime } from "@/lib/tasks/reminder";
import { unlockAlarmAudio } from "@/lib/tasks/sound";
import { useTaskStore } from "@/lib/tasks/store";
import { PRIORITY_LABEL, todayIsoDate, type Priority } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = [2, 1, 0];
const PRIORITY_CLASS: Record<Priority, string> = {
  2: "data-[on=true]:bg-priority-high data-[on=true]:text-destructive-foreground",
  1: "data-[on=true]:bg-priority-medium data-[on=true]:text-destructive-foreground",
  0: "data-[on=true]:bg-priority-low data-[on=true]:text-destructive-foreground",
};

type FormState = {
  title: string;
  date: string;
  time: string;
  priority: Priority;
  amount: string;
  note: string;
  noteChecked: boolean;
  remind: boolean;
};

const EMPTY: FormState = {
  title: "",
  date: "",
  time: "",
  priority: 1,
  amount: "",
  note: "",
  noteChecked: false,
  remind: false,
};

export function TaskSheet({
  open,
  taskId,
  onClose,
}: {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
}) {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const existing = tasks.find((t) => t.id === taskId && !t.deletedAt);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    const current = useTaskStore
      .getState()
      .tasks.find((t) => t.id === taskId && !t.deletedAt);
    if (current) {
      setForm({
        title: current.title,
        date: current.date ?? "",
        time: current.time ?? "",
        priority: current.priority,
        amount: current.amount == null ? "" : String(current.amount),
        note: current.note,
        noteChecked: current.noteChecked,
        remind: current.remind === true,
      });
    } else {
      setForm(EMPTY);
    }
    setConfirmDelete(false);
  }, [open, taskId]);

  function setDate(date: string) {
    setForm((f) => ({
      ...f,
      date,
      remind: date ? true : false,
      time: date && !f.time ? defaultRemindTime(date) : f.time,
    }));
  }

  async function setRemind(remind: boolean) {
    unlockAlarmAudio();
    if (remind) {
      void requestNotificationPermission();
      setForm((f) => {
        const date = f.date || todayIsoDate();
        return {
          ...f,
          remind: true,
          date,
          time: f.time || defaultRemindTime(date),
        };
      });
      return;
    }
    setForm((f) => ({ ...f, remind: false }));
  }

  function save() {
    const title = form.title.trim();
    if (!title) {
      toast.error("Give this task a title.");
      return;
    }
    const amount = parseAmount(form.amount);
    if (form.amount.trim() && amount == null) {
      toast.error("Amount needs to be a number.");
      return;
    }
    if (form.remind && !form.date) {
      toast.error("Pick a date for the reminder.");
      return;
    }
    const payload = {
      title,
      date: form.date || null,
      time: form.time || null,
      priority: form.priority,
      amount,
      note: form.note.trim(),
      noteChecked: form.noteChecked,
      remind: form.remind,
    };
    if (existing) {
      updateTask(existing.id, {
        ...payload,
        snoozeUntil: form.remind ? existing.snoozeUntil : null,
        lastFiredAt: form.remind ? existing.lastFiredAt : null,
      });
    } else {
      addTask(payload);
    }
    onClose();
  }

  function onDelete() {
    if (!existing) return;
    removeTask(existing.id);
    setConfirmDelete(false);
    onClose();
  }

  const remindHint =
    form.remind && form.date
      ? `Alarm at ${form.time ? formatTime(form.time) : "9:00 AM"}`
      : "Uses the date and time above.";

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-w-md sm:rounded-none sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right"
        >
          <SheetHeader>
            <SheetTitle>{existing ? "Edit task" : "New task"}</SheetTitle>
            <SheetDescription>
              Title is required. Date, amount, reminder, and note are optional.
            </SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-2"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="What needs doing?"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="task-date">Date</Label>
                <Input
                  id="task-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-time">Time</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Remind me</p>
                <p className="text-sm text-muted-foreground">{remindHint}</p>
              </div>
              <Switch
                checked={form.remind}
                onCheckedChange={(v) => void setRemind(v === true)}
                aria-label="Remind me"
              />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-on={form.priority === p}
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={cn(
                      "h-11 rounded-lg bg-secondary text-sm font-medium text-foreground transition-colors duration-150",
                      PRIORITY_CLASS[p],
                    )}
                  >
                    {PRIORITY_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-amount">Amount</Label>
              <Input
                id="task-amount"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-note">Note</Label>
              <Textarea
                id="task-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="A smaller checklist item, extra detail…"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={form.noteChecked}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, noteChecked: v === true }))
                  }
                />
                Note is done
              </label>
            </div>
            <SheetFooter className="px-0">
              <Button type="submit" className="w-full">
                Save
              </Button>
              {existing ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete task
                </Button>
              ) : null}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
