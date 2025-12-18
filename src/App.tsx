import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { TrainerDashboard } from './components/TrainerDashboard';
import { TraineeDashboard } from './components/TraineeDashboard';
import { auth } from './config/api';
import { api } from './lib/apiClient';
import { Loader2 } from 'lucide-react';

export type UserRole = 'admin' | 'supervisor' | 'trainer' | 'trainee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Storage keys
const USER_KEY = 'currentUser';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = () => {
      try {
        const token = auth.getToken();
        const savedUser = localStorage.getItem(USER_KEY);

        if (token && savedUser) {
          // Trust localStorage user if token exists
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        auth.clearTokens();
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Save user to localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    auth.clearTokens();
    localStorage.removeItem(USER_KEY);
  };

  // Show loading while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      {currentUser.role === 'admin' && (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === 'supervisor' && (
        <SupervisorDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === 'trainer' && (
        <TrainerDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === 'trainee' && (
        <TraineeDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
