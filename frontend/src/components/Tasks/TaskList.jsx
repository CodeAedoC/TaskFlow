import { useTask } from "../../context/TaskContext";
import TaskItem from "./TaskItem";

function TaskList() {
  const { tasks, loading } = useTask();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-800 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
        <div className="inline-block p-4 bg-slate-800/50 rounded-full mb-4">
          <svg
            className="w-12 h-12 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No tasks found
        </h3>
        <p className="text-slate-400">Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <TaskItem key={task._id} task={task} index={index} />
      ))}
    </div>
  );
}

export default TaskList;
