import { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";
import socketService from "../services/socket";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ADDED: Load user on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Connect socket when user is set
  useEffect(() => {
    if (user) {
      if (!socketService.socket?.connected) {
        socketService.connect(user._id);
      }
    } else {
      socketService.disconnect();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      socketService.connect(response.data._id);
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      socketService.connect(response.data.user.id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      socketService.connect(response.data.user.id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    socketService.disconnect();
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
