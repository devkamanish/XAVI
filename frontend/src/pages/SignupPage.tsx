import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success("Account created! Welcome to XAVI");
      navigate("/settings?tab=create");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Real-time incident collaboration",
    "Role-based access control",
    "Automated activity timelines",
    "Multi-organization support",
  ];

  return (
    <div className="min-h-screen flex bg-surface">
      {}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-primary-900 via-primary-800 to-[#1a1040] items-center justify-center p-16 relative overflow-hidden">
        {}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-primary-600/20 -top-32 -left-32 blur-3xl" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary-400/15 bottom-0 right-0 blur-3xl" />

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
            Join XAVI
            <span className="block text-primary-300 text-2xl font-semibold mt-2">Start in minutes</span>
          </h1>
          <p className="text-primary-200/80 text-lg leading-relaxed mb-10">
            Create your account and start managing incidents with your team. Set up your organization in minutes.
          </p>

          {}
          <div className="space-y-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-primary-200/90">
                <div className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-primary-300" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
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
            <h2 className="text-3xl font-black text-white tracking-tight">Create your account</h2>
            <p className="text-slate-400 mt-2 text-base">Start managing incidents like a pro</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-base input-with-icon"
                />
              </div>
            </div>

            {}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  id="signup-email"
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
              <label htmlFor="signup-password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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
              {password.length > 0 && password.length < 6 && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {}
            <div className="pt-2">
              <button
                id="signup-btn"
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
