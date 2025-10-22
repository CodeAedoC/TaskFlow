import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { tasksAPI } from "../services/api";
import socketService from "../services/socket";
import { toast } from "react-toastify";

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
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
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

  useEffect(() => {
    fetchTasks();
    fetchStatistics();
  }, [fetchTasks]);

  // Real-time updates
  useEffect(() => {
    socketService.onTaskCreated((task) => {
      setTasks((prev) => [task, ...prev]);
      fetchStatistics();
    });

    socketService.onTaskUpdated((updatedTask) => {
      setTasks((prev) =>
        prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
      fetchStatistics();
    });

    socketService.onTaskDeleted((taskId) => {
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      fetchStatistics();
    });
  }, []);

  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.createTask(taskData);
      setTasks((prev) => [response.data, ...prev]);
      socketService.emitTaskCreated(response.data);
      fetchStatistics();
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
    } catch (error) {
      throw error;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        statistics,
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
