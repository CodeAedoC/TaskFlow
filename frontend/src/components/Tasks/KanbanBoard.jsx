import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTask } from "../../context/TaskContext";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";

const COLUMNS = [
  { id: "pending", title: "To Do", color: "slate" },
  { id: "in-progress", title: "In Progress", color: "blue" },
  { id: "completed", title: "Done", color: "green" },
];

function KanbanBoard() {
  const { tasks, updateTask } = useTask();
  const [activeTask, setActiveTask] = useState(null);

  // smoother pointer handling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const handleDragStart = (event) => {
    const dragged = tasks.find((t) => t._id === event.active.id);
    setActiveTask(dragged);
  };

const handleDragEnd = async (event) => {
  const { active, over } = event;
  if (!over) return;

  const taskId = active.id;
  const targetId = over.id;
  const draggedTask = tasks.find((t) => t._id === taskId);
  if (!draggedTask) return;

  const targetStatus = ["pending", "in-progress", "completed"].includes(
    targetId
  )
    ? targetId
    : tasks.find((t) => t._id === targetId)?.status;

  if (!targetStatus || draggedTask.status === targetStatus) {
    setActiveTask(null);
    return;
  }

  // ⚡ Optimistic visual feedback: update local task instantly
  draggedTask.status = targetStatus;

  // This triggers UI re-render immediately since `tasks` changes within your context
  updateTask(taskId, {
    title: draggedTask.title,
    description: draggedTask.description,
    priority: draggedTask.priority,
    dueDate: draggedTask.dueDate,
    status: targetStatus,
    project: draggedTask.project?._id || draggedTask.project,
    assignedTo: Array.isArray(draggedTask.assignedTo)
      ? draggedTask.assignedTo.map((u) => (typeof u === "string" ? u : u._id))
      : [],
  }).catch((err) => {
    console.error("Backend update failed:", err);
    // For rollback, re-fetch tasks if update fails
  });

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
        {COLUMNS.map((col) => (
          <SortableContext
            key={col.id}
            id={col.id}
            items={getTasksByStatus(col.id).map((t) => t._id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={getTasksByStatus(col.id)}
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

export default KanbanBoard;
