import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminLogin } from "../services/authService";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(email, password);

      if (res.success) {
        login(res.data);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(res.message || "Login failed");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left Panel */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-red-500 to-red-800 flex-col items-center justify-center relative overflow-hidden p-8">
        <div className="text-center text-white z-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl font-extrabold text-white mx-auto mb-6 border-2 border-white/30">
            🎬
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">MovieMind</h1>
          <p className="mt-2 text-lg text-red-100">Admin Panel</p>
        </div>
        {/* floating shapes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-12 -left-20 w-72 h-72 rounded-full bg-white/10 animate-pulse" />
          <div className="absolute bottom-20 -right-10 w-48 h-48 rounded-full bg-white/10 animate-pulse" />
          <div className="absolute -bottom-8 left-1/3 w-36 h-36 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="md:hidden text-center mb-8">
            <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">🎬</div>
            <h1 className="text-2xl font-bold text-gray-900">MovieMind</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-1 text-gray-500">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@moviemind.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold text-base hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center min-h-[48px] mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
