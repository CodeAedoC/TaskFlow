import { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useTask } from "../../context/TaskContext";
import ProjectForm from "../Projects/ProjectForm";
import ProjectSettings from "../Projects/ProjectSettings";

function Sidebar() {
  const { projects, selectedProject, setSelectedProject } = useProject();
  const { filters, setFilters } = useTask();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [settingsProject, setSettingsProject] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setFilters({ ...filters, project: project?._id || "", createdBy: "" });
  };

  const handleProjectSettings = (project, e) => {
    e.stopPropagation();
    setSettingsProject(project);
    setShowProjectSettings(true);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`bg-slate-900/50 backdrop-blur-sm border-r border-slate-800 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
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

        {/* All Tasks */}
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

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto py-2">
          {projects.map((project) => (
            <div
              key={project._id}
              className={`relative flex items-center gap-3 px-4 py-3 transition-colors group ${
                selectedProject?._id === project._id
                  ? "bg-slate-800/50 text-white"
                  : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
              }`}
            >
              {/* CHANGED: Removed nested button structure */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer"
                style={{ backgroundColor: project.color }}
                onClick={() => handleProjectSelect(project)}
              />
              {!isCollapsed && (
                <>
                  <span
                    className="text-sm font-medium flex-1 truncate cursor-pointer"
                    onClick={() => handleProjectSelect(project)}
                  >
                    {project.name}
                  </span>
                  {/* Settings button - separate from project select */}
                  <button
                    onClick={(e) => handleProjectSettings(project, e)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Project Button */}
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

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm onClose={() => setShowProjectForm(false)} />
      )}

      {/* Project Settings Modal */}
      {showProjectSettings && settingsProject && (
        <ProjectSettings
          project={settingsProject}
          onClose={() => {
            setShowProjectSettings(false);
            setSettingsProject(null);
          }}
        />
      )}
    </>
  );
}

export default Sidebar;
