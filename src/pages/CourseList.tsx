import { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';
import { useIsMobile } from '../hooks/useResponsive';
import { useTranslation } from 'react-i18next';

export function CourseList() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        page: 1,
        limit: 10,
    });
    const isMobile = useIsMobile();
    const { t } = useTranslation();

    useEffect(() => {
        loadCourses();
    }, [filters]);

    const loadCourses = async () => {
        try {
            const { data } = await courseService.getCourses(filters);
            setCourses(data);
        } catch (error) {
            console.error('Failed to load courses:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">{t('loading')}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('courses')}</h1>
                        <p className="text-gray-600 mt-2">{t('browseAndManageTrainingCourses')}</p>
                    </div>
                    <button className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <span>+</span>
                        <span>{t('newCourse')}</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder={t('searchCoursesPlaceholder')}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="px-4 py-2 border rounded-lg"
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2 border rounded-lg"
                        >
                            <option value="all">{t('allCourses')}</option>
                            <option value="NOT_STARTED">{t('upcoming')}</option>
                            <option value="IN_PROGRESS">{t('ongoing')}</option>
                            <option value="FINISHED">{t('completed')}</option>
                        </select>
                    </div>
                </div>

                {/* Course Grid */}
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>

                {courses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">{t('noCoursesFound')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function CourseCard({ course }: { course: any }) {
    const getStatusColor = () => {
        const now = new Date();
        const start = new Date(course.startDate);
        const end = new Date(course.endDate);

        if (now < start) return 'bg-blue-100 text-blue-800';
        if (now > end) return 'bg-gray-100 text-gray-800';
        return 'bg-green-100 text-green-800';
    };

    const { t } = useTranslation();
    const getStatusText = () => {
        const now = new Date();
        const start = new Date(course.startDate);
        const end = new Date(course.endDate);

        if (now < start) return t('upcoming');
        if (now > end) return t('completed');
        return t('ongoing');
    };

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📅</span>
                        <span>{new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📚</span>
                        <span>{course.subjectCount || 0} {t('subjects')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">👥</span>
                        <span>{course.trainees?.length || 0} {t('trainees')}</span>
                    </div>
                </div>

                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {t('viewDetails')}
                </button>
            </div>
        </div>
    );
}
