import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

function KanbanCard({ task, isDragging = false }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: "bg-slate-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      transition={{
        layout: { type: "spring", stiffness: 400, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="bg-slate-800/60 hover:bg-slate-800
                 transition-colors rounded-lg p-4 cursor-grab 
                 active:cursor-grabbing shadow-lg shadow-slate-900/30"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="text-white font-medium text-sm flex-1">{task.title}</h3>
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            priorityColors[task.priority] || "bg-slate-500"
          }`}
        />
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        {task.dueDate && (
          <span className="text-slate-500">
            {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
          </span>
        )}

        {task.assignedTo?.length > 0 && (
          <div className="flex -space-x-2">
            {task.assignedTo.slice(0, 3).map((user) => (
              <div
                key={user._id}
                className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center 
                           text-xs text-white border border-slate-900"
                title={user.name}
              >
                {user.name[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default KanbanCard;
