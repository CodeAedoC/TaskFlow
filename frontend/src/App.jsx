import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { TaskProvider } from "./context/TaskContext";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard/Dashboard";
import PrivateRoute from "./components/Layout/PrivateRoute";
import VerifyEmailNotice from "./components/Auth/VerifyEmailNotice";
import EmailVerification from "./components/Auth/EmailVerification";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
          <Route path="/verify-email" element={<EmailVerification />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <NotificationProvider>
                  <ProjectProvider>
                    <TaskProvider>
                      <Dashboard />
                    </TaskProvider>
                  </ProjectProvider>
                </NotificationProvider>
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </Router>
  );
}

export default App;
