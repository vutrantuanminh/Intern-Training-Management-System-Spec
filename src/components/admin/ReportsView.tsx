import { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { userService } from '../../services/userService';
import { BarChart3, FileText, TrendingUp, Users, BookOpen } from 'lucide-react';

export function ReportsView() {
    const [stats, setStats] = useState({
        totalTrainees: 0,
        activeCourses: 0,
        totalCourses: 0,
        totalUsers: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRealData();
    }, []);

    const loadRealData = async () => {
        try {
            const [coursesRes, usersRes, traineesRes] = await Promise.all([
                courseService.getCourses({ limit: 100 }),
                userService.getUsers({ limit: 100 }),
                userService.getUsers({ limit: 100, role: 'TRAINEE' }),
            ]);

            setStats({
                totalTrainees: traineesRes.pagination?.total || traineesRes.data.length,
                activeCourses: coursesRes.data.filter((c: any) => {
                    const now = new Date();
                    return new Date(c.startDate) <= now && new Date(c.endDate) >= now;
                }).length,
                totalCourses: coursesRes.pagination?.total || coursesRes.data.length,
                totalUsers: usersRes.pagination?.total || usersRes.data.length,
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
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
                <h3 className="text-2xl font-bold">Reports & Analytics</h3>
                <p className="text-gray-600 mt-1">View detailed reports and analytics</p>
            </div>

            {/* Summary Cards - REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Total Trainees</span>
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalTrainees}</div>
                    <div className="text-blue-600 text-sm mt-1">Currently enrolled</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Active Courses</span>
                        <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.activeCourses}</div>
                    <div className="text-gray-600 text-sm mt-1">of {stats.totalCourses} total</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Total Users</span>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                    <div className="text-green-600 text-sm mt-1">System-wide</div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Avg. Progress</span>
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.activeCourses > 0 ? Math.round((stats.activeCourses / stats.totalCourses) * 100) : 0}%
                    </div>
                    <div className="text-gray-600 text-sm mt-1">Course activity</div>
                </div>
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">Quick Stats</h4>
                        <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                        <StatRow label="Total Trainees" value={stats.totalTrainees} />
                        <StatRow label="Total Courses" value={stats.totalCourses} />
                        <StatRow label="Active Courses" value={stats.activeCourses} />
                        <StatRow label="All Users" value={stats.totalUsers} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">System Overview</h4>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-gray-700">Trainee Enrollment Rate</span>
                            <span className="font-bold text-indigo-600">
                                {stats.totalCourses > 0
                                    ? Math.round((stats.totalTrainees / stats.totalCourses) * 10) / 10
                                    : 0} per course
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="text-gray-700">Course Activity</span>
                            <span className="font-bold text-green-600">
                                {stats.totalCourses > 0
                                    ? Math.round((stats.activeCourses / stats.totalCourses) * 100)
                                    : 0}% Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
            <span className="text-gray-700">{label}</span>
            <span className="font-bold text-gray-900">{value}</span>
        </div>
    );
}
