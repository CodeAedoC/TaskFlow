import { useState } from "react";
import { useTask } from "../../context/TaskContext";
import { format } from "date-fns";
import TaskForm from "./TaskForm";

function TaskItem({ task, index }) {
  const { updateTask, deleteTask } = useTask();
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusColors = {
    pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    "in-progress": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const priorityColors = {
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const handleStatusToggle = async () => {
    const newStatus =
      task.status === "completed"
        ? "pending"
        : task.status === "pending"
        ? "in-progress"
        : "completed";
    try {
      await updateTask(task._id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setIsDeleting(true);
      try {
        await deleteTask(task._id);
      } catch (error) {
        console.error("Failed to delete task");
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div
        className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 group animate-fade-in-up"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button onClick={handleStatusToggle} className="flex-shrink-0 mt-1">
            <div
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                task.status === "completed"
                  ? "bg-teal-500 border-teal-500"
                  : "border-slate-700 hover:border-teal-500"
              }`}
            >
              {task.status === "completed" && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-lg font-semibold mb-2 ${
                task.status === "completed"
                  ? "text-slate-500 line-through"
                  : "text-white"
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-slate-400 text-sm mb-3">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  statusColors[task.status]
                }`}
              >
                {task.status.replace("-", " ")}
              </span>

              {/* Priority Badge */}
              <span
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>

              {/* Due Date */}
              {task.dueDate && (
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {format(new Date(task.dueDate), "MMM dd, yyyy")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowEditForm(true)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-400 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <TaskForm task={task} onClose={() => setShowEditForm(false)} />
      )}
    </>
  );
}

export default TaskItem;
