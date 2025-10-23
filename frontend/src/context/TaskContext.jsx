import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
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
    assignedUser: "", // CHANGED from createdBy
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks(filters);
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

  // NEW: Fetch filtered statistics
  const fetchFilteredStatistics = useCallback(async () => {
    if (!filters.project && !filters.assignedUser) {
      return;
    }

    try {
      // Calculate statistics from filtered tasks
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

    // Fetch base statistics
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

  // Update statistics when tasks or filters change
  useEffect(() => {
    if (filters.assignedUser) {
      fetchFilteredStatistics();
    }
  }, [tasks, filters.assignedUser, fetchFilteredStatistics]);

  useEffect(() => {
    socketService.onTaskCreated((task) => {
      setTasks((prev) => [task, ...prev]);
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
    });

    socketService.onTaskUpdated((updatedTask) => {
      setTasks((prev) =>
        prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
    });

    socketService.onTaskDeleted((taskId) => {
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      fetchStatistics();
      if (filters.project) {
        fetchProjectStatistics(filters.project);
      }
    });
  }, [filters.project, fetchProjectStatistics]);

  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.createTask(taskData);
      setTasks((prev) => [response.data, ...prev]);
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
