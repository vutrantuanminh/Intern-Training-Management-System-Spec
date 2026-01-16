import { useEffect, useState } from 'react';
import { traineeService } from '../services/traineeService';
import { courseService } from '../services/courseService';
import { reportService } from '../services/reportService';
import { useNotifications } from '../hooks/useNotifications';

export function TraineeDashboard() {
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { unreadCount } = useNotifications();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const { data } = await traineeService.getDashboard();
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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('traineeDashboard')}</h1>
                    <p className="text-gray-600 mt-2">{t('traineeDashboardDescription')}</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                    <StatCard
                        title={t('activeCourses')}
                        value={dashboard?.activeCourses || 0}
                        icon="📚"
                        color="blue"
                    />
                    <StatCard
                        title={t('averageGrade')}
                        value={dashboard?.averageGrade?.toFixed(1) || 'N/A'}
                        icon="⭐"
                        color="green"
                    />
                    <StatCard
                        title={t('completedTasks')}
                        value={dashboard?.completedTasks || 0}
                        icon="✅"
                        color="purple"
                    />
                    <StatCard
                        title={t('notifications')}
                        value={unreadCount}
                        icon="🔔"
                        color="red"
                    />
                </div>

                {/* Responsive 16:9 Content Area */}
                <div className="w-full aspect-w-16 aspect-h-9 max-h-[80vh] flex flex-col gap-4 md:gap-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 h-full">
                        {/* Recent Reports */}
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full overflow-auto min-h-0">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Recent Reports</h2>
                            <div className="space-y-2 md:space-y-4">
                                {dashboard?.recentReports?.slice(0, 5).map((report: any) => (
                                    <div key={report.id} className="border-l-4 border-blue-500 pl-2 md:pl-4 py-2">
                                        <p className="text-xs md:text-sm text-gray-600">{new Date(report.date).toLocaleDateString()}</p>
                                        <p className="text-gray-900 line-clamp-2">{report.content}</p>
                                    </div>
                                ))}
                                {(!dashboard?.recentReports || dashboard.recentReports.length === 0) && (
                                    <p className="text-gray-500 text-center py-4">No reports yet</p>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full overflow-auto min-h-0">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Upcoming Deadlines</h2>
                            <div className="space-y-2 md:space-y-4">
                                {dashboard?.upcomingDeadlines?.slice(0, 5).map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between border-b pb-3">
                                        <div>
                                            <p className="font-medium">{task.title}</p>
                                            <p className="text-xs md:text-sm text-gray-600">{task.subject}</p>
                                        </div>
                                        <span className="text-xs md:text-sm text-red-600 font-medium">
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                                {(!dashboard?.upcomingDeadlines || dashboard.upcomingDeadlines.length === 0) && (
                                    <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-4">
                        {/* Recent Grades */}
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Recent Grades</h2>
                            <div className="space-y-2 md:space-y-4">
                                {dashboard?.recentGrades?.slice(0, 5).map((grade: any) => (
                                    <div key={grade.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{grade.task?.title}</p>
                                            <p className="text-xs md:text-sm text-gray-600">{grade.task?.subject?.title}</p>
                                        </div>
                                        <span className={`text-lg font-bold ${grade.score >= 80 ? 'text-green-600' :
                                                grade.score >= 60 ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`}>
                                            {grade.score}
                                        </span>
                                    </div>
                                ))}
                                {(!dashboard?.recentGrades || dashboard.recentGrades.length === 0) && (
                                    <p className="text-gray-500 text-center py-4">No grades yet</p>
                                )}
                            </div>
                        </div>

                        {/* Progress Chart */}
                        <div className="bg-white rounded-lg shadow p-3 md:p-6 flex flex-col h-full">
                            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Overall Progress</h2>
                            <div className="space-y-2 md:space-y-4">
                                <ProgressBar
                                    label="Subjects Completed"
                                    current={dashboard?.completedSubjects || 0}
                                    total={dashboard?.totalSubjects || 1}
                                    color="blue"
                                />
                                <ProgressBar
                                    label="Tasks Completed"
                                    current={dashboard?.completedTasks || 0}
                                    total={dashboard?.totalTasks || 1}
                                    color="green"
                                />
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
    color: 'blue' | 'green' | 'purple' | 'red';
};
function StatCard({ title, value, icon, color }: StatCardProps) {
    const colorClasses: Record<StatCardProps['color'], string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600',
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

type ProgressBarProps = {
    label: string;
    current: number;
    total: number;
    color: 'blue' | 'green' | 'purple';
};
function ProgressBar({ label, current, total, color }: ProgressBarProps) {
    const percentage = Math.round((current / total) * 100);
    const colorClasses: Record<ProgressBarProps['color'], string> = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
    };
    return (
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm text-gray-600">{current}/{total}</span>
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
