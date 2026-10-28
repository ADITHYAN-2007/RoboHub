import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext.js';
import type { UserRole } from '../../types/index.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide institutional email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.pass);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-950/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ROBO LAB HUB</h1>
          <p className="mt-1 text-xs text-slate-400">
            Centralized Robotics Laboratory Management System
          </p>
        </div>

        <div className="mt-8 bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Institutional Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="netid@robolab.edu"
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors shadow-md shadow-cyan-950"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Laboratory</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill reviewer helper */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Reviewer Quick-Access (Pre-seeded Accounts)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleQuickFill(r)}
                  className="text-left p-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
                >
                  <div className="text-[10px] font-mono text-cyan-400 font-semibold">{r}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {DEMO_CREDENTIALS[r].title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            <span>New engineering student? </span>
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Register Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
