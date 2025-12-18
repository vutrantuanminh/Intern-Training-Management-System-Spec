import { useState } from 'react';
import { courseService } from '../../services/courseService';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateCourseModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateCourseModal({ onClose, onSuccess }: CreateCourseModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
    });

    const [subjects, setSubjects] = useState<Array<{
        title: string;
        description: string;
        tasks: Array<{ title: string; description: string }>;
    }>>([
        { title: '', description: '', tasks: [{ title: '', description: '' }] }
    ]);

    const addSubject = () => {
        setSubjects([...subjects, { title: '', description: '', tasks: [{ title: '', description: '' }] }]);
    };

    const removeSubject = (index: number) => {
        if (subjects.length > 1) {
            setSubjects(subjects.filter((_, i) => i !== index));
        }
    };

    const updateSubject = (index: number, field: string, value: string) => {
        const updated = [...subjects];
        updated[index] = { ...updated[index], [field]: value };
        setSubjects(updated);
    };

    const addTask = (subjectIndex: number) => {
        const updated = [...subjects];
        updated[subjectIndex].tasks.push({ title: '', description: '' });
        setSubjects(updated);
    };

    const removeTask = (subjectIndex: number, taskIndex: number) => {
        const updated = [...subjects];
        if (updated[subjectIndex].tasks.length > 1) {
            updated[subjectIndex].tasks = updated[subjectIndex].tasks.filter((_, i) => i !== taskIndex);
            setSubjects(updated);
        }
    };

    const updateTask = (subjectIndex: number, taskIndex: number, field: string, value: string) => {
        const updated = [...subjects];
        updated[subjectIndex].tasks[taskIndex] = {
            ...updated[subjectIndex].tasks[taskIndex],
            [field]: value
        };
        setSubjects(updated);
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Course title is required');
            return false;
        }
        if (!formData.startDate || !formData.endDate) {
            setError('Start and end dates are required');
            return false;
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            setError('End date must be after start date');
            return false;
        }
        if (subjects.length === 0) {
            setError('At least one subject is required');
            return false;
        }
        for (let i = 0; i < subjects.length; i++) {
            if (!subjects[i].title.trim()) {
                setError(`Subject ${i + 1} title is required`);
                return false;
            }
            if (subjects[i].tasks.length === 0) {
                setError(`Subject "${subjects[i].title}" must have at least one task`);
                return false;
            }
            for (let j = 0; j < subjects[i].tasks.length; j++) {
                if (!subjects[i].tasks[j].title.trim()) {
                    setError(`Task ${j + 1} in subject "${subjects[i].title}" requires a title`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const courseData = {
                title: formData.title,
                description: formData.description,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                subjects: subjects.map(subject => ({
                    title: subject.title,
                    description: subject.description,
                    tasks: subject.tasks.map(task => ({
                        title: task.title,
                        description: task.description,
                    })),
                })),
            };

            await courseService.createCourse(courseData);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
                    <h3 className="text-xl font-semibold">Create New Course</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Course Info */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Course Information</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Full Stack Web Development"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={3}
                                placeholder="Course description..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subjects */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">Subjects * (minimum 1)</h4>
                            <button
                                type="button"
                                onClick={addSubject}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                                <Plus className="w-4 h-4" />
                                Add Subject
                            </button>
                        </div>

                        {subjects.map((subject, sIndex) => (
                            <div key={sIndex} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <h5 className="font-medium text-gray-700">Subject {sIndex + 1}</h5>
                                    {subjects.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSubject(sIndex)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    value={subject.title}
                                    onChange={(e) => updateSubject(sIndex, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Subject title *"
                                    required
                                />

                                <textarea
                                    value={subject.description}
                                    onChange={(e) => updateSubject(sIndex, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    rows={2}
                                    placeholder="Subject description"
                                />

                                {/* Tasks */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">Tasks * (minimum 1)</label>
                                        <button
                                            type="button"
                                            onClick={() => addTask(sIndex)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Task
                                        </button>
                                    </div>

                                    {subject.tasks.map((task, tIndex) => (
                                        <div key={tIndex} className="bg-gray-50 p-3 rounded space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-600">Task {tIndex + 1}</span>
                                                {subject.tasks.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTask(sIndex, tIndex)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={task.title}
                                                onChange={(e) => updateTask(sIndex, tIndex, 'title', e.target.value)}
                                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                                placeholder="Task title *"
                                                required
                                            />
                                            <textarea
                                                value={task.description}
                                                onChange={(e) => updateTask(sIndex, tIndex, 'description', e.target.value)}
                                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                                rows={2}
                                                placeholder="Task description"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
