import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const EmailVerification = () => {
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        if (!token) {
          setStatus("error");
          setError("Verification token is missing");
          return;
        }

        console.log("Sending verification request with token:", token);
        const response = await api.post("/auth/verify-email", { token });
        console.log("Verification response:", response.data);

        if (response.data.success) {
          setStatus("success");

          // Set token and redirect after a short delay
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${response.data.token}`;
          }

          setTimeout(() => {
            navigate("/login", {
              state: { message: "Email verified successfully. Please log in." },
            });
          }, 3000);
        } else {
          setStatus("error");
          setError(response.data.message);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setError(err.response?.data?.message || "Verification failed");
      }
    };

    verifyEmail();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
        {status === "verifying" && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Verifying your email
            </h2>
            <p className="text-slate-400">Please wait a moment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Email Verified!
            </h2>
            <p className="text-slate-400">Redirecting you to login...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-400"
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
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
