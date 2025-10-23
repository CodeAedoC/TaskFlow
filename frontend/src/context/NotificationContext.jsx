import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { notificationsAPI } from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasInitialFetch = useRef(false);
  const listenerAttached = useRef(false);
  const processedNotifications = useRef(new Set()); // Track processed notifications

  const fetchNotifications = useCallback(
    async (force = false) => {
      if (!user || !user._id) return;

      if (hasInitialFetch.current && !force) return;

      try {
        setLoading(true);
        const response = await notificationsAPI.getNotifications();
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
        hasInitialFetch.current = true;

        // Mark all as processed
        processedNotifications.current = new Set(
          response.data.notifications.map((n) => n._id)
        );
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Initial fetch
  useEffect(() => {
    if (user && user._id && !hasInitialFetch.current) {
      console.log("📥 Fetching notifications for user:", user._id);
      fetchNotifications(true);
    }
  }, [user, fetchNotifications]);

  // Socket listener - FIXED with better duplicate prevention
  useEffect(() => {
    const userId = user?._id || user?.id;

    if (!user || !userId || !socketService.socket) {
      console.log("⏳ Waiting for user data before attaching listener...");
      return;
    }

    if (listenerAttached.current) {
      console.log("⚠️ Listener already attached, skipping");
      return;
    }

    const handleNewNotification = (data) => {
      console.log("🔔 Raw notification data received:", data);
      const currentUserId = userId.toString();
      console.log("👤 Current user ID:", currentUserId);
      console.log("📬 Recipient ID:", data.recipientId);

      const recipientId = data.recipientId.toString();

      if (recipientId === currentUserId) {
        console.log("✅ Notification is for current user!");

        // Check if already processed
        if (processedNotifications.current.has(data.notification._id)) {
          console.log("⚠️ Notification already processed, skipping");
          return;
        }

        // Mark as processed
        processedNotifications.current.add(data.notification._id);

        setNotifications((prev) => {
          const exists = prev.find((n) => n._id === data.notification._id);
          if (exists) {
            console.log("⚠️ Duplicate notification in state, skipping");
            return prev;
          }
          console.log("➕ Adding notification to list");
          return [data.notification, ...prev];
        });

        setUnreadCount((prev) => {
          console.log(
            "📊 Incrementing unread count from",
            prev,
            "to",
            prev + 1
          );
          return prev + 1;
        });

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(data.notification.title, {
            body: data.notification.message,
            icon: "/favicon.ico",
          });
        }
      } else {
        console.log("❌ Notification not for current user, ignoring");
      }
    };

    console.log("🎧 Attaching notification listener for user:", userId);

    // Remove existing listener
    socketService.socket.off("notification:new");

    // Add new listener
    socketService.socket.on("notification:new", handleNewNotification);
    listenerAttached.current = true;

    console.log("✅ Notification listener attached successfully");

    return () => {
      console.log("🧹 Cleaning up notification listener");
      socketService.socket?.off("notification:new", handleNewNotification);
      listenerAttached.current = false;
    };
  }, [user]);

  // Reset on user change
  useEffect(() => {
    if (!user) {
      hasInitialFetch.current = false;
      listenerAttached.current = false;
      processedNotifications.current.clear();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const notification = notifications.find((n) => n._id === id);

      if (notification && !notification.isRead) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        await notificationsAPI.markAsRead(id);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await notificationsAPI.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchNotifications(true);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const notification = notifications.find((n) => n._id === id);

      setNotifications((prev) => prev.filter((n) => n._id !== id));

      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Remove from processed set
      processedNotifications.current.delete(id);

      try {
        await notificationsAPI.deleteNotification(id);
      } catch (deleteError) {
        if (deleteError.response?.status !== 404) {
          throw deleteError;
        }
        console.log("⚠️ Notification already deleted from backend");
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      if (error.response?.status !== 404) {
        fetchNotifications(true);
      }
    }
  };

  const clearRead = async () => {
    try {
      setNotifications((prev) => prev.filter((n) => !n.isRead));

      await notificationsAPI.clearRead();
    } catch (error) {
      console.error("Failed to clear read notifications:", error);
      fetchNotifications(true);
    }
  };

  const refreshNotifications = () => {
    hasInitialFetch.current = false;
    fetchNotifications(true);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
