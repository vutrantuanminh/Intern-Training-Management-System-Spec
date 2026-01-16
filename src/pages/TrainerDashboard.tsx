import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trainerService } from '../services/trainerService';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/TrainerDashboard.css';

export function TrainerDashboard() {
    const { t } = useTranslation();
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { unreadCount } = useNotifications();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await trainerService.getDashboard();
            // If response is unknown, assert type or fallback
            const data = (response as any).data;
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
        <div className="min-h-screen bg-gray-50 p-2 md:p-6 flex flex-col items-center overflow-x-hidden">
            <div className="w-full max-w-7xl flex flex-col gap-6">
                {/* Header */}
                <div className="mb-4 md:mb-8 px-2 md:px-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('trainerDashboard')}</h1>
                    <p className="text-gray-600 mt-2">{t('trainerDashboardDescription')}</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                    <StatCard
                        title={t('assignedCourses')}
                        value={dashboard?.assignedCourses || 0}
                        icon="📚"
                        color="blue"
                    />
                    <StatCard
                        title={t('totalTrainees')}
                        value={dashboard?.totalTrainees || 0}
                        icon="👥"
                        color="green"
                    />
                    <StatCard
                        title={t('pendingGrades')}
                        value={dashboard?.pendingGrades || 0}
                        icon="📝"
                        color="yellow"
                    />
                    <StatCard
                        title={t('openPRs')}
                        value={dashboard?.openPullRequests || 0}
                        icon="🔍"
                        color="purple"
                    />
                </div>

                {/* Responsive 16:9 Content Area */}
                <div className="w-full aspect-w-16 aspect-h-9 max-h-[80vh] flex flex-col gap-4 md:gap-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 h-full">
                        {/* Tasks to Grade */}
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full overflow-auto min-h-0">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Tasks to Grade</h2>
                            <div className="space-y-2 md:space-y-4">
                                {dashboard?.tasksToGrade?.slice(0, 5).map((task: any) => (
                                    <div key={`${task.taskId}-${task.traineeId}`} className="border-l-4 border-yellow-500 pl-2 md:pl-4 py-2">
                                        <p className="font-medium">{task.taskName}</p>
                                        <p className="text-xs md:text-sm text-gray-600">{task.traineeName}</p>
                                        <p className="text-xs text-gray-500">{task.courseName}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Completed: {new Date(task.completedAt).toLocaleDateString()}
                                        </p>
                                        <button className="mt-2 text-xs md:text-sm text-blue-600 hover:underline">
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
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full overflow-auto min-h-0">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Recent Pull Requests</h2>
                            <div className="space-y-2 md:space-y-4">
                                {dashboard?.recentPullRequests?.slice(0, 5).map((pr: any) => (
                                    <div key={pr.id} className="border rounded-lg p-2 md:p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{pr.title}</p>
                                                <p className="text-xs md:text-sm text-gray-600 mt-1">{pr.trainee.fullName}</p>
                                                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${pr.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                                                        pr.status === 'MERGED' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {pr.status}
                                                </span>
                                            </div>
                                            <button className="text-xs md:text-sm text-blue-600 hover:underline">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-4">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-2 md:gap-4">
                                <ActionButton icon="📝" label="Grade Tasks" />
                                <ActionButton icon="🔍" label="Review PRs" />
                                <ActionButton icon="👥" label="View Trainees" />
                                <ActionButton icon="📊" label="View Reports" />
                            </div>
                        </div>

                        {/* Trainee Progress Summary */}
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Trainee Performance</h2>
                            <div className="space-y-2 md:space-y-3">
                                <PerformanceBar label="Excellent (80-100)" count={12} total={50} color="green" />
                                <PerformanceBar label="Good (60-79)" count={28} total={50} color="blue" />
                                <PerformanceBar label="Needs Improvement (<60)" count={10} total={50} color="red" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

type StatCardProps = {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'purple';
};
function StatCard({ title, value, icon, color }: StatCardProps) {
    const colorClasses: Record<StatCardProps['color'], string> = {
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

type PerformanceBarProps = {
    label: string;
    count: number;
    total: number;
    color: 'green' | 'blue' | 'red';
};
function PerformanceBar({ label, count, total, color }: PerformanceBarProps) {
    const percentage = (count / total) * 100;
    const colorClasses: Record<PerformanceBarProps['color'], string> = {
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
            <div className="trainer-progress-bar-bg">
                <div
                    className={`trainer-progress-bar ${colorClasses[color]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
