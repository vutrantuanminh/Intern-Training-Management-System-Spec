import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, UserMinus, Loader2, BookOpen, Search } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface CourseDetailsProps {
  course: Course;
  onBack: () => void;
}

interface Trainee {
  id: number;
  fullName: string;
  email: string;
  status: string;
}

interface Subject {
  id: number;
  title: string;
  description: string;
  status: string;
}

export function CourseDetails({ course, onBack }: CourseDetailsProps) {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [availableTrainees, setAvailableTrainees] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainees, setSelectedTrainees] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [course.id]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(`/courses/${course.id}`);
      const data = response.data;

      setTrainees(data.trainees?.map((ct: any) => ({
        id: ct.trainee?.id || ct.id,
        fullName: ct.trainee?.fullName || ct.fullName,
        email: ct.trainee?.email || ct.email,
        status: ct.status,
      })) || []);

      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setLoading(false);
    }
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
      await api.post(`/courses/${course.id}/trainees`, {
        traineeIds: selectedTrainees,
      });
      await loadCourseData();
      setShowAddTrainee(false);
      setSelectedTrainees([]);
    } catch (error) {
      console.error('Failed to add trainees:', error);
      alert('Failed to add trainees');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTrainee = async (traineeId: number) => {
    if (!confirm('Are you sure you want to remove this trainee?')) return;

    try {
      await api.delete(`/courses/${course.id}/trainees/${traineeId}`);
      setTrainees(trainees.filter(t => t.id !== traineeId));
    } catch (error) {
      console.error('Failed to remove trainee:', error);
      alert('Failed to remove trainee');
    }
  };

  const getStatusBadge = (status: string) => {
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
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
        <p className="text-gray-600 mb-4">{course.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-600 text-sm">Status</div>
            <div className="text-gray-900 capitalize font-medium">{course.status.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Trainees</div>
            <div className="text-gray-900 font-medium">{trainees.length}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Subjects</div>
            <div className="text-gray-900 font-medium">{subjects.length}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Created</div>
            <div className="text-gray-900 font-medium">{new Date(course.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Course Subjects ({subjects.length})
        </h4>
        {subjects.length > 0 ? (
          <div className="space-y-3">
            {subjects.map((subject, index) => (
              <div key={subject.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-500 font-medium">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{subject.title}</span>
                      <span className={`px-2 py-1 rounded text-sm ${subject.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                          subject.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {subject.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{subject.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No subjects added yet
          </div>
        )}
      </div>

      {/* Trainees */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
              <div key={trainee.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
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
                  <span className={`px-2 py-1 rounded text-sm ${getStatusBadge(trainee.status)}`}>
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
          <div className="text-center py-8 text-gray-500">
            No trainees enrolled yet
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
                  placeholder="Search trainees..."
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
                  No available trainees found
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
