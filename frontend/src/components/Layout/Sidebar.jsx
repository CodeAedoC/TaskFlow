import { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useTask } from "../../context/TaskContext";
import ProjectForm from "../Projects/ProjectForm";

function Sidebar() {
  const { projects, selectedProject, setSelectedProject } = useProject();
  const { filters, setFilters } = useTask();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setFilters({ ...filters, project: project?._id || "" });
  };

  return (
    <>
      <aside
        className={`bg-slate-900/50 backdrop-blur-sm border-r border-slate-800 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Projects
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={() => handleProjectSelect(null)}
          className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            !selectedProject
              ? "bg-slate-800/50 text-white"
              : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
          }`}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          {!isCollapsed && (
            <span className="text-sm font-medium">All Tasks</span>
          )}
        </button>

        <div className="flex-1 overflow-y-auto py-2">
          {projects.map((project) => (
            <button
              key={project._id}
              onClick={() => handleProjectSelect(project)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
                selectedProject?._id === project._id
                  ? "bg-slate-800/50 text-white"
                  : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium flex-1 truncate">
                    {project.name}
                  </span>
                  {project.owner && (
                    <svg
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {!isCollapsed && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => setShowProjectForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
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
              New Project
            </button>
          </div>
        )}
      </aside>
      {showProjectForm && (
        <ProjectForm onClose={() => setShowProjectForm(false)} />
      )}
    </>
  );
}

export default Sidebar;
