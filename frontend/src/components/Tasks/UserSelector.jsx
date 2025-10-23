import { useState, useEffect, useRef } from "react";
import { projectsAPI } from "../../services/api";
import UserAvatar from "../Common/UserAvatar";

function UserSelector({ selectedUsers = [], onChange, projectId }) {
  const [projectMembers, setProjectMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch project members when projectId changes
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId) {
        setProjectMembers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await projectsAPI.getProject(projectId);
        setProjectMembers(response.data.project.members || []);
      } catch (error) {
        console.error("Failed to fetch project members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectMembers();
  }, [projectId]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMembers(projectMembers);
      return;
    }

    const filtered = projectMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchQuery, projectMembers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddUser = (user) => {
    if (!selectedUsers.find((u) => u._id === user._id)) {
      onChange([...selectedUsers, user]);
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleRemoveUser = (userId) => {
    onChange(selectedUsers.filter((u) => u._id !== userId));
  };

  // Don't show if no project selected
  if (!projectId) {
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Assign To
        </label>
        <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-400 text-sm">
            ⚠️ Select a project first to assign team members
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-slate-300 mb-2">
        Assign To
        <span className="text-slate-500 text-xs font-normal ml-2">
          ({projectMembers.length} project member
          {projectMembers.length !== 1 ? "s" : ""})
        </span>
      </label>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-sm group relative"
              title={user.email} // ADDED: Show email on hover
            >
              <UserAvatar user={user} size="sm" showTooltip={false} />
              <div className="flex flex-col">
                <span className="text-white text-sm">{user.name}</span>
                <span className="text-slate-400 text-xs">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveUser(user._id)}
                className="text-slate-400 hover:text-red-400 transition-colors ml-2"
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
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search project members..."
          className="w-full px-4 py-2.5 pl-10 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
          disabled={projectMembers.length === 0}
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

      {/* No members warning */}
      {projectMembers.length === 0 && (
        <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          This project has no members. Add members in project settings.
        </p>
      )}

      {/* Search Results Dropdown */}
      {isOpen && projectMembers.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-400">
              Loading members...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No members found matching "{searchQuery}"
            </div>
          ) : (
            <div className="py-1">
              {filteredMembers.map((user) => {
                const isSelected = selectedUsers.find(
                  (u) => u._id === user._id
                );
                return (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleAddUser(user)}
                    disabled={isSelected}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserAvatar user={user} size="sm" showTooltip={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-slate-400 text-xs truncate">
                        {user.email}
                      </p>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-teal-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserSelector;
