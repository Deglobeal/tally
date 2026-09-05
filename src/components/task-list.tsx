import { EmptyState } from "@/components/empty-state";
import { TaskItem } from "@/components/task-item";
import { filterTasks, sortTasks } from "@/lib/tasks/totals";
import { useTaskStore } from "@/lib/tasks/store";

export function TaskList({
  onOpen,
  onAdd,
}: {
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const tasks = useTaskStore((s) => s.tasks);
  const statusFilter = useTaskStore((s) => s.statusFilter);
  const sortKey = useTaskStore((s) => s.sortKey);
  const visible = sortTasks(filterTasks(tasks, statusFilter, "all"), sortKey);

  if (visible.length === 0) {
    return <EmptyState onAdd={onAdd} />;
  }

  return (
    <ul className="tally-enter tally-enter-4 flex flex-col gap-2.5">
      {visible.map((task) => (
        <li key={task.id}>
          <TaskItem task={task} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
