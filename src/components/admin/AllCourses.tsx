import { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import { Plus, BookOpen, Calendar, Users, Search, Eye } from 'lucide-react';
import { CreateCourseModal } from './CreateCourseModal';
import { CourseDetail } from './CourseDetail';

export function AllCourses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
    });

    useEffect(() => {
        loadCourses();
    }, [filters]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError('');

            const params: any = {};
            if (filters.search) params.search = filters.search;
            if (filters.status !== 'all') params.status = filters.status;

            const response = await courseService.getCourses(params);
            setCourses(response.data || []);
        } catch (err: any) {
            console.error('Failed to load courses:', err);
            setError(err.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseCreated = () => {
        setShowCreateModal(false);
        loadCourses();
    };

    if (loading && courses.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">All Courses</h3>
                    <p className="text-gray-600 mt-1">Manage all training courses</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4" />
                    Create Course
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Status</option>
                        <option value="NOT_STARTED">Upcoming</option>
                        <option value="IN_PROGRESS">Ongoing</option>
                        <option value="FINISHED">Completed</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Course Grid - CLICKABLE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        onClick={() => setSelectedCourse(course)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <BookOpen className="w-6 h-6 text-indigo-600" />
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Eye className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                            {course.title}
                        </h4>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {course.description || 'No description available'}
                        </p>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{course.trainees?.length || 0} trainees enrolled</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-600">{course.subjectCount || 0} subjects</span>
                            <span className="text-sm font-medium text-indigo-600 group-hover:underline">
                                View Details →
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && courses.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No courses found</p>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateCourseModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCourseCreated}
                />
            )}

            {selectedCourse && (
                <CourseDetail
                    courseId={selectedCourse.id}
                    onClose={() => setSelectedCourse(null)}
                />
            )}
        </div>
    );
}
