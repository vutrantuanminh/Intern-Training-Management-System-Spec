import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { auth } from '../config/api';
import { api } from '../lib/apiClient';
import { GraduationCap, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const primeCsrf = async () => {
      try {
        const response: any = await authService.getCsrfToken();
        const token = response?.data?.csrfToken || response?.csrfToken;
        if (token) {
          api.setCsrfToken(token);
        }
      } catch (err) {
        console.error('Failed to prime CSRF token', err);
      }
    };
    primeCsrf();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await authService.login({ email, password });
      const data = response.data || response;

      auth.setToken(data.accessToken);
      auth.setRefreshToken(data.refreshToken);

      const role = data.user?.roles?.[0]?.toLowerCase() || 'trainee';
      onLogin({
        id: data.user.id.toString(),
        name: data.user.fullName,
        email: data.user.email,
        role: role as any,
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-72 h-72 bg-pink-400/25 rounded-full blur-3xl top-10 left-10"></div>
        <div className="absolute w-80 h-80 bg-blue-400/25 rounded-full blur-3xl top-20 right-20"></div>
        <div className="absolute w-96 h-96 bg-purple-400/25 rounded-full blur-3xl bottom-10 left-1/3"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="bg-white/10 backdrop-blur-2xl p-10 border border-white/20"
          style={{ borderRadius: '32px' }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div
              className="w-20 h-20 bg-white/15 backdrop-blur flex items-center justify-center"
              style={{ borderRadius: '24px' }}
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1
            className="text-3xl font-semibold text-white text-center mb-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Welcome Back
          </h1>
          <p className="text-white/60 text-center text-sm mb-10">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                style={{ borderRadius: '16px', fontSize: '15px' }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                style={{ borderRadius: '16px', fontSize: '15px' }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div
                className="bg-red-500/20 text-white text-sm p-4 border border-red-400/30"
                style={{ borderRadius: '16px' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-4 font-semibold hover:from-amber-500 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
              style={{ borderRadius: '16px', fontSize: '16px' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-8">
            © 2024 Training Management System
          </p>
        </div>
      </div>
    </div>
  );
}