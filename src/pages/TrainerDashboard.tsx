import { useEffect, useState } from 'react';
import { trainerService } from '../services/trainerService';
import { useNotifications } from '../hooks/useNotifications';

export function TrainerDashboard() {
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { unreadCount } = useNotifications();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const { data } = await trainerService.getDashboard();
            setDashboard(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Trainer Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your courses and review trainee submissions.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Assigned Courses"
                        value={dashboard?.assignedCourses || 0}
                        icon="📚"
                        color="blue"
                    />
                    <StatCard
                        title="Total Trainees"
                        value={dashboard?.totalTrainees || 0}
                        icon="👥"
                        color="green"
                    />
                    <StatCard
                        title="Pending Grades"
                        value={dashboard?.pendingGrades || 0}
                        icon="📝"
                        color="yellow"
                    />
                    <StatCard
                        title="Open PRs"
                        value={dashboard?.openPullRequests || 0}
                        icon="🔍"
                        color="purple"
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tasks to Grade */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Tasks to Grade</h2>
                        <div className="space-y-4">
                            {dashboard?.tasksToGrade?.slice(0, 5).map((task: any) => (
                                <div key={`${task.taskId}-${task.traineeId}`} className="border-l-4 border-yellow-500 pl-4 py-2">
                                    <p className="font-medium">{task.taskName}</p>
                                    <p className="text-sm text-gray-600">{task.traineeName}</p>
                                    <p className="text-xs text-gray-500">{task.courseName}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Completed: {new Date(task.completedAt).toLocaleDateString()}
                                    </p>
                                    <button className="mt-2 text-sm text-blue-600 hover:underline">
                                        Grade Now →
                                    </button>
                                </div>
                            ))}
                            {(!dashboard?.tasksToGrade || dashboard.tasksToGrade.length === 0) && (
                                <p className="text-gray-500 text-center py-4">No tasks to grade</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Pull Requests */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Recent Pull Requests</h2>
                        <div className="space-y-4">
                            {dashboard?.recentPullRequests?.slice(0, 5).map((pr: any) => (
                                <div key={pr.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium">{pr.title}</p>
                                            <p className="text-sm text-gray-600 mt-1">{pr.trainee.fullName}</p>
                                            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${pr.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                                                    pr.status === 'MERGED' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {pr.status}
                                            </span>
                                        </div>
                                        <button className="text-sm text-blue-600 hover:underline">
                                            Review →
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!dashboard?.recentPullRequests || dashboard.recentPullRequests.length === 0) && (
                                <p className="text-gray-500 text-center py-4">No pull requests</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <ActionButton icon="📝" label="Grade Tasks" />
                            <ActionButton icon="🔍" label="Review PRs" />
                            <ActionButton icon="👥" label="View Trainees" />
                            <ActionButton icon="📊" label="View Reports" />
                        </div>
                    </div>

                    {/* Trainee Progress Summary */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Trainee Performance</h2>
                        <div className="space-y-3">
                            <PerformanceBar label="Excellent (80-100)" count={12} total={50} color="green" />
                            <PerformanceBar label="Good (60-79)" count={28} total={50} color="blue" />
                            <PerformanceBar label="Needs Improvement (<60)" count={10} total={50} color="red" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-2xl mb-4`}>
                {icon}
            </div>
            <p className="text-gray-600 text-sm">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
    return (
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-3xl mb-2">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}

function PerformanceBar({ label, count, total, color }: any) {
    const percentage = (count / total) * 100;
    const colorClasses = {
        green: 'bg-green-600',
        blue: 'bg-blue-600',
        red: 'bg-red-600',
    };

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-sm">{label}</span>
                <span className="text-sm font-medium">{count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${colorClasses[color]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
