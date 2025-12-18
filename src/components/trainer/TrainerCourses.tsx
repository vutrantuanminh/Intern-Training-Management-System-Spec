import { useState, useEffect } from 'react';
import { trainerService } from '../../services/trainerService';
import { BookOpen, Users, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { SubjectManagement } from './SubjectManagement';

interface TrainerCoursesProps {
  trainerId: string;
}

export function TrainerCourses({ trainerId }: TrainerCoursesProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response: any = await trainerService.getCourses();
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedCourse) {
    return (
      <SubjectManagement
        course={selectedCourse}
        onBack={() => {
          setSelectedCourse(null);
          loadCourses();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const getStatusBadge = (course: any) => {
    const status = course.status;
    if (status === 'IN_PROGRESS') return { label: 'In Progress', class: 'bg-blue-100 text-blue-700' };
    if (status === 'FINISHED') return { label: 'Completed', class: 'bg-green-100 text-green-700' };
    return { label: 'Not Started', class: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">My Courses</h3>
        <p className="text-gray-600 mt-1">Manage subjects and evaluate trainees in your assigned courses</p>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => {
            const status = getStatusBadge(course);
            return (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description || 'No description'}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.subjectCount || 0} Subjects</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{course.traineeCount || 0} Trainees</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Manage Subjects & Tasks
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No courses assigned yet</p>
          <p className="text-gray-400 text-sm mt-1">You will see your courses here once you're assigned as a trainer</p>
        </div>
      )}
    </div>
  );
}
