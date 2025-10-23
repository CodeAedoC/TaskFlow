import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import KanbanCard from "./KanbanCard";

function KanbanColumn({ id, title, color, tasks }) {
  const { setNodeRef } = useDroppable({ id });

  const colors = {
    slate: "border-slate-700 bg-slate-800/30",
    blue: "border-blue-700 bg-blue-900/20",
    green: "border-green-700 bg-green-900/20",
  };

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80">
      <motion.div
        whileHover={{ backgroundColor: "rgba(30,41,59,0.4)" }}
        transition={{ duration: 0.2 }}
        className={`p-4 rounded-xl border-2 min-h-[500px] transition-colors ${colors[color]}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">{title}</h2>
          <span className="text-slate-400 text-sm">{tasks.length}</span>
        </div>

        <SortableContext
          id={id}
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[120px]">
            {tasks.map((task) => (
              <KanbanCard key={task._id} task={task} />
            ))}
          </div>
        </SortableContext>
      </motion.div>
    </div>
  );
}

export default KanbanColumn;
