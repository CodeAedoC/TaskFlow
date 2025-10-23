import { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { projectsAPI, authAPI } from "../../services/api";
import UserAvatar from "../Common/UserAvatar";

function ProjectSettings({ project, onClose }) {
  const { updateProject, deleteProject } = useProject();
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#14b8a6",
  });
  const [members, setMembers] = useState([]);
  const [projectOwner, setProjectOwner] = useState(null); // NEW
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(true); // NEW
  const [error, setError] = useState("");

  // Fetch full project data with populated members
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!project) return;

      setFetchingMembers(true);
      try {
        const response = await projectsAPI.getProject(project._id);
        const projectData = response.data.project;

        setFormData({
          name: projectData.name,
          description: projectData.description || "",
          color: projectData.color,
        });
        setMembers(projectData.members || []);
        setProjectOwner(projectData.owner);
      } catch (error) {
        console.error("Failed to fetch project details:", error);
        setError("Failed to load project members");
      } finally {
        setFetchingMembers(false);
      }
    };

    fetchProjectDetails();
  }, [project]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await authAPI.searchUsers(searchQuery);
        // Filter out already added members
        const filtered = response.data.filter(
          (user) => !members.some((m) => m._id === user._id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("Failed to search users:", error);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, members]);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await updateProject(project._id, formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (user) => {
    try {
      const response = await projectsAPI.addMember(project._id, user._id);
      setMembers(response.data.members);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the project?")) return;

    try {
      const response = await projectsAPI.removeMember(project._id, userId);
      setMembers(response.data.members);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        "Delete this project? All tasks will remain but lose project association."
      )
    )
      return;

    try {
      await deleteProject(project._id);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete project");
    }
  };

  const COLORS = [
    { value: "#14b8a6", name: "Teal" },
    { value: "#3b82f6", name: "Blue" },
    { value: "#8b5cf6", name: "Purple" },
    { value: "#ec4899", name: "Pink" },
    { value: "#f59e0b", name: "Amber" },
    { value: "#10b981", name: "Emerald" },
    { value: "#ef4444", name: "Red" },
    { value: "#6366f1", name: "Indigo" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">Project Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "general"
                ? "text-teal-400 border-b-2 border-teal-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "members"
                ? "text-teal-400 border-b-2 border-teal-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Members ({members.length})
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "general" ? (
            <form onSubmit={handleUpdateProject} className="space-y-5">
              {/* Project Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Project Color
                </label>
                <div className="grid grid-cols-8 gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color: color.value })
                      }
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formData.color === color.value
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg transition-colors border border-red-500/20"
                >
                  Delete Project
                </button>
                <div className="flex-1"></div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Add Member */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Add Member
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full px-4 py-3 pl-10 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
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

                {/* Search Results */}
                {searchQuery.length >= 2 && searchResults.length > 0 && (
                  <div className="mt-2 bg-slate-800 border border-slate-700 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleAddMember(user)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <UserAvatar user={user} size="sm" showTooltip={false} />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {user.name}
                          </p>
                          <p className="text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Project Members
                </h3>

                {fetchingMembers ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-800/30 rounded-lg animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-slate-700 rounded w-48"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">
                      No members in this project yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar user={member} size="md" />
                          <div>
                            <p className="text-white text-sm font-medium">
                              {member.name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {member.email}
                            </p>
                          </div>
                          {projectOwner && member._id === projectOwner._id && (
                            <span className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded text-teal-400 text-xs font-medium">
                              Owner
                            </span>
                          )}
                        </div>
                        {projectOwner && member._id !== projectOwner._id && (
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
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
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectSettings;