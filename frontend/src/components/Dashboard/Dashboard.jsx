import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTask } from "../../context/TaskContext";
import { useProject } from "../../context/ProjectContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Layout/Sidebar";
import TaskList from "../Tasks/TaskList";
import TaskForm from "../Tasks/TaskForm";
import TaskFilter from "../Tasks/TaskFilter";
import Statistics from "./Statistics";

function Dashboard() {
  const { user, logout } = useAuth();
  const { statistics } = useTask();
  const { selectedProject } = useProject();
  const navigate = useNavigate();
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
          <div className="px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo & Title */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/50">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">TaskFlow</h1>
                  {selectedProject && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedProject.color }}
                      />
                      {selectedProject.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {selectedProject
                  ? `${selectedProject.name}`
                  : `Welcome back, ${user?.name?.split(" ")[0]}! 👋`}
              </h2>
              <p className="text-slate-400">
                {selectedProject
                  ? selectedProject.description || "Manage your project tasks"
                  : "Here's what's happening with your tasks today."}
              </p>
            </div>

            <Statistics statistics={statistics} />

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <TaskFilter />

              <button
                onClick={() => setShowTaskForm(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Task
              </button>
            </div>

            <TaskList />
          </div>
        </main>
      </div>

      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  );
}

export default Dashboard;
