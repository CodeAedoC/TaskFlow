import { useState } from "react";

function UserAvatar({ user, size = "md", showTooltip = true }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!user || !user.name) {
    return null;
  }

  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  // Generate initials (first letter of first name + first letter of last name)
  const getInitials = (name) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => showTooltip && setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Avatar */}
      <div
        className={`${sizes[size]} bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-slate-900 hover:scale-110 transition-transform cursor-pointer shadow-lg`}
      >
        {getInitials(user.name)}
      </div>

      {/* Enhanced Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 animate-fade-in pointer-events-none">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-3 min-w-[220px]">
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-slate-800"></div>
            </div>

            {/* Content */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{user.name}</p>
                <p
                  className="text-slate-400 text-xs truncate"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-3 border-t border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg
                  className="w-3.5 h-3.5 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg
                  className="w-3.5 h-3.5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Team Member</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserAvatar;
