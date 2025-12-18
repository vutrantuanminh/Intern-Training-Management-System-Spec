import { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import {
    X, Calendar, Users, BookOpen, Edit, Trash2,
    Plus, ChevronDown, ChevronRight
} from 'lucide-react';

interface CourseDetailProps {
    courseId: number;
    onClose: () => void;
}

export function CourseDetail({ courseId, onClose }: CourseDetailProps) {
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        try {
            const { data } = await courseService.getCourseById(courseId);
            setCourse(data);
        } catch (error) {
            console.error('Failed to load course:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (subjectId: number) => {
        const newExpanded = new Set(expandedSubjects);
        if (newExpanded.has(subjectId)) {
            newExpanded.delete(subjectId);
        } else {
            newExpanded.add(subjectId);
        }
        setExpandedSubjects(newExpanded);
    };

    const getStatusBadge = () => {
        if (!course) return null;
        const now = new Date();
        const start = new Date(course.startDate);
        const end = new Date(course.endDate);

        if (now < start) {
            return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Upcoming</span>;
        }
        if (now > end) {
            return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Completed</span>;
        }
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Ongoing</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900">Course Details</h2>
                        {getStatusBadge()}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : course ? (
                    <div className="p-6 space-y-6">
                        {/* Course Info */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h3>
                            <p className="text-gray-600">{course.description}</p>
                        </div>

                        {/* Course Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Duration</p>
                                        <p className="font-medium text-sm">
                                            {new Date(course.startDate).toLocaleDateString()} -{' '}
                                            {new Date(course.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Subjects</p>
                                        <p className="font-medium">{course.subjects?.length || 0} Subjects</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Trainees</p>
                                        <p className="font-medium">{course.trainees?.length || 0} Enrolled</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subjects List */}
                        <div>
                            <h4 className="font-semibold text-lg mb-4">Course Content</h4>
                            <div className="space-y-3">
                                {course.subjects?.map((subject: any) => (
                                    <div key={subject.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                            onClick={() => toggleSubject(subject.id)}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                {expandedSubjects.has(subject.id) ? (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                )}
                                                <div>
                                                    <h5 className="font-medium text-gray-900">{subject.title}</h5>
                                                    {subject.description && (
                                                        <p className="text-sm text-gray-600">{subject.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-600">{subject.tasks?.length || 0} tasks</span>
                                        </div>

                                        {expandedSubjects.has(subject.id) && (
                                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                <div className="space-y-2">
                                                    {subject.tasks?.map((task: any, index: number) => (
                                                        <div
                                                            key={task.id}
                                                            className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{task.title}</p>
                                                                    {task.description && (
                                                                        <p className="text-sm text-gray-600">{task.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!subject.tasks || subject.tasks.length === 0) && (
                                                        <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {(!course.subjects || course.subjects.length === 0) && (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">No subjects yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Course not found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
