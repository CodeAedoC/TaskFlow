import { useState, useEffect, useRef } from "react";
import { useProject } from "../../context/ProjectContext";
import { authAPI } from "../../services/api";
import UserAvatar from "../Common/UserAvatar";

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

function ProjectForm({ project, onClose }) {
  const { createProject, updateProject } = useProject();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#14b8a6",
    members: [], // NEW: Members array
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        color: project.color,
        members: project.members || [],
      });
    }
  }, [project]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search users
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
          (user) => !formData.members.some((m) => m._id === user._id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("Failed to search users:", error);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, formData.members]);

  const handleAddMember = (user) => {
    setFormData({
      ...formData,
      members: [...formData.members, user],
    });
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleRemoveMember = (userId) => {
    setFormData({
      ...formData,
      members: formData.members.filter((m) => m._id !== userId),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Convert members to array of IDs for backend
      const submitData = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        memberIds: formData.members.map((m) => m._id), // Send IDs only
      };

      if (project) {
        await updateProject(project._id, submitData);
      } else {
        await createProject(submitData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {project ? "Edit Project" : "Create New Project"}
          </h2>
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

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="e.g., Website Redesign"
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
              placeholder="What is this project about?"
            />
          </div>

          {/* Color Picker */}
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

          {/* NEW: Add Members Section */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Add Team Members
              <span className="text-slate-500 text-xs font-normal ml-2">
                (optional)
              </span>
            </label>

            {/* Selected Members */}
            {formData.members.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {formData.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg"
                  >
                    <UserAvatar user={member} size="sm" showTooltip={false} />
                    <span className="text-white text-sm font-medium">
                      {member.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search users to add..."
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

              {/* Search Results Dropdown */}
              {isSearchOpen && searchQuery.length >= 2 && (
                <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm">
                      No users found
                    </div>
                  ) : (
                    <div className="py-1">
                      {searchResults.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => handleAddMember(user)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors text-left"
                        >
                          <UserAvatar
                            user={user}
                            size="sm"
                            showTooltip={false}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-slate-400 text-xs truncate">
                              {user.email}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-teal-400"
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2">
              You'll be added as project owner automatically
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : project
                ? "Update Project"
                : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;
