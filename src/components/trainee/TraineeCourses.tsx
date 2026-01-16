import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Upload, X, Loader2, BookOpen, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/apiClient';
import { config } from '../../config/api';
import '../../styles/TraineeCourses.css';

interface TraineeCoursesProps {
  traineeId: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  traineeStatus: string;
  subjects: Subject[];
}


interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  dueDate?: string;
}

interface Subject {
  id: number;
  title: string;
  description: string;
  status: string;
  grade?: number;
  feedback?: string;
  tasks: Task[];
}


function TraineeCourses({ traineeId }: TraineeCoursesProps) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/trainee/progress');
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (selectedCourse && selectedSubject) {
    return (
      <SubjectDetail
        subject={selectedSubject}
        onBack={() => setSelectedSubject(null)}
        onTaskComplete={loadCourses}
      />
    );
  }

  if (selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
        onSubjectSelect={(subject) => setSelectedSubject(subject)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{t('traineeCourses.title', 'My Courses')}</h3>
        <p className="text-gray-600 mt-1">{t('traineeCourses.subtitle', 'View your enrolled courses and progress')}</p>
      </div>

      {courses.length > 0 ? (
        <div className="trainee-courses-grid">
          {courses.map((course) => {
            // Calculate based on tasks, not subjects
            let totalTasks = 0;
            let completedTasks = 0;
            course.subjects.forEach(subject => {
              subject.tasks.forEach(task => {
                totalTasks++;
                if (task.status === 'COMPLETED') {
                  completedTasks++;
                }
              });
            });
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <div key={course.id} className="trainee-course-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900">{course.title}</h4>
                      <p className="text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm">{t('traineeCourses.overallProgress', 'Overall Progress')}</span>
                      <span className="text-gray-900 text-sm font-medium">
                        {completedTasks}/{totalTasks} {t('traineeCourses.tasks', 'tasks')}
                      </span>
                    </div>
                    <div className="trainee-courses-progress-bar-bg">
                      <div
                        className="trainee-courses-progress-bar"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-gray-600 text-sm mt-1">{Math.round(progress)}% {t('traineeCourses.complete', 'complete')}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-sm ${course.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      course.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {t(`traineeCourses.status.${course.status.toLowerCase()}`, course.status.replace('_', ' '))}
                    </span>
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {t('traineeCourses.viewDetails', 'View Details')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('traineeCourses.noCourses', 'You are not enrolled in any courses yet')}</p>
        </div>
      )}
    </div>
  );
}

export { TraineeCourses };

type CourseDetailProps = {
  course: Course;
  onBack: () => void;
  onSubjectSelect: (subject: Subject) => void;
};

function CourseDetail({ course, onBack, onSubjectSelect }: CourseDetailProps) {
  const { t } = useTranslation();

  // Hàm mở trang quản lý cài đặt GitHub App
  const handleManageInstallation = () => {
    const installationId = localStorage.getItem('github_installation_id');
    if (!installationId) {
      alert(t('traineeCourses.noGitHubInstallation'));
      return;
    }
    window.open(`https://github.com/settings/installations/${installationId}`, '_blank');
  };
  const [linkedRepos, setLinkedRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [members, setMembers] = useState<{ trainees: any[]; trainers: any[] } | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [tab, setTab] = useState<'subjects' | 'members'>('subjects');

  useEffect(() => {
    loadMembers();
  }, [course.id]);

  const traineeId = localStorage.getItem('trainee_id');

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const response: any = await api.get(`/courses/${course.id}`);
      setMembers({
        trainees: response.data?.trainees || [],
        trainers: response.data?.trainers || [],
      });
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Link My Repo button now opens GitHub installation page if installationId exists
  const installationId = localStorage.getItem('github_installation_id');
  const handleLinkMyRepo = () => {
    if (!installationId) {
      alert(t('traineeCourses.noGitHubInstallation'));
      return;
    }
    window.open(`https://github.com/settings/installations/${installationId}`, '_blank');
  };
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('traineeCourses.backToCourses')}
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
        <p className="text-gray-600">{course.description}</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b mb-2">
        <button
          className={`px-4 py-2 font-medium border-b-2 ${tab === 'subjects' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('subjects')}
        >
          {t('traineeCourses.subjects')}
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 ${tab === 'members' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('members')}
        >
          {t('traineeCourses.members')}
        </button>
      </div>

      {tab === 'subjects' && (
        <>
          {/* Linked Repositories Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('traineeCourses.subjectsCount', { count: course.subjects.length })}</h4>
            <div className="space-y-3">
              {course.subjects.map((subject, index) => {
                const completedTasks = subject.tasks.filter(t => t.status === 'COMPLETED').length;
                const taskProgress = subject.tasks.length > 0
                  ? (completedTasks / subject.tasks.length) * 100
                  : 0;

                return (
                  <div key={subject.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gray-500 font-medium">{t('traineeCourses.itemNumber', { index: index + 1 })}</span>
                          <h5 className="font-semibold text-gray-900">{subject.title}</h5>
                          <span className={`px-2 py-1 rounded text-sm ${subject.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                            subject.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {subject.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{subject.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>{t('traineeCourses.tasksCompleted', { completed: completedTasks, total: subject.tasks.length })}</span>
                          {subject.grade !== undefined && subject.grade !== null && (
                            <span className="text-indigo-600 font-medium">{t('traineeCourses.grade', { grade: subject.grade })}</span>
                          )}
                        </div>

                        <div className="trainee-courses-task-progress-bar-bg">
                          <div
                            className="trainee-courses-task-progress-bar"
                            style={{ width: `${taskProgress}%` }}
                          />
                        </div>

                        {subject.feedback && (
                          <div className="p-3 bg-blue-50 rounded-lg mb-3">
                            <div className="text-gray-700 text-sm font-medium mb-1">{t('traineeCourses.trainerFeedback')}</div>
                            <p className="text-gray-600 text-sm">{subject.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onSubjectSelect(subject)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                    >
                      {t('traineeCourses.viewTasks')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'members' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('traineeCourses.courseMembers')}</h4>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : members ? (
            <>
              <div className="mb-6">
                <h5 className="font-semibold text-indigo-700 mb-2">{t('traineeCourses.trainers')}</h5>
                <div className="flex flex-wrap gap-4">
                  {members.trainers.length === 0 && <span className="text-gray-400">{t('traineeCourses.noTrainers')}</span>}
                  {members.trainers.map(trainer => (
                    <div key={trainer.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <img src={trainer.avatar || undefined} alt={trainer.fullName} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                      <div>
                        <div className="font-medium text-gray-900">{trainer.fullName}</div>
                        <div className="text-gray-500 text-sm">{trainer.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-indigo-700 mb-2">{t('traineeCourses.trainees')}</h5>
                <div className="flex flex-wrap gap-4">
                  {members.trainees.length === 0 && <span className="text-gray-400">{t('traineeCourses.noTrainees')}</span>}
                  {members.trainees.map(trainee => (
                    <div key={trainee.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <img src={trainee.avatar || undefined} alt={trainee.fullName} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                      <div>
                        <div className="font-medium text-gray-900">{trainee.fullName}</div>
                        <div className="text-gray-500 text-sm">{trainee.email}</div>
                        <div className="text-xs text-gray-400">{t('traineeCourses.statusLabel', { status: trainee.status })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-400">{t('traineeCourses.noMemberData')}</div>
          )}
        </div>
      )}
    </div>
  );
}

function SubjectDetail({ subject, onBack, onTaskComplete }: {
  subject: Subject;
  onBack: () => void;
  onTaskComplete: () => void;
}) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState(subject.tasks);
  const [completingTask, setCompletingTask] = useState<number | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<number | null>(null);

  const handleCompleteTask = async (taskId: number) => {
    setCompletingTask(taskId);
    try {
      await api.post(`/tasks/${taskId}/complete`);
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: 'COMPLETED' } : t
      ));
      onTaskComplete();
    } catch (error) {
      console.error(t('traineeCourses.failedCompleteTask'), error);
      alert(t('traineeCourses.failedMarkComplete'));
    } finally {
      setCompletingTask(null);
    }
  };

  const handleUncompleteTask = async (taskId: number) => {
    setCompletingTask(taskId);
    try {
      await api.post(`/tasks/${taskId}/uncomplete`);
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: 'NOT_STARTED' } : t
      ));
      onTaskComplete();
    } catch (error) {
      console.error(t('traineeCourses.failedUncompleteTask'), error);
    } finally {
      setCompletingTask(null);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('traineeCourses.backToSubjects')}
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{subject.title}</h3>
        <p className="text-gray-600">{subject.description}</p>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4">{t('traineeCourses.tasksCount', { count: tasks.length })}</h4>
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const isCompleted = task.status === 'COMPLETED';
            const canComplete = subject.status === 'IN_PROGRESS';

            return (
              <div key={task.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => isCompleted ? handleUncompleteTask(task.id) : handleCompleteTask(task.id)}
                    disabled={completingTask === task.id || !canComplete}
                    className="mt-1 disabled:opacity-50"
                  >
                    {completingTask === task.id ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 hover:text-indigo-600" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-gray-500">{t('traineeCourses.itemNumber', { index: index + 1 })}</span>
                          <h5 className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </h5>
                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                              {t('traineeCourses.completed')}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">{task.description}</p>
                        {task.dueDate && (
                          <p className="text-orange-600 text-sm mt-2">
                            {t('traineeCourses.due', { date: new Date(task.dueDate).toLocaleDateString() })}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isCompleted && canComplete && (
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => setUploadingTaskId(task.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <Upload className="w-4 h-4" />
                          {t('traineeCourses.uploadEvidence')}
                        </button>
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={completingTask === task.id}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {t('traineeCourses.markAsComplete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {uploadingTaskId && (
        <UploadModal
          taskId={uploadingTaskId}
          onClose={() => setUploadingTaskId(null)}
          onUpload={() => {
            setUploadingTaskId(null);
            // Reload tasks if needed
          }}
        />
      )}
    </div>
  );
}

function UploadModal({ taskId, onClose, onUpload }: {
  taskId: number;
  onClose: () => void;
  onUpload: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const { t } = useTranslation();

  const handleUpload = async () => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      // Backend expects 'files' field (plural) for multiple files
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${config.apiUrl}/tasks/${taskId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      alert(t('traineeCourses.filesUploadedSuccess'));
      onUpload();
      onClose();
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert(t('traineeCourses.filesUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">{t('traineeCourses.uploadEvidenceFiles')}</h4>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          {files && files.length > 0 ? (
            <div className="text-left">
              <p className="text-gray-700 font-medium mb-2">{t('traineeCourses.filesSelected', { count: files.length, defaultValue: `${files.length} file(s) selected:` })}</p>
              {Array.from(files).map((f, i) => (
                <p key={i} className="text-sm text-gray-600">• {f.name}</p>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 mb-2">{t('traineeCourses.selectFilesHint', 'Select files to upload (max 10 files, 10MB each)')}</p>
          )}
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
            {t('traineeCourses.selectFiles')}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!files || files.length === 0 || uploading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('traineeCourses.upload')}
        </button>
      </div>
    </div>
  );
}
