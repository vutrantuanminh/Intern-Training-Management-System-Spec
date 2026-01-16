import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { config } from '../../config/api';
import { Github, Check } from 'lucide-react';

export function GitHubSettings() {
  const [status, setStatus] = useState<{ connected: boolean; githubUsername: string | null }>({ connected: false, githubUsername: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    
    // Check for connection success/error in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_connected') === 'true') {
      loadStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadStatus = async () => {
    try {
      type StatusResponse = { connected: boolean; githubUsername: string | null };
      const response = await api.get<StatusResponse>('/auth/github/status');
      // If the API returns { data: ... }, use response.data, else use response directly
      if (response && typeof response === 'object' && 'connected' in response) {
        setStatus(response as StatusResponse);
      } else if (response && typeof response === 'object' && 'data' in response) {
        setStatus((response as any).data as StatusResponse);
      } else {
        setStatus({ connected: false, githubUsername: null });
      }
    } catch (error) {
      console.error('Failed to load GitHub status:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = () => {
    // Use full backend URL for OAuth redirect with JWT token
    const backendUrl = config.apiUrl.replace('/api', '');
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      alert('Please login first');
      return;
    }
    
    const githubUrl = `${backendUrl}/api/auth/github?token=${encodeURIComponent(token)}`;
    console.log('Connecting to GitHub:', githubUrl);
    window.location.href = githubUrl;
  };

  const disconnectGitHub = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) return;
    
    try {
      await api.post('/auth/github/disconnect');
      setStatus({ connected: false, githubUsername: null });
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
      alert('Failed to disconnect GitHub account');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Github className="w-6 h-6" />
        <h3 className="text-lg font-semibold">GitHub Integration</h3>
      </div>

      {status.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-green-900">Connected</div>
              <div className="text-sm text-green-700">@{status.githubUsername}</div>
            </div>
          </div>

          <button
            onClick={disconnectGitHub}
            className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
          >
            Disconnect GitHub
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-3">
              Connect your GitHub account to submit pull requests and receive automated feedback.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Submit code directly from GitHub</li>
              <li>Automatic PR tracking</li>
              <li>Real-time notifications from trainers</li>
            </ul>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Button clicked!');
              connectGitHub();
            }}
            type="button"
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 9999 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer"
          >
            <Github className="w-5 h-5" />
            Connect GitHub Account
          </button>
        </div>
      )}
    </div>
  );
}
