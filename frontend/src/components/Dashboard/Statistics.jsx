import { useProject } from "../../context/ProjectContext";
import { useTask } from "../../context/TaskContext";

function Statistics({ statistics, projectStatistics }) {
  const { selectedProject } = useProject();
  const { filters } = useTask();

  // Use project statistics if project is selected, otherwise global statistics
  const stats = selectedProject ? projectStatistics : statistics;

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-800 rounded w-20 mb-4"></div>
            <div className="h-8 bg-slate-800 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  // Check if filters are active
  const hasFilters =
    filters.status ||
    filters.priority ||
    filters.assignedUser ||
    filters.search;

  const statItems = [
    {
      label: selectedProject ? "Project Tasks" : "Total Tasks",
      value: stats.total,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Completed",
      value: stats.byStatus.completed,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      gradient: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      label: "In Progress",
      value: stats.byStatus.inProgress,
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      gradient: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      iconColor: "text-yellow-400",
    },
    {
      label: "Pending",
      value: stats.byStatus.pending,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      gradient: "from-slate-500 to-slate-600",
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-500/20",
      iconColor: "text-slate-400",
    },
  ];

  return (
    <div className="mb-8">
      {/* Filter indicator */}
      {hasFilters && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>Showing filtered results</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 group animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}
              >
                <svg
                  className={`w-6 h-6 ${stat.iconColor}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={stat.icon}
                  />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Statistics;
