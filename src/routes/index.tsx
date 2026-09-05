import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AlarmOverlay } from "@/components/alarm-overlay";
import { AppHeader } from "@/components/app-header";
import { FilterBar } from "@/components/filter-bar";
import { ReminderBridge } from "@/components/reminder-bridge";
import { SettingsSheet } from "@/components/settings-sheet";
import { StoreHydration } from "@/components/store-hydration";
import { SyncBridge } from "@/components/sync-bridge";
import { SummaryCards } from "@/components/summary-cards";
import { TaskList } from "@/components/task-list";
import { TaskSheet } from "@/components/task-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskStore } from "@/lib/tasks/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <StoreHydration>
      <SyncBridge />
      <ReminderBridge />
      <TallyApp />
      <AlarmOverlay />
    </StoreHydration>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-11 rounded-full" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}

function TallyApp() {
  const hydrated = useTaskStore((s) => s.hydrated);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function openNew() {
    setTaskId(null);
    setSheetOpen(true);
  }

  function openExisting(id: string) {
    setTaskId(id);
    setSheetOpen(true);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-5 pb-28">
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} onAdd={openNew} />
      <div className="mt-6">
        {hydrated ? (
          <div className="flex flex-col gap-5">
            <SummaryCards />
            <FilterBar />
            <TaskList onOpen={openExisting} onAdd={openNew} />
          </div>
        ) : (
          <ListSkeleton />
        )}
      </div>
      <Button
        size="icon"
        aria-label="Add task"
        onClick={openNew}
        className="fixed right-5 bottom-8 z-40 size-14 rounded-full shadow-[var(--shadow-border-hover)] sm:hidden"
      >
        <Plus className="size-6" />
      </Button>
      <TaskSheet
        open={sheetOpen}
        taskId={taskId}
        onClose={() => setSheetOpen(false)}
      />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
