import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useTask } from "../../context/TaskContext";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";

const COLUMNS = [
  { id: "pending", title: "To Do", color: "slate" },
  { id: "in-progress", title: "In Progress", color: "blue" },
  { id: "completed", title: "Done", color: "green" },
];

export default function KanbanBoard() {
  const { tasks, updateTask, loading } = useTask();
  const [activeTask, setActiveTask] = useState(null);
  const [localTasks, setLocalTasks] = useState([]);

  useEffect(() => {
    if (!loading) {
      setLocalTasks(tasks);
    }
  }, [tasks, loading]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  if (loading) {
    return (
      <div className="text-slate-400 py-10 text-center">Loading tasks...</div>
    );
  }

  const grouped = {
    pending: localTasks.filter((t) => t.status === "pending"),
    "in-progress": localTasks.filter((t) => t.status === "in-progress"),
    completed: localTasks.filter((t) => t.status === "completed"),
  };

  const handleDragStart = (event) => {
    const task = localTasks.find((t) => t._id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }
    if (active.id === over.id) {
      setActiveTask(null);
      return;
    }
    const draggedTask = localTasks.find((t) => t._id === active.id);
    if (!draggedTask) {
      setActiveTask(null);
      return;
    }

    const targetStatus = COLUMNS.map((c) => c.id).includes(over.id)
      ? over.id
      : localTasks.find((t) => t._id === over.id)?.status;

    if (!targetStatus) {
      setActiveTask(null);
      return;
    }

    if (draggedTask.status !== targetStatus) {
      // Optimistic UI update
      setLocalTasks((prev) =>
        prev.map((t) =>
          t._id === active.id ? { ...t, status: targetStatus } : t
        )
      );
      try {
        await updateTask(active.id, {
          title: draggedTask.title,
          description: draggedTask.description,
          priority: draggedTask.priority,
          dueDate: draggedTask.dueDate,
          status: targetStatus,
          project: draggedTask.project?._id || draggedTask.project,
          assignedTo: Array.isArray(draggedTask.assignedTo)
            ? draggedTask.assignedTo.map((u) =>
                typeof u === "string" ? u : u._id
              )
            : [],
        });
      } catch (err) {
        console.error("Failed to update task:", err);
      }
    }
    setActiveTask(null);
  };


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6">
        {COLUMNS.map(({ id, title, color }) => (
          <SortableContext
            key={id}
            id={id}
            items={grouped[id].map((task) => task._id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              id={id}
              title={title}
              color={color}
              tasks={grouped[id]}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
