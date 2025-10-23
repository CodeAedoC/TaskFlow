import { useState, useEffect } from "react";
import { useTask } from "../../context/TaskContext";
import { useProject } from "../../context/ProjectContext";
import { projectsAPI } from "../../services/api";

function TaskFilter() {
  const { filters, setFilters } = useTask();
  const { selectedProject } = useProject();
  const [projectMembers, setProjectMembers] = useState([]);

  // Fetch project members when project changes
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!selectedProject) {
        setProjectMembers([]);
        return;
      }

      try {
        const response = await projectsAPI.getProject(selectedProject._id);
        setProjectMembers(response.data.project.members || []);
      } catch (error) {
        console.error("Failed to fetch project members:", error);
      }
    };

    fetchProjectMembers();
  }, [selectedProject]);

  // Reset assignedUser filter when project changes
  useEffect(() => {
    if (filters.assignedUser) {
      setFilters({ ...filters, assignedUser: "" });
    }
  }, [selectedProject]);

  return (
    <div className="flex flex-wrap gap-3">
      {/* Status Filter */}
      <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      {/* Priority Filter */}
      <select
        value={filters.priority}
        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
      >
        <option value="">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {/* UPDATED: Assigned User Filter with email */}
      {selectedProject && projectMembers.length > 0 && (
        <select
          value={filters.assignedUser}
          onChange={(e) =>
            setFilters({ ...filters, assignedUser: e.target.value })
          }
          className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-300 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all min-w-[200px]"
        >
          <option value="">All Members</option>
          {projectMembers.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>
      )}

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search tasks..."
          className="w-full px-4 py-2 pl-10 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-500 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}

export default TaskFilter;
