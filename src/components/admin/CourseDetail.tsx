import { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import {
    X, Calendar, Users, BookOpen, Edit, Trash2,
    Plus, ChevronDown, ChevronRight, UserMinus, Search, Loader2
} from 'lucide-react';
import { api } from '../../lib/apiClient';

interface CourseDetailProps {
    courseId: number;
    onClose: () => void;
}

interface Trainee {
    id: number;
    fullName: string;
    email: string;
    status: string;
}

export function CourseDetail({ courseId, onClose }: CourseDetailProps) {
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());

    // Trainee management state
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [availableTrainees, setAvailableTrainees] = useState<any[]>([]);
    const [showAddTrainee, setShowAddTrainee] = useState(false);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrainees, setSelectedTrainees] = useState<number[]>([]);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        try {
            const { data } = await courseService.getCourseById(courseId);
            setCourse(data);

            // Extract trainees data
            setTrainees(data.trainees?.map((ct: any) => ({
                id: ct.id || ct.trainee?.id,
                fullName: ct.fullName || ct.trainee?.fullName,
                email: ct.email || ct.trainee?.email,
                status: ct.status,
            })) || []);
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

    const loadAvailableTrainees = async () => {
        setLoadingAvailable(true);
        try {
            const response: any = await api.get('/supervisor/trainees');
            const allTrainees = response.data || [];
            // Filter out already enrolled
            const enrolledIds = trainees.map(t => t.id);
            setAvailableTrainees(allTrainees.filter((t: any) => !enrolledIds.includes(t.id)));
        } catch (error) {
            console.error('Failed to load available trainees:', error);
        } finally {
            setLoadingAvailable(false);
        }
    };

    const handleAddTrainees = async () => {
        if (selectedTrainees.length === 0) return;

        setAdding(true);
        try {
            await api.post(`/courses/${courseId}/trainees`, {
                traineeIds: selectedTrainees,
            });
            await loadCourse();
            setShowAddTrainee(false);
            setSelectedTrainees([]);
        } catch (error) {
            console.error('Failed to add trainees:', error);
            alert('Failed to add trainees. Please try again.');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveTrainee = async (traineeId: number) => {
        if (!confirm('Are you sure you want to remove this trainee from the course?')) return;

        try {
            await api.delete(`/courses/${courseId}/trainees/${traineeId}`);
            setTrainees(trainees.filter(t => t.id !== traineeId));
        } catch (error) {
            console.error('Failed to remove trainee:', error);
            alert('Failed to remove trainee. Please try again.');
        }
    };

    const getTraineeStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'bg-green-100 text-green-700';
            case 'PASS': return 'bg-blue-100 text-blue-700';
            case 'FAIL': return 'bg-red-100 text-red-700';
            case 'RESIGN': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredAvailable = availableTrainees.filter(t =>
        t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
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

                        {/* Trainees Management */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5 text-orange-600" />
                                    Enrolled Trainees ({trainees.length})
                                </h4>
                                <button
                                    onClick={() => {
                                        setShowAddTrainee(true);
                                        loadAvailableTrainees();
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Trainee
                                </button>
                            </div>

                            {trainees.length > 0 ? (
                                <div className="space-y-2">
                                    {trainees.map((trainee) => (
                                        <div key={trainee.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-medium">
                                                    {trainee.fullName?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{trainee.fullName}</div>
                                                    <div className="text-gray-600 text-sm">{trainee.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded text-sm ${getTraineeStatusBadge(trainee.status)}`}>
                                                    {trainee.status}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveTrainee(trainee.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Remove trainee"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No trainees enrolled yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Course not found</p>
                    </div>
                )}
            </div>

            {/* Add Trainee Modal */}
            {showAddTrainee && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-lg font-semibold">Add Trainees to Course</h4>
                            <p className="text-gray-600 text-sm mt-1">Select trainees to enroll in this course</p>
                        </div>

                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search trainees by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 max-h-80 overflow-y-auto">
                            {loadingAvailable ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                </div>
                            ) : filteredAvailable.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredAvailable.map((trainee) => (
                                        <label
                                            key={trainee.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedTrainees.includes(trainee.id)
                                                ? 'bg-indigo-50 border-2 border-indigo-200'
                                                : 'hover:bg-gray-50 border-2 border-transparent'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTrainees.includes(trainee.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTrainees([...selectedTrainees, trainee.id]);
                                                    } else {
                                                        setSelectedTrainees(selectedTrainees.filter(id => id !== trainee.id));
                                                    }
                                                }}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                                                {trainee.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{trainee.fullName}</div>
                                                <div className="text-gray-600 text-sm">{trainee.email}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No available trainees to add
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAddTrainee(false);
                                    setSelectedTrainees([]);
                                    setSearchTerm('');
                                }}
                                disabled={adding}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddTrainees}
                                disabled={selectedTrainees.length === 0 || adding}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                                Add {selectedTrainees.length > 0 ? `(${selectedTrainees.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
