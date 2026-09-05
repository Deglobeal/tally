import { useEffect, type ReactNode } from "react";
import { useTaskStore } from "@/lib/tasks/store";

export function StoreHydration({ children }: { children: ReactNode }) {
  useEffect(() => {
    const finish = () => {
      const store = useTaskStore.getState();
      if (!store.hydrated) {
        store.seedIfNeeded();
        store.setHydrated();
      }
    };
    const unsub = useTaskStore.persist.onFinishHydration(finish);
    void useTaskStore.persist.rehydrate();
    if (useTaskStore.persist.hasHydrated()) finish();
    return unsub;
  }, []);

  return <>{children}</>;
}
