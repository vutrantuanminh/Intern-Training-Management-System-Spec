import { useState, useEffect } from 'react';
import { User } from '../types';
import { DashboardLayout } from './DashboardLayout';
import { courseService } from '../services/courseService';
import { supervisorService, courseManagementService } from '../services/trainerService';
import { userService } from '../services/userService';
import {
  LayoutDashboard, BookOpen, Users, UserCheck, Search, Calendar, Eye, TrendingUp,
  Plus, X, ChevronDown, ChevronRight, Edit, Trash2, UserPlus, UserMinus, Copy, Check,
  Award, FileText
} from 'lucide-react';

interface SupervisorDashboardProps {
  user: User;
  onLogout: () => void;
}

export function SupervisorDashboard({ user, onLogout }: SupervisorDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'trainees', label: 'Trainees', icon: <Users className="w-5 h-5" /> },
    { id: 'supervisors', label: 'Supervisors', icon: <UserCheck className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={onLogout}
      menuItems={menuItems}
    >
      {currentView === 'dashboard' && <SupervisorOverview />}
      {currentView === 'courses' && <SupervisorCourses userId={user.id} />}
      {currentView === 'trainees' && <SupervisorTrainees />}
      {currentView === 'supervisors' && <SupervisorsList />}
    </DashboardLayout>
  );
}

