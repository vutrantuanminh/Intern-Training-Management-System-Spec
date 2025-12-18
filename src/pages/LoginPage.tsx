import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, Loader2 } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden flex items-center justify-center"
            style={{
                background: 'linear-gradient(135deg, #ff00cc 0%, #6600ff 50%, #00ccff 100%)',
                fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            {/* Floating Orbs - Nhiều layer, animate chậm */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 bg-pink-500/40 rounded-full blur-3xl top-0 left-0 animate-pulse slow"></div>
                <div className="absolute w-80 h-80 bg-purple-500/50 rounded-full blur-3xl top-20 right-10 animate-pulse delay-1000"></div>
                <div className="absolute w-96 h-96 bg-blue-500/40 rounded-full blur-3xl bottom-0 left-20 animate-pulse delay-500"></div>
                <div className="absolute w-64 h-64 bg-cyan-400/50 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-1500"></div>
                <div className="absolute w-72 h-72 bg-pink-400/40 rounded-full blur-3xl bottom-10 right-20 animate-pulse"></div>
            </div>

            {/* Glass Card - Blur cực mạnh, bg mờ hơn */}
            <div className="relative w-full max-w-md z-10">
                <div
                    className="bg-white/4 backdrop-blur-3xl rounded-3xl p-12 border border-white/20"
                    style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-10">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                            <GraduationCap className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <h2 className="text-4xl font-extrabold text-white text-center mb-4 tracking-wider">
                        Training Management System
                    </h2>
                    <p className="text-white/80 text-center text-lg font-semibold mb-12">Sign in to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-0 py-5 bg-transparent border-b-2 border-white/40 text-white text-xl font-medium placeholder-white/60 focus:outline-none focus:border-yellow-400 transition-all duration-500 peer"
                                placeholder="Email"
                                required
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 peer-focus:w-full transition-all duration-700"></div>
                        </div>

                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-0 py-5 bg-transparent border-b-2 border-white/40 text-white text-xl font-medium placeholder-white/60 focus:outline-none focus:border-yellow-400 transition-all duration-500 peer"
                                placeholder="Password"
                                required
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 peer-focus:w-full transition-all duration-700"></div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 text-white text-base font-medium p-5 rounded-2xl border border-red-400/40 backdrop-blur-md">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-5 rounded-full font-bold text-xl tracking-wide hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-4 shadow-2xl"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-7 h-7 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center text-white/60 text-sm font-medium">
                        <p>Default credentials:</p>
                        <p className="mt-2">admin@system.com / admin123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}