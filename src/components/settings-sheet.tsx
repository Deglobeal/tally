import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CURRENCIES } from "@/lib/tasks/currency";
import {
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/tasks/notifications";
import { unlockAlarmAudio } from "@/lib/tasks/sound";
import { useTaskStore } from "@/lib/tasks/store";

function bannerHint(): string {
  const perm = notificationPermission();
  if (perm === "unsupported") return "This browser cannot show banners.";
  if (perm === "denied") return "Blocked in the browser. In-app alarms still work.";
  if (perm === "granted") return "Banners are allowed on this device.";
  return "Tally will ask when you turn this on.";
}

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const settings = useTaskStore((s) => s.settings);
  const setSettings = useTaskStore((s) => s.setSettings);
  const enqueueTestAlarm = useTaskStore((s) => s.enqueueTestAlarm);
  const { user, isPending } = useCurrentUserState();
  const [hint, setHint] = useState(bannerHint);
  const signedIn = Boolean(user) && !user?.isDevFallback;

  async function onBanners(next: boolean) {
    unlockAlarmAudio();
    if (next) {
      const ok = await requestNotificationPermission();
      setSettings({ bannerNotifications: true });
      setHint(bannerHint());
      if (!ok) {
        toast.message("In-app alarms still work", {
          description: "Banner permission was not granted.",
        });
      }
      return;
    }
    setSettings({ bannerNotifications: false });
    setHint(bannerHint());
  }

  function tryReminder() {
    unlockAlarmAudio();
    onClose();
    window.setTimeout(() => {
      enqueueTestAlarm();
    }, 400);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="bottom" className="sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-w-md sm:rounded-none">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Currency, totals, and reminders. Sign in to keep them in sync.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-6 pb-8">
          <div className="grid gap-2">
            <Label>Default currency</Label>
            <Select
              value={settings.defaultCurrency}
              onValueChange={(value) => setSettings({ defaultCurrency: value })}
            >
              <SelectTrigger aria-label="Default currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} · {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div>
              <p className="text-sm font-medium">Show money totals</p>
              <p className="text-sm text-muted-foreground">
                Pending and spent cards on the home screen.
              </p>
            </div>
            <Switch
              checked={settings.showMoneyTotals}
              onCheckedChange={(showMoneyTotals) => setSettings({ showMoneyTotals })}
              aria-label="Show money totals"
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Reminders</p>
            <p className="text-sm text-muted-foreground">
              Alarms are most reliable while Tally is open.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div>
              <p className="text-sm font-medium">Task reminders</p>
              <p className="text-sm text-muted-foreground">
                Ring at the date and time on a task.
              </p>
            </div>
            <Switch
              checked={settings.remindersEnabled}
              onCheckedChange={(remindersEnabled) => setSettings({ remindersEnabled })}
              aria-label="Task reminders"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div>
              <p className="text-sm font-medium">Alarm sound</p>
              <p className="text-sm text-muted-foreground">
                Repeat a chime until you dismiss it.
              </p>
            </div>
            <Switch
              checked={settings.alarmSoundEnabled}
              onCheckedChange={(alarmSoundEnabled) => {
                unlockAlarmAudio();
                setSettings({ alarmSoundEnabled });
              }}
              aria-label="Alarm sound"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div>
              <p className="text-sm font-medium">Banner notifications</p>
              <p className="text-sm text-muted-foreground">{hint}</p>
            </div>
            <Switch
              checked={settings.bannerNotifications}
              onCheckedChange={(v) => void onBanners(v)}
              aria-label="Banner notifications"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={tryReminder}
            disabled={!settings.remindersEnabled}
          >
            Try a reminder
          </Button>
          {!isPending && !signedIn ? (
            <Button asChild variant="outline">
              <Link to="/login">Sign in to sync devices</Link>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
