import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, Eye, EyeOff, Zap, Clock, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: Zap, label: "Faster Resolution", value: "50%" },
    { icon: Clock, label: "Uptime SLA", value: "99.9%" },
    { icon: Users, label: "Active Teams", value: "Real-time" },
  ];

  return (
    <div className="min-h-screen flex bg-surface">
      {}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-primary-900 via-primary-800 to-[#1a1040] items-center justify-center p-16 relative overflow-hidden">
        {}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-primary-600/20 -top-32 -left-32 blur-3xl" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary-400/15 bottom-0 right-0 blur-3xl" />
        <div className="absolute w-[200px] h-[200px] rounded-full bg-indigo-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl" />

        {}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 max-w-sm w-full">
          {}
          <div className="animate-float mb-10">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-black text-white mb-4 tracking-tight leading-[1.1]">
            XAVI
            <span className="block text-primary-300 text-3xl font-semibold mt-1">Platform</span>
          </h1>
          <p className="text-primary-200/80 text-lg leading-relaxed mb-12">
            Multi-tenant incident management for modern engineering teams. Track, resolve, and collaborate in real-time.
          </p>

          {}
          <div className="space-y-3">
            {stats.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 hover:bg-white/12 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/30 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-none">{value}</p>
                  <p className="text-primary-300/80 text-sm mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[400px] animate-slideUp">
          {}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">XAVI</h1>
          </div>

          {}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome back</h2>
            <p className="text-slate-400 mt-2 text-base">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input-base input-with-icon"
                />
              </div>
            </div>

            {}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base input-with-icon input-with-icon-right"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {}
            <div className="pt-2">
              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