// ============== DASHBOARD OVERVIEW ==============
function SupervisorOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response: any = await supervisorService.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Failed to load dashboard data</div>;
  }

  const { stats, activeCourses, recentActivity, upcomingTasks, topPerformers } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h3>
        <p className="text-gray-600 mt-1">Overview of training activities and performance</p>
      </div>

      {/* Stats Cards - Row 1: Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen />} label="Total Courses" value={stats.courses.total} color="blue" />
        <StatCard icon={<TrendingUp />} label="Active Courses" value={stats.courses.active} color="green" />
        <StatCard icon={<Calendar />} label="Upcoming" value={stats.courses.upcoming} color="yellow" />
        <StatCard icon={<Check />} label="Completed" value={stats.courses.completed} color="gray" />
      </div>

      {/* Stats Cards - Row 2: People */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users />} label="Total Trainees" value={stats.trainees.total} color="purple" />
        <StatCard icon={<UserCheck />} label="Active Trainees" value={stats.trainees.active} color="indigo" />
        <StatCard icon={<Award />} label="Passed" value={stats.trainees.passed} color="emerald" />
        <StatCard icon={<UserCheck />} label="Staff (Trainers + Supervisors)" value={stats.staff.trainers + stats.staff.supervisors} color="cyan" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Courses - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Active Courses
          </h4>
          {activeCourses?.length > 0 ? (
            <div className="space-y-4">
              {activeCourses.map((course: any) => (
                <div key={course.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{course.title}</span>
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                    <span><Users className="w-4 h-4 inline mr-1" /> {course.traineeCount} trainees</span>
                    <span><BookOpen className="w-4 h-4 inline mr-1" /> {course.subjectCount} subjects</span>
                    <span><UserCheck className="w-4 h-4 inline mr-1" /> {course.trainers?.map((t: any) => t.fullName).join(', ') || 'No trainers'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                    <span className="text-sm font-medium text-indigo-600">{course.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No active courses</p>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" /> Top Performers
          </h4>
          {topPerformers?.length > 0 ? (
            <div className="space-y-3">
              {topPerformers.map((performer: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-indigo-400'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{performer.trainee?.fullName}</p>
                    <p className="text-xs text-gray-500">{performer.course?.title}</p>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">{performer.avgGrade}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No graded data yet</p>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Upcoming Deadlines
          </h4>
          {upcomingTasks?.length > 0 ? (
            <div className="space-y-2">
              {upcomingTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{task.subject?.title}</span>
                    <span className="text-xs text-red-600 font-medium">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-500" /> Recent Reports
          </h4>
          {recentActivity?.reports?.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.reports.slice(0, 5).map((report: any) => (
                <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs">
                      {report.trainee?.fullName?.charAt(0)}
                    </div>
                    <span className="font-medium text-sm text-gray-900">{report.trainee?.fullName}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{report.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(report.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent reports</p>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-500" /> Recent Enrollments
          </h4>
          {recentActivity?.enrollments?.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.enrollments.slice(0, 5).map((enrollment: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {enrollment.trainee?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{enrollment.trainee?.fullName}</p>
                    <p className="text-xs text-gray-500">{enrollment.course?.title}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent enrollments</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== COURSES ==============
function SupervisorCourses({ userId }: { userId: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [myCoursesOnly, setMyCoursesOnly] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [statusFilter, myCoursesOnly]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (myCoursesOnly) params.myTrainerCourses = 'true';
      const { data } = await courseService.getCourses(params);
      setCourses(data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatus = (course: any) => {
    const now = new Date();
    const start = new Date(course.startDate);
    const end = new Date(course.endDate);
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Completed', color: 'bg-gray-100 text-gray-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  const handleClone = async (courseId: number) => {
    try {
      await courseManagementService.cloneCourse(courseId);
      loadCourses();
      alert('Course cloned successfully!');
    } catch (error) {
      alert('Failed to clone course');
    }
  };

  if (loading && courses.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Courses</h3>
          <p className="text-gray-600 mt-1">View and manage training courses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="NOT_STARTED">Upcoming</option>
            <option value="IN_PROGRESS">Active</option>
            <option value="FINISHED">Completed</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={myCoursesOnly}
              onChange={(e) => setMyCoursesOnly(e.target.checked)}
            />
            <span className="text-sm">My courses only</span>
          </label>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const status = getStatus(course);
          return (
            <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  <button
                    onClick={() => handleClone(course.id)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Clone course"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(course.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{course.trainees?.length || 0} trainees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.subjectCount || 0} subjects</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="w-full py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No courses found</p>
        </div>
      )}

      {selectedCourse && (
        <CourseDetailModal
          courseId={selectedCourse.id}
          onClose={() => setSelectedCourse(null)}
          onUpdate={loadCourses}
        />
      )}

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadCourses();
          }}
        />
      )}
    </div>
  );
}

// ============== TRAINEES ==============
function SupervisorTrainees() {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState<any>(null);

  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    try {
      const { data } = await supervisorService.getAllTrainees({ limit: 100 });
      setTrainees(data || []);
    } catch (error) {
      console.error('Failed to load trainees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = trainees.filter((t) =>
    (t.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">All Trainees</h3>
        <p className="text-gray-600 mt-1">View all trainees in the system</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search trainees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Courses</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((trainee) => (
              <tr key={trainee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {(trainee.fullName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{trainee.fullName || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{trainee.email}</td>
                <td className="px-6 py-4 text-gray-600">{trainee.enrolledCourses?.length || 0}</td>
                <td className="px-6 py-4 text-gray-600">
                  {trainee.createdAt ? new Date(trainee.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedTrainee(trainee)}
                    className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-gray-600 text-sm">Showing {filtered.length} trainees</div>

      {selectedTrainee && (
        <TraineeDetailModal trainee={selectedTrainee} onClose={() => setSelectedTrainee(null)} />
      )}
    </div>
  );
}

// ============== SUPERVISORS ==============
function SupervisorsList() {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupervisors();
  }, []);

  const loadSupervisors = async () => {
    try {
      const { data } = await supervisorService.getAllSupervisors();
      setSupervisors(data || []);
    } catch (error) {
      console.error('Failed to load supervisors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">All Supervisors</h3>
        <p className="text-gray-600 mt-1">View other supervisors in the system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supervisors.map((supervisor) => (
          <div key={supervisor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {(supervisor.fullName || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{supervisor.fullName}</h4>
                <p className="text-gray-600 text-sm">{supervisor.email}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Joined {new Date(supervisor.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {supervisors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No supervisors found</p>
        </div>
      )}
    </div>
  );
}

// ============== COURSE DETAIL MODAL ==============
function CourseDetailModal({ courseId, onClose, onUpdate }: { courseId: number; onClose: () => void; onUpdate: () => void }) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subjects');
  const [allTrainees, setAllTrainees] = useState<any[]>([]);
  const [allTrainers, setAllTrainers] = useState<any[]>([]);

  useEffect(() => {
    loadCourse();
    loadAllUsers();
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

  const loadAllUsers = async () => {
    try {
      const [traineesRes, trainersRes]: any[] = await Promise.all([
        supervisorService.getAllTrainees({ limit: 100 }),
        supervisorService.getAllTrainers(),
      ]);
      setAllTrainees(traineesRes.data || []);
      setAllTrainers(trainersRes.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleAddTrainee = async (traineeId: number) => {
    try {
      await courseManagementService.addTrainees(courseId, [traineeId]);
      loadCourse();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add trainee');
    }
  };

  const handleRemoveTrainee = async (traineeId: number) => {
    if (!confirm('Remove this trainee from the course?')) return;
    try {
      await courseManagementService.removeTrainee(courseId, traineeId);
      loadCourse();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove trainee');
    }
  };

  const handleUpdateTraineeStatus = async (traineeId: number, status: string) => {
    try {
      await supervisorService.updateTraineeStatus(courseId, traineeId, status);
      loadCourse();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleAssignTrainer = async (trainerId: number) => {
    try {
      const currentTrainerIds = course.trainers.map((t: any) => t.id);
      await courseManagementService.assignTrainers(courseId, [...currentTrainerIds, trainerId]);
      loadCourse();
      onUpdate();
    } catch (error) {
      alert('Failed to add trainer');
    }
  };

  const handleRemoveTrainer = async (trainerId: number) => {
    if (course.trainers.length <= 1) {
      alert('Course must have at least one trainer');
      return;
    }
    if (!confirm('Remove this trainer from the course?')) return;
    try {
      const newTrainerIds = course.trainers.filter((t: any) => t.id !== trainerId).map((t: any) => t.id);
      await courseManagementService.assignTrainers(courseId, newTrainerIds);
      loadCourse();
      onUpdate();
    } catch (error) {
      alert('Failed to remove trainer');
    }
  };

  const getStatus = () => {
    if (!course) return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    const now = new Date();
    const start = new Date(course.startDate);
    const end = new Date(course.endDate);
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Completed', color: 'bg-gray-100 text-gray-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  const canModifyTrainees = () => {
    // Supervisors can always modify trainees
    return true;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!course) return null;

  const status = getStatus();
  const existingTraineeIds = course.trainees.map((t: any) => t.id);
  const existingTrainerIds = course.trainers.map((t: any) => t.id);
  const availableTrainees = allTrainees.filter((t) => !existingTraineeIds.includes(t.id));
  const availableTrainers = allTrainers.filter((t) => !existingTrainerIds.includes(t.id));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{course.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-600">Start:</span>
                <span className="ml-2 font-medium">{new Date(course.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-600">End:</span>
                <span className="ml-2 font-medium">{new Date(course.endDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Subjects:</span>
                <span className="ml-2 font-medium">{course.subjects?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Trainees:</span>
                <span className="ml-2 font-medium">{course.trainees?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{course.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {course.status === 'NOT_STARTED' && (
                <button
                  onClick={async () => {
                    try {
                      await courseManagementService.startCourse(courseId);
                      loadCourse();
                      onUpdate();
                    } catch (error) {
                      alert('Failed to start course');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  ▶ Start Course
                </button>
              )}
              {course.status === 'IN_PROGRESS' && (
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to finish this course?')) return;
                    try {
                      await courseManagementService.finishCourse(courseId);
                      loadCourse();
                      onUpdate();
                    } catch (error) {
                      alert('Failed to finish course');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  ✓ Finish Course
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {['subjects', 'trainees', 'trainers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize ${activeTab === tab
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab} ({tab === 'subjects' ? course.subjects?.length : tab === 'trainees' ? course.trainees?.length : course.trainers?.length})
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'subjects' && (
            <SubjectsTab subjects={course.subjects || []} onReload={loadCourse} />
          )}

          {activeTab === 'trainees' && (
            <TraineesTab
              trainees={course.trainees || []}
              availableTrainees={availableTrainees}
              canModify={canModifyTrainees()}
              onAdd={handleAddTrainee}
              onRemove={handleRemoveTrainee}
              onUpdateStatus={handleUpdateTraineeStatus}
            />
          )}

          {activeTab === 'trainers' && (
            <TrainersTab
              trainers={course.trainers || []}
              availableTrainers={availableTrainers}
              onAdd={handleAssignTrainer}
              onRemove={handleRemoveTrainer}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============== SUBJECTS TAB ==============
function SubjectsTab({ subjects, onReload }: { subjects: any[]; onReload?: () => void }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<number | null>(null);

  const toggle = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const handleStartSubject = async (subjectId: number) => {
    setLoading(subjectId);
    try {
      await courseManagementService.startSubject(subjectId);
      onReload?.();
    } catch (error) {
      alert('Failed to start subject');
    } finally {
      setLoading(null);
    }
  };

  const handleFinishSubject = async (subjectId: number) => {
    if (!confirm('Are you sure you want to finish this subject?')) return;
    setLoading(subjectId);
    try {
      await courseManagementService.finishSubject(subjectId);
      onReload?.();
    } catch (error) {
      alert('Failed to finish subject');
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'FINISHED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      {subjects.map((subject, index) => (
        <div key={subject.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
            onClick={() => toggle(subject.id)}
          >
            <div className="flex items-center gap-3">
              {expanded.has(subject.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <div>
                <span className="font-medium">{index + 1}. {subject.title}</span>
                <span className="text-sm text-gray-600 ml-2">({subject.tasks?.length || subject.taskCount || 0} tasks)</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(subject.status)}`}>
                {subject.status?.replace('_', ' ') || 'NOT STARTED'}
              </span>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {subject.status === 'NOT_STARTED' && (
                <button
                  onClick={() => handleStartSubject(subject.id)}
                  disabled={loading === subject.id}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {loading === subject.id ? '...' : '▶ Start'}
                </button>
              )}
              {subject.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleFinishSubject(subject.id)}
                  disabled={loading === subject.id}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === subject.id ? '...' : '✓ Finish'}
                </button>
              )}
            </div>
          </div>
          {expanded.has(subject.id) && subject.tasks && (
            <div className="p-4 space-y-2">
              {subject.tasks.map((task: any, i: number) => (
                <div key={task.id} className="p-3 bg-white border border-gray-200 rounded flex items-center gap-3">
                  <span className="text-sm text-gray-500">Task {i + 1}:</span>
                  <span className="font-medium">{task.title}</span>
                  {task.dueDate && (
                    <span className="ml-auto text-sm text-orange-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {subjects.length === 0 && <p className="text-gray-500 text-center py-8">No subjects</p>}
    </div>
  );
}

// ============== TRAINEES TAB ==============
function TraineesTab({ trainees, availableTrainees, canModify, onAdd, onRemove, onUpdateStatus }: any) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-4">
      {canModify && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <UserPlus className="w-4 h-4" /> Add Trainee
          </button>
        </div>
      )}

      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {trainees.map((trainee: any) => (
            <tr key={trainee.id}>
              <td className="px-4 py-3 font-medium">{trainee.fullName}</td>
              <td className="px-4 py-3 text-gray-600">{trainee.email}</td>
              <td className="px-4 py-3">
                <select
                  value={trainee.status || 'ACTIVE'}
                  onChange={(e) => onUpdateStatus(trainee.id, e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                  <option value="RESIGN">Resign</option>
                </select>
              </td>
              <td className="px-4 py-3">
                {canModify && (
                  <button
                    onClick={() => onRemove(trainee.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {trainees.length === 0 && <p className="text-gray-500 text-center py-8">No trainees enrolled</p>}

      {showAddModal && (
        <AddUserModal
          title="Add Trainee"
          users={availableTrainees}
          onSelect={(id) => { onAdd(id); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ============== TRAINERS TAB ==============
function TrainersTab({ trainers, availableTrainers, onAdd, onRemove }: any) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4" /> Add Trainer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainers.map((trainer: any) => (
          <div key={trainer.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                {(trainer.fullName || 'T').charAt(0)}
              </div>
              <div>
                <p className="font-medium">{trainer.fullName}</p>
                <p className="text-sm text-gray-600">{trainer.email}</p>
              </div>
            </div>
            <button
              onClick={() => onRemove(trainer.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Remove trainer"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {trainers.length === 0 && <p className="text-gray-500 text-center py-8">No trainers assigned</p>}

      {showAddModal && (
        <AddUserModal
          title="Add Trainer"
          users={availableTrainers}
          onSelect={(id) => { onAdd(id); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ============== ADD USER MODAL ==============
function AddUserModal({ title, users, onSelect, onClose }: any) {
  const [search, setSearch] = useState('');
  const filtered = users.filter((u: any) =>
    (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-semibold">{title}</h4>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">&times;</button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          />
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filtered.map((user: any) => (
              <div
                key={user.id}
                onClick={() => onSelect(user.id)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 cursor-pointer flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                  {(user.fullName || 'U').charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-gray-500 text-center py-4">No users available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== CREATE COURSE MODAL ==============
function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    subjects: [{ title: '', tasks: [{ title: '' }] }],
  });
  const [loading, setLoading] = useState(false);

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { title: '', tasks: [{ title: '' }] }],
    });
  };

  const removeSubject = (index: number) => {
    if (formData.subjects.length <= 1) return;
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index),
    });
  };

  const updateSubject = (index: number, value: string) => {
    const subjects = [...formData.subjects];
    subjects[index].title = value;
    setFormData({ ...formData, subjects });
  };

  const addTask = (subjectIndex: number) => {
    const subjects = [...formData.subjects];
    subjects[subjectIndex].tasks.push({ title: '' });
    setFormData({ ...formData, subjects });
  };

  const removeTask = (subjectIndex: number, taskIndex: number) => {
    if (formData.subjects[subjectIndex].tasks.length <= 1) return;
    const subjects = [...formData.subjects];
    subjects[subjectIndex].tasks = subjects[subjectIndex].tasks.filter((_, i) => i !== taskIndex);
    setFormData({ ...formData, subjects });
  };

  const updateTask = (subjectIndex: number, taskIndex: number, value: string) => {
    const subjects = [...formData.subjects];
    subjects[subjectIndex].tasks[taskIndex].title = value;
    setFormData({ ...formData, subjects });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.subjects.some((s) => !s.title || s.tasks.some((t) => !t.title))) {
      alert('All subjects and tasks must have titles');
      return;
    }

    try {
      setLoading(true);
      await courseManagementService.createCourse(formData);
      onCreated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold">Create New Course</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Enter course description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">Subjects (minimum 1) *</label>
              <button
                type="button"
                onClick={addSubject}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>

            <div className="space-y-4">
              {formData.subjects.map((subject, sIndex) => (
                <div key={sIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-medium text-sm">Subject {sIndex + 1}</span>
                    {formData.subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubject(sIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={subject.title}
                    onChange={(e) => updateSubject(sIndex, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-3"
                    placeholder="Subject title"
                  />

                  <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tasks (minimum 1)</span>
                      <button
                        type="button"
                        onClick={() => addTask(sIndex)}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Task
                      </button>
                    </div>
                    {subject.tasks.map((task, tIndex) => (
                      <div key={tIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(sIndex, tIndex, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                          placeholder={`Task ${tIndex + 1}`}
                        />
                        {subject.tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(sIndex, tIndex)}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== TRAINEE DETAIL MODAL ==============
function TraineeDetailModal({ trainee, onClose }: { trainee: any; onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [trainee.id]);

  const loadDetails = async () => {
    try {
      const { data } = await supervisorService.getTraineeDetails(trainee.id);
      setDetails(data);
    } catch (error) {
      console.error('Failed to load details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold">Trainee Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <LoadingSpinner />
          ) : details ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(details.fullName || 'T').charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{details.fullName}</h4>
                  <p className="text-gray-600">{details.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average Grade</p>
                  <p className="text-2xl font-bold">{details.averageGrade?.toFixed(1) || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Grades</p>
                  <p className="text-2xl font-bold">{details.gradesCount || 0}</p>
                </div>
              </div>

              <div>
                <h5 className="font-semibold mb-3">Enrolled Courses</h5>
                <div className="space-y-2">
                  {details.courses?.map((course: any) => (
                    <div key={course.courseId} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{course.courseName}</span>
                        <span className={`px-2 py-1 rounded text-xs ${course.status === 'PASS' ? 'bg-green-100 text-green-700' :
                          course.status === 'FAIL' ? 'bg-red-100 text-red-700' :
                            course.status === 'RESIGN' ? 'bg-gray-100 text-gray-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                          {course.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!details.courses || details.courses.length === 0) && (
                    <p className="text-gray-500">No courses enrolled</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Failed to load details</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== UTILITIES ==============
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
