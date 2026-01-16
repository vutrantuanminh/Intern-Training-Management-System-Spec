import { useState } from 'react';
import { Course, CourseStatus } from '../../types';
import { mockCourses, mockUsers } from '../../data/mockData';
import { Plus, Search, Filter, Calendar, User, Play, StopCircle, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CreateCourseModal } from './CreateCourseModal';
import { CourseDetails } from './CourseDetails';

interface CourseManagementProps {
  userId: string;
}

export function CourseManagement({ userId }: CourseManagementProps) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CourseStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'finished': return 'bg-green-100 text-green-700';
    }
  };

  const getStatusText = (status: CourseStatus) => {
    switch (status) {
      case 'not_started': return t('supervisor.courseStatus.not_started');
      case 'in_progress': return t('supervisor.courseStatus.in_progress');
      case 'finished': return t('supervisor.courseStatus.finished');
    }
  };

  const handleStartCourse = (courseId: string) => {
    setCourses(courses.map(c => 
      c.id === courseId ? { ...c, status: 'in_progress', startDate: new Date() } : c
    ));
  };

  const handleFinishCourse = (courseId: string) => {
    if (confirm(t('supervisor.courseManagement.finishConfirm'))) {
      setCourses(courses.map(c => 
        c.id === courseId ? { ...c, status: 'finished', endDate: new Date() } : c
      ));
    }
  };

  if (selectedCourse) {
    return (
      <CourseDetails
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
          <h3>{t('supervisor.courseManagement.title')}</h3>
          <p className="text-gray-600 mt-1">{t('supervisor.courseManagement.description')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          {t('supervisor.courseManagement.createCourse')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('supervisor.courseManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CourseStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">{t('supervisor.courseManagement.filter.all')}</option>
            <option value="not_started">{t('supervisor.courseManagement.filter.not_started')}</option>
            <option value="in_progress">{t('supervisor.courseManagement.filter.in_progress')}</option>
            <option value="finished">{t('supervisor.courseManagement.filter.finished')}</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCourses.map((course) => {
          const creator = mockUsers.find(u => u.id === course.creatorId);
          const trainer = course.trainerId ? mockUsers.find(u => u.id === course.trainerId) : null;

          return (
            <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="mb-1">{course.name}</h4>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusBadge(course.status)}`}>
                      {getStatusText(course.status)}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <User className="w-4 h-4" />
                    <span>Creator: {creator?.name}</span>
                  </div>
                  {trainer && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <User className="w-4 h-4" />
                      <span>Trainer: {trainer.name}</span>
                    </div>
                  )}
                  {course.startDate && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Started: {new Date(course.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                  >
                    {t('supervisor.courseManagement.viewDetails')}
                  </button>
                  {course.status === 'not_started' && course.trainerId && (
                    <button
                      onClick={() => handleStartCourse(course.id)}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                      title={t('startCourse')}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  
                  {course.status === 'in_progress' && (
                    <button
                      onClick={() => handleFinishCourse(course.id)}
                      className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                      title={t('finishCourse')}
                    >
                      <StopCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No courses found. Create your first course to get started.
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCourseCreated={(course) => {
            setCourses([...courses, course]);
            setShowCreateModal(false);
          }}
          creatorId={userId}
        />
      )}
    </div>
  );
}
