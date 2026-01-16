import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Login.css';
import { authService } from '../services/authService';
import { auth } from '../config/api';
import { api } from '../lib/apiClient';
import { GraduationCap, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
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
      setError(err.message || t('loginFailedDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 login-bg"
    >
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb-pink"></div>
        <div className="floating-orb-blue"></div>
        <div className="floating-orb-purple"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="login-card">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="login-logo">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1
            className="text-3xl font-semibold text-white text-center mb-2 login-title"
          >
            {t('welcomeBack')}
          </h1>
          <p className="text-white/60 text-center text-sm mb-10">{t('signInToYourAccount')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all login-input"
                placeholder={t('emailPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all login-input"
                placeholder={t('passwordPlaceholder')}
                required
              />
            </div>

            {error && (
              <div
                className="bg-red-500/20 text-white text-sm p-4 border border-red-400/30 login-error-box"
              >
                {t(error) || error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-4 font-semibold hover:from-amber-500 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl login-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('signingIn')}
                </>
              ) : (
                t('signIn')
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-8">
            © 2024 {t('systemTitle')}
          </p>
        </div>
      </div>
    </div>
  );
}
