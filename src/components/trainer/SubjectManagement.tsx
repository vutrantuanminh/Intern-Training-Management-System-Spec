import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/apiClient';
import { ArrowLeft, Plus, Play, StopCircle, Edit, Trash2, Loader2, X, Calendar, CheckCircle, Star } from 'lucide-react';
import { TraineeGrading } from './TraineeGrading';

interface SubjectManagementProps {
  course: any;
  onBack: () => void;
}

export function SubjectManagement({ course, onBack }: SubjectManagementProps) {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gradingSubject, setGradingSubject] = useState<any | null>(null);

  // Form states
  const [subjectForm, setSubjectForm] = useState({ title: '', description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });

  useEffect(() => {
    loadSubjects();
  }, [course.id]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(`/courses/${course.id}/subjects`);
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.title.trim()) {
      alert(t('subjectManagement.subjectTitleRequired', 'Subject title is required'));
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/courses/${course.id}/subjects`, {
        title: subjectForm.title,
        description: subjectForm.description,
        tasks: [], // Empty array, tasks will be added separately
      });
      setShowCreateSubject(false);
      setSubjectForm({ title: '', description: '' });
      loadSubjects();
    } catch (error) {
      console.error('Failed to create subject:', error);
      alert(t('subjectManagement.failedToCreateSubject', 'Failed to create subject'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSubject = async (subjectId: number) => {
    try {
      await api.post(`/subjects/${subjectId}/start`);
      loadSubjects();
    } catch (error) {
      console.error('Failed to start subject:', error);
      alert(t('subjectManagement.failedToStartSubject', 'Failed to start subject'));
    }
  };

  const handleFinishSubject = async (subjectId: number) => {
    if (!confirm(t('subjectManagement.confirmFinishSubject', 'Finish this subject? All in-progress tasks will be marked as finished.'))){
      return;
    }
    try {
      await api.post(`/subjects/${subjectId}/finish`);
      loadSubjects();
    } catch (error) {
      console.error('Failed to finish subject:', error);
      alert(t('subjectManagement.failedToFinishSubject', 'Failed to finish subject'));
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm(t('subjectManagement.confirmDeleteSubject', 'Delete this subject and all its tasks?'))){
      return;
    }
    try {
      await api.delete(`/subjects/${subjectId}`);
      loadSubjects();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      alert(t('subjectManagement.failedToDeleteSubject', 'Failed to delete subject'));
    }
  };

  const handleCreateTask = async (subjectId: number) => {
    if (!taskForm.title.trim()) {
      alert(t('subjectManagement.taskTitleRequired', 'Task title is required'));
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/subjects/${subjectId}/tasks`, {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
      });
      setShowCreateTask(null);
      setTaskForm({ title: '', description: '', dueDate: '' });
      loadSubjects();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(t('subjectManagement.failedToCreateTask', 'Failed to create task'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm(t('subjectManagement.confirmDeleteTask', 'Delete this task?'))){
      return;
    }
    try {
      await api.delete(`/tasks/${taskId}`);
      loadSubjects();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert(t('subjectManagement.failedToDeleteTask', 'Failed to delete task'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return { class: 'bg-blue-100 text-blue-700', label: t('subjectManagement.status.inProgress', 'In Progress') };
      case 'FINISHED': return { class: 'bg-green-100 text-green-700', label: t('subjectManagement.status.finished', 'Finished') };
      default: return { class: 'bg-gray-100 text-gray-700', label: t('subjectManagement.status.notStarted', 'Not Started') };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('subjectManagement.backToCourses', 'Back to Courses')}
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
            <p className="text-gray-600 mt-1">{course.description || t('subjectManagement.noDescription', 'No description')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(course.status).class}`}>
            {getStatusBadge(course.status).label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">{t('subjectManagement.subjectsAndTasks', 'Subjects & Tasks')}</h4>
        <button
          onClick={() => setShowCreateSubject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('subjectManagement.addSubject', 'Add Subject')}
        </button>
      </div>

      <div className="space-y-4">
        {subjects.map((subject) => {
          const status = getStatusBadge(subject.status);
          return (
            <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">{subject.title}</h5>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {subject.status === 'NOT_STARTED' && (
                      <button
                        onClick={() => handleStartSubject(subject.id)}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title={t('subjectManagement.startSubject')}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {subject.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleFinishSubject(subject.id)}
                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title={t('subjectManagement.finishSubject')}
                      >
                        <StopCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setGradingSubject(subject)}
                      className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                      title={t('subjectManagement.gradeTrainees')}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      title={t('subjectManagement.deleteSubject')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{subject.description || t('subjectManagement.noDescription', 'No description')}</p>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 font-medium">{t('subjectManagement.tasks', 'Tasks')} ({subject.tasks?.length || 0})</span>
                    <button
                      onClick={() => {
                        setShowCreateTask(subject.id);
                        setTaskForm({ title: '', description: '', dueDate: '' });
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {t('subjectManagement.addTask', 'Add Task')}
                    </button>
                  </div>

                  {subject.tasks?.length > 0 ? (
                    <div className="space-y-2">
                      {subject.tasks.map((task: any, index: number) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-sm">#{index + 1}</span>
                            <div>
                              <div className="font-medium text-gray-900">{task.title}</div>
                              {task.description && (
                                <div className="text-gray-600 text-sm">{task.description}</div>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {t('subjectManagement.noTasks', 'No tasks added yet')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">{t('subjectManagement.noSubjects', 'No subjects added yet')}</p>
          <p className="text-gray-400 text-sm">{t('subjectManagement.createFirstSubject', 'Create your first subject to get started')}</p>
        </div>
      )}

      {/* Create Subject Modal */}
      {showCreateSubject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold">{t('subjectManagement.createNewSubject', 'Create New Subject')}</h4>
              <button onClick={() => setShowCreateSubject(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t('subjectManagement.subjectTitle', 'Title *')}</label>
                <input
                  type="text"
                  value={subjectForm.title}
                  onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('subjectManagement.subjectTitlePlaceholder', 'Enter subject title')}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t('subjectManagement.subjectDescription', 'Description')}</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder={t('subjectManagement.subjectDescriptionPlaceholder', 'Enter subject description')}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCreateSubject(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('subjectManagement.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleCreateSubject}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t('subjectManagement.createSubject', 'Create Subject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold">{t('subjectManagement.createNewTask', 'Create New Task')}</h4>
              <button onClick={() => setShowCreateTask(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t('subjectManagement.taskTitle', 'Title *')}</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('subjectManagement.taskTitlePlaceholder', 'Enter task title')}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t('subjectManagement.taskDescription', 'Description')}</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder={t('subjectManagement.taskDescriptionPlaceholder', 'Enter task description')}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t('subjectManagement.taskDueDate', 'Due Date')}</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCreateTask(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('subjectManagement.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => handleCreateTask(showCreateTask)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t('subjectManagement.createTask', 'Create Task')}
              </button>
            </div>
          </div>
        </div>
      )}

      {gradingSubject && (
        <TraineeGrading
          subjectId={gradingSubject.id}
          subjectTitle={gradingSubject.title}
          onClose={() => setGradingSubject(null)}
        />
      )}
    </div>
  );
}
