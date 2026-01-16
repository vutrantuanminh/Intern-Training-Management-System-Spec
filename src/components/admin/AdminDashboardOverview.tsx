import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/AdminDashboard.css';
import { Users, BookOpen, TrendingUp } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { userService } from '../../services/userService';

interface AdminDashboardOverviewProps {
    onNavigate?: (view: string) => void;
}

export function AdminDashboardOverview({ onNavigate }: AdminDashboardOverviewProps) {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        activeCourses: 0,
        totalTrainees: 0,
        completionRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load all data in parallel
            const [coursesRes, usersRes] = await Promise.all([
                courseService.getCourses({ limit: 100 }),
                userService.getUsers({ limit: 100, isActive: true }),
            ]);

            const courses = coursesRes.data || [];
            const users = usersRes.data || [];

            const now = new Date();
            const activeCourses = courses.filter((c: any) => {
                const start = new Date(c.startDate);
                const end = new Date(c.endDate);
                return now >= start && now <= end;
            });

            // FIX: roles is array of strings like ["TRAINEE", "ADMIN"]
            const trainees = users.filter((u: any) => {
                if (Array.isArray(u.roles)) {
                    // roles can be array of strings OR array of objects
                    return u.roles.some((r: any) =>
                        typeof r === 'string' ? r === 'TRAINEE' : r.name === 'TRAINEE'
                    );
                }
                return false;
            });

            setStats({
                totalUsers: users.length,
                totalCourses: courses.length,
                activeCourses: activeCourses.length,
                totalTrainees: trainees.length,
                completionRate: 85, // TODO: Calculate from real data
            });

            // Mock recent activity (TODO: Get from backend)
            setRecentActivity([
                { action: 'New user registered', user: 'John Doe', time: '5 minutes ago', type: 'user' },
                { action: 'Course completed', user: 'Jane Smith', time: '1 hour ago', type: 'course' },
                { action: 'New course created', user: 'Admin', time: '3 hours ago', type: 'course' },
            ]);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-gray-900">Admin Dashboard</h3>
                <p className="text-gray-600 mt-1">Welcome back! Here's what's happening in your system.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('totalUsers')}
                    value={stats.totalUsers}
                    icon={<Users className="w-6 h-6" />}
                    color="blue"
                    trend="+12 this month"
                />
                <StatCard
                    title={t('activeCourses')}
                    value={stats.activeCourses}
                    icon={<BookOpen className="w-6 h-6" />}
                    color="green"
                    trend={`${stats.totalCourses} total`}
                />
                <StatCard
                    title={t('trainees')}
                    value={stats.totalTrainees}
                    icon={<Users className="w-6 h-6" />}
                    color="purple"
                    trend="Active learners"
                />
                <StatCard
                    title={t('completionRate')}
                    value={`${stats.completionRate}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="orange"
                    trend="+5% from last month"
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
                    <div className="space-y-4">
                        {recentActivity.map((activity, i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="text-gray-900 font-medium">{activity.action}</p>
                                    <p className="text-gray-600 text-sm">{activity.user} • {activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">System Status</h4>
                    <div className="space-y-4">
                        <StatusItem label="Server Status" value="Online" status="healthy" />
                        <StatusItem label="Database" value="Healthy" status="healthy" />
                        <StatusItem label="API Status" value="Active" status="healthy" />
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 text-sm">Storage Usage</span>
                                <span className="text-gray-600 text-sm">42%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full admin-storage-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, trend }: any) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <p className="text-gray-600 text-sm">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && <p className="text-green-600 text-sm mt-2">{trend}</p>}
        </div>
    );
}

function StatusItem({ label, value, status }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-700 text-sm">{label}</span>
            <span
                className={`px-2 py-1 rounded text-xs ${status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
            >
                {value}
            </span>
        </div>
    );
}

function QuickActionButton({ icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all group"
        >
            <div className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-sm font-medium text-gray-900">{label}</span>
        </button>
    );
}
