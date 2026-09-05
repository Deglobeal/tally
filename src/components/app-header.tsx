import { Cloud, CloudOff, LoaderCircle, Plus, Settings } from "lucide-react";
import { AuthSlot } from "@/components/auth-slot";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/lib/tasks/store";
import type { SyncStatus } from "@/lib/tasks/types";

function SyncGlyph({ status }: { status: SyncStatus }) {
  if (status === "syncing") {
    return <LoaderCircle className="size-4 animate-spin" />;
  }
  if (status === "offline" || status === "error") {
    return <CloudOff className="size-4" />;
  }
  if (status === "synced") {
    return <Cloud className="size-4" />;
  }
  return <CloudOff className="size-4" />;
}

function syncLabel(status: SyncStatus): string {
  if (status === "syncing") return "Syncing";
  if (status === "offline") return "Offline";
  if (status === "error") return "Sync paused";
  if (status === "synced") return "Synced";
  return "On this device";
}

export function AppHeader({
  onOpenSettings,
  onAdd,
}: {
  onOpenSettings: () => void;
  onAdd: () => void;
}) {
  const syncStatus = useTaskStore((s) => s.syncStatus);

  return (
    <header className="flex items-start justify-between gap-3 pt-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none">
              <path
                d="M3.5 8.2 6.2 11l6.3-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="font-display text-3xl leading-none font-medium tracking-tight italic">
            Tally
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">Tasks and money, in one list.</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <SyncGlyph status={syncStatus} />
          {syncLabel(syncStatus)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="hidden rounded-full sm:inline-flex"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          Add
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <Settings className="size-5" />
        </Button>
        <AuthSlot />
      </div>
    </header>
  );
}
