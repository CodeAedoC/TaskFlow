import { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { useTask } from "../../context/TaskContext";
import ProjectForm from "../Projects/ProjectForm";
import ProjectSettings from "../Projects/ProjectSettings";

function Sidebar() {
  const { projects, selectedProject, setSelectedProject } = useProject();
  const { setFilters, filters } = useTask();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [settingsProject, setSettingsProject] = useState(null);

  // Handle project selection
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setFilters({
      ...filters,
      project: project._id,
      assignedUser: "", // Clear user filter when switching projects
    });
  };

  // Handle "All Tasks" click
  const handleAllTasksClick = () => {
    setSelectedProject(null);
    setFilters({
      status: "",
      priority: "",
      search: filters.search || "", // Keep search
      project: "", // Clear project filter
      assignedUser: "", // Clear user filter
    });
  };

  const handleProjectSettings = (e, project) => {
    e.stopPropagation();
    setSettingsProject(project);
    setShowProjectSettings(true);
  };

  return (
    <>
      <aside className="w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-800 flex-shrink-0 overflow-y-auto">
        <div className="p-6">
          {/* All Tasks */}
          <button
            onClick={handleAllTasksClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              !selectedProject
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
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
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span className="font-medium">All Tasks</span>
          </button>

          {/* Projects Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Projects
              </h2>
              <button
                onClick={() => setShowProjectForm(true)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-teal-400 transition-colors"
                title="Create new project"
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
              </button>
            </div>

            {/* Project List */}
            <div className="space-y-1">
              {projects.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">
                  No projects yet
                </p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project._id}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer group ${
                      selectedProject?._id === project._id
                        ? "bg-slate-800/70 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <button
                      onClick={() => handleProjectClick(project)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-medium truncate">
                        {project.name}
                      </span>
                    </button>

                    <button
                      onClick={(e) => handleProjectSettings(e, project)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
                      title="Project settings"
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Modals */}
      {showProjectForm && (
        <ProjectForm onClose={() => setShowProjectForm(false)} />
      )}

      {showProjectSettings && (
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
