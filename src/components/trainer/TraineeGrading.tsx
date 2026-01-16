import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/apiClient';
import { User, Loader2, Star, Check, X } from 'lucide-react';

interface TraineeGradingProps {
    subjectId: number;
    subjectTitle: string;
    onClose: () => void;
}

interface TraineeProgress {
    id: number;
    fullName: string;
    email: string;
    status: string;
    grade?: number;
    feedback?: string;
    tasksCompleted: number;
    totalTasks: number;
}


export function TraineeGrading({ subjectId, subjectTitle, onClose }: TraineeGradingProps) {
    const { t } = useTranslation();
    const [trainees, setTrainees] = useState<TraineeProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTrainee, setEditingTrainee] = useState<number | null>(null);
    const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadTrainees();
    }, [subjectId]);

    const loadTrainees = async () => {
        try {
            setLoading(true);
            const response: any = await api.get(`/subjects/${subjectId}/trainees`);
            setTrainees(response.data || []);
        } catch (error) {
            console.error('Failed to load trainees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = async (traineeId: number) => {

        if (!gradeForm.grade) {
            alert(t('traineeGrading.enterGrade', 'Please enter a grade'));
            return;
        }

        const grade = parseFloat(gradeForm.grade);
        if (isNaN(grade) || grade < 0 || grade > 100) {
            alert(t('traineeGrading.gradeRange', 'Grade must be between 0 and 100'));
            return;
        }

        setSubmitting(true);
        try {
            await api.put(`/subjects/${subjectId}/trainees/${traineeId}/grade`, {
                grade,
                feedback: gradeForm.feedback || undefined,
            });
            setEditingTrainee(null);
            setGradeForm({ grade: '', feedback: '' });
            loadTrainees();
        } catch (error) {
            console.error('Failed to grade trainee:', error);
            alert(t('traineeGrading.failedToSaveGrade', 'Failed to save grade'));
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FINISHED': return 'bg-green-100 text-green-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-semibold">{t('traineeGrading.title', 'Grade Trainees')}</h4>
                        <p className="text-gray-600 text-sm">{subjectTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                    ) : trainees.length > 0 ? (
                        <div className="space-y-4">
                            {trainees.map((trainee) => (
                                <div key={trainee.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-gray-900">{trainee.fullName}</h5>
                                                <p className="text-gray-500 text-sm">{trainee.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-sm ${getStatusColor(trainee.status)}`}>
                                                {t(`traineeGrading.status.${trainee.status.toLowerCase()}`, trainee.status.replace('_', ' '))}
                                            </span>
                                            <span className="text-gray-600 text-sm">
                                                {trainee.tasksCompleted}/{trainee.totalTasks} {t('traineeGrading.tasks', 'tasks')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {trainee.grade !== null && trainee.grade !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-5 h-5 text-yellow-500" />
                                                    <span className="font-semibold text-lg">{trainee.grade}%</span>
                                                </div>
                                            )}
                                            {trainee.feedback && (
                                                <p className="text-gray-600 text-sm italic">"{trainee.feedback}"</p>
                                            )}
                                        </div>

                                        {editingTrainee === trainee.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    placeholder={t('traineeGrading.gradePlaceholder', '0-100')}
                                                    min="0"
                                                    max="100"
                                                    value={gradeForm.grade}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={t('traineeGrading.feedbackOptional', 'Feedback (optional)')}
                                                    value={gradeForm.feedback}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <button
                                                    onClick={() => handleGrade(trainee.id)}
                                                    disabled={submitting}
                                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingTrainee(null);
                                                        setGradeForm({ grade: '', feedback: '' });
                                                    }}
                                                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingTrainee(trainee.id);
                                                    setGradeForm({
                                                        grade: trainee.grade?.toString() || '',
                                                        feedback: trainee.feedback || '',
                                                    });
                                                }}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                            >
                                                {trainee.grade !== null && trainee.grade !== undefined ? t('traineeGrading.editGrade', 'Edit Grade') : t('traineeGrading.grade', 'Grade')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            {t('traineeGrading.noTrainees', 'No trainees enrolled in this subject')}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        {t('traineeGrading.close', 'Close')}
                    </button>
                </div>
            </div>
        </div>
    )};
