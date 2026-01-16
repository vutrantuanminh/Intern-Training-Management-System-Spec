import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { Plus, Trash2, ExternalLink, Github } from 'lucide-react';

export function CourseRepoManagement() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [courseRepos, setCourseRepos] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newRepo, setNewRepo] = useState({
    repoName: '',
    repoUrl: '',
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseRepos(selectedCourse);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const response: any = await api.get('/courses');
      setCourses(response.data || response || []);
      if (response.data?.[0]) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseRepos = async (courseId: number) => {
    try {
      const response: any = await api.get(`/course-repos/${courseId}`);
      setCourseRepos(response.data || response || []);
    } catch (error) {
      console.error('Failed to load course repos:', error);
    }
  };

  const handleAddRepo = async () => {
    if (!selectedCourse || !newRepo.repoName) {
      alert('Please select a course and enter repo name');
      return;
    }

    // Validate repo name format (owner/repo)
    if (!newRepo.repoName.includes('/')) {
      alert('Repo name must be in format: owner/repository');
      return;
    }

    try {
      await api.post('/course-repos', {
        courseId: selectedCourse,
        repoName: newRepo.repoName,
        repoUrl: newRepo.repoUrl || `https://github.com/${newRepo.repoName}`,
      });

      setShowAddModal(false);
      setNewRepo({ repoName: '', repoUrl: '' });
      loadCourseRepos(selectedCourse);
    } catch (error) {
      console.error('Failed to add repo:', error);
      alert('Failed to link repository');
    }
  };

  const handleDeleteRepo = async (repoId: number) => {
    if (!confirm('Are you sure you want to unlink this repository?')) return;

    try {
      await api.delete('/course-repos', {
        data: { id: repoId },
      });
      loadCourseRepos(selectedCourse!);
    } catch (error) {
      console.error('Failed to delete repo:', error);
      alert('Failed to unlink repository');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">GitHub Repository Management</h3>
          <p className="text-gray-600 mt-1">Link GitHub repositories to courses for PR tracking</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Link Repository
        </button>
      </div>

      {/* Course Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Course
        </label>
        <select
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.code})
            </option>
          ))}
        </select>
      </div>

      {/* Repositories List */}
      {selectedCourse && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Linked Repositories</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {courseRepos.length > 0 ? (
              courseRepos.map((repo) => (
                <div key={repo.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">{repo.repoName}</div>
                      <a
                        href={repo.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        View on GitHub
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRepo(repo.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No repositories linked to this course yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Repository Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Link Repository</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name *
                </label>
                <input
                  type="text"
                  value={newRepo.repoName}
                  onChange={(e) => setNewRepo({ ...newRepo, repoName: e.target.value })}
                  placeholder="owner/repository (e.g., facebook/react)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: owner/repository-name
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository URL (optional)
                </label>
                <input
                  type="text"
                  value={newRepo.repoUrl}
                  onChange={(e) => setNewRepo({ ...newRepo, repoUrl: e.target.value })}
                  placeholder="https://github.com/owner/repository"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate from repo name
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddRepo}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Link Repository
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewRepo({ repoName: '', repoUrl: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
