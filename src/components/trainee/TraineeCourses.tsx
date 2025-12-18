import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Upload, X, Loader2, BookOpen } from 'lucide-react';
import { api } from '../../lib/apiClient';

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

interface Subject {
  id: number;
  title: string;
  description: string;
  status: string;
  grade?: number;
  feedback?: string;
  tasks: Task[];
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  dueDate?: string;
}

export function TraineeCourses({ traineeId }: TraineeCoursesProps) {
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
        <h3 className="text-2xl font-bold text-gray-900">My Courses</h3>
        <p className="text-gray-600 mt-1">View your enrolled courses and progress</p>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      <span className="text-gray-600 text-sm">Overall Progress</span>
                      <span className="text-gray-900 text-sm font-medium">
                        {completedTasks}/{totalTasks} tasks
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-gray-600 text-sm mt-1">{Math.round(progress)}% complete</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-sm ${course.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      course.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {course.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      View Details
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
          <p className="text-gray-500">You are not enrolled in any courses yet</p>
        </div>
      )}
    </div>
  );
}

function CourseDetail({ course, onBack, onSubjectSelect }: {
  course: Course;
  onBack: () => void;
  onSubjectSelect: (subject: Subject) => void;
}) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
        <p className="text-gray-600">{course.description}</p>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4">Subjects ({course.subjects.length})</h4>
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
                      <span className="text-gray-500 font-medium">#{index + 1}</span>
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
                      <span>Tasks: {completedTasks}/{subject.tasks.length} completed</span>
                      {subject.grade !== undefined && subject.grade !== null && (
                        <span className="text-indigo-600 font-medium">Grade: {subject.grade}%</span>
                      )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${taskProgress}%` }}
                      />
                    </div>

                    {subject.feedback && (
                      <div className="p-3 bg-blue-50 rounded-lg mb-3">
                        <div className="text-gray-700 text-sm font-medium mb-1">Trainer Feedback:</div>
                        <p className="text-gray-600 text-sm">{subject.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSubjectSelect(subject)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                >
                  View Tasks
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SubjectDetail({ subject, onBack, onTaskComplete }: {
  subject: Subject;
  onBack: () => void;
  onTaskComplete: () => void;
}) {
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
      console.error('Failed to complete task:', error);
      alert('Failed to mark task as complete');
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
      console.error('Failed to uncomplete task:', error);
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
        Back to Subjects
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{subject.title}</h3>
        <p className="text-gray-600">{subject.description}</p>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4">Tasks ({tasks.length})</h4>
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
                          <span className="text-gray-500">#{index + 1}</span>
                          <h5 className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </h5>
                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">{task.description}</p>
                        {task.dueDate && (
                          <p className="text-orange-600 text-sm mt-2">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isCompleted && canComplete && (
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => alert('File upload requires S3/MinIO configuration. Coming soon!')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                          title="File upload not configured"
                        >
                          <Upload className="w-4 h-4" />
                          Upload (N/A)
                        </button>
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={completingTask === task.id}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Mark as Complete
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
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await fetch(`http://localhost:5000/api/tasks/${taskId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      onUpload();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Upload Evidence Files</h4>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          {file ? (
            <p className="text-gray-700">{file.name}</p>
          ) : (
            <p className="text-gray-600 mb-2">Drag and drop files here or click to browse</p>
          )}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
            Select Files
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          Upload
        </button>
      </div>
    </div>
  );
}
