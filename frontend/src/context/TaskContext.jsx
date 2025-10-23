import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { tasksAPI, projectsAPI } from "../services/api";
import socketService from "../services/socket";

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTask must be used within TaskProvider");
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [projectStatistics, setProjectStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    project: "",
    assignedUser: "",
  });

  const listenersAttached = useRef(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);

      // Build clean filters (remove empty values)
      const cleanFilters = {};
      if (filters.status) cleanFilters.status = filters.status;
      if (filters.priority) cleanFilters.priority = filters.priority;
      if (filters.search) cleanFilters.search = filters.search;
      if (filters.project) cleanFilters.project = filters.project;
      if (filters.assignedUser)
        cleanFilters.assignedUser = filters.assignedUser;

      console.log("🔍 Fetching tasks with filters:", cleanFilters);

      const response = await tasksAPI.getTasks(cleanFilters);
      console.log("✅ Received", response.data.length, "tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStatistics = async () => {
    try {
      const response = await tasksAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error("Failed to fetch statistics");
    }
  };

  const fetchProjectStatistics = useCallback(async (projectId) => {
    if (!projectId) {
      setProjectStatistics(null);
      return;
    }

    try {
      const response = await projectsAPI.getProjectStatistics(projectId);
      setProjectStatistics(response.data);
    } catch (error) {
      console.error("Failed to fetch project statistics");
    }
  }, []);

  const fetchFilteredStatistics = useCallback(async () => {
    if (!filters.project && !filters.assignedUser) {
      return;
    }

    try {
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "completed").length;
      const inProgress = tasks.filter((t) => t.status === "in-progress").length;
      const pending = tasks.filter((t) => t.status === "pending").length;

      const filteredStats = {
        total,
        byStatus: { completed, inProgress, pending },
      };

      if (filters.project) {
        setProjectStatistics(filteredStats);
      } else {
        setStatistics(filteredStats);
      }
    } catch (error) {
      console.error("Failed to calculate filtered statistics");
    }
  }, [tasks, filters.project, filters.assignedUser]);

  useEffect(() => {
    fetchTasks();

    if (!filters.assignedUser) {
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      } else {
        setProjectStatistics(null);
      }
    }
  }, [
    fetchTasks,
    fetchProjectStatistics,
    filters.project,
    filters.assignedUser,
  ]);

  useEffect(() => {
    if (filters.assignedUser) {
      fetchFilteredStatistics();
    }
  }, [tasks, filters.assignedUser, fetchFilteredStatistics]);

  // FIXED: Socket listeners with proper cleanup
  useEffect(() => {
    if (!socketService.socket || listenersAttached.current) {
      return;
    }

    console.log("🎧 Attaching task socket listeners");

    const handleTaskCreated = (task) => {
      console.log("📥 Task created via socket:", task._id);
      setTasks((prev) => {
        // Prevent duplicates
        const exists = prev.find((t) => t._id === task._id);
        if (exists) {
          console.log("⚠️ Duplicate task prevented");
          return prev;
        }
        return [task, ...prev];
      });
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      console.log("📝 Task updated via socket:", updatedTask._id);
      setTasks((prev) =>
        prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
    };

    const handleTaskDeleted = (taskId) => {
      console.log("🗑️ Task deleted via socket:", taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
    };

    // Remove any existing listeners first
    socketService.socket.off("task:created");
    socketService.socket.off("task:updated");
    socketService.socket.off("task:deleted");

    // Add new listeners
    socketService.socket.on("task:created", handleTaskCreated);
    socketService.socket.on("task:updated", handleTaskUpdated);
    socketService.socket.on("task:deleted", handleTaskDeleted);

    listenersAttached.current = true;
    console.log("✅ Task socket listeners attached");

    return () => {
      console.log("🧹 Cleaning up task socket listeners");
      socketService.socket?.off("task:created", handleTaskCreated);
      socketService.socket?.off("task:updated", handleTaskUpdated);
      socketService.socket?.off("task:deleted", handleTaskDeleted);
      listenersAttached.current = false;
    };
  }, [filters.project, fetchProjectStatistics]);

  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.createTask(taskData);

      // Add to local state immediately
      setTasks((prev) => {
        // Check if already exists (shouldn't, but just in case)
        const exists = prev.find((t) => t._id === response.data._id);
        if (exists) return prev;
        return [response.data, ...prev];
      });

      // Emit to socket for other users
      socketService.emitTaskCreated(response.data);

      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const response = await tasksAPI.updateTask(id, taskData);
      setTasks((prev) =>
        prev.map((task) => (task._id === id ? response.data : task))
      );
      socketService.emitTaskUpdated(response.data);
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      await tasksAPI.deleteTask(id);
      setTasks((prev) => prev.filter((task) => task._id !== id));
      socketService.emitTaskDeleted(id);
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        statistics,
        projectStatistics,
        loading,
        filters,
        setFilters,
        createTask,
        updateTask,
        deleteTask,
        refreshTasks: fetchTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
