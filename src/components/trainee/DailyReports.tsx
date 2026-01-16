import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, FileText, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/apiClient';

interface DailyReportsProps {
  traineeId: string;
}

interface Report {
  id: number;
  date: string;
  content: string;
  course?: { id: number; title: string };
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
}

export function DailyReports({ traineeId }: DailyReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadReports();
    loadCourses();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/daily-reports?limit=50');
      setReports(response.data || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response: any = await api.get('/trainee/dashboard');
      setCourses(response.data?.courses?.map((c: any) => ({ id: c.id, title: c.title })) || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm(t('traineeReports.deleteConfirm'))) return;

    try {
      await api.delete(`/daily-reports/${reportId}`);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert(t('traineeReports.failedDelete'));
    }
  };

  const filteredReports = reports.filter(report =>
    report.content.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{t('traineeReports.title')}</h3>
          <p className="text-gray-600 mt-1">{t('traineeReports.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          {t('traineeReports.newReport')}
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('traineeReports.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {new Date(report.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.course && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            {report.course.title}
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title={t('deleteReport')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 whitespace-pre-wrap">{report.content}</p>

                    <div className="text-gray-400 text-sm mt-3">
                      {t('traineeReports.submitted', { date: new Date(report.createdAt).toLocaleString() })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('traineeReports.noReports')}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-indigo-600 hover:underline mt-2"
              >
                {t('traineeReports.createFirstReport')}
              </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateReportModal
          courses={courses}
          onClose={() => setShowCreateModal(false)}
          onReportCreated={(report) => {
            setReports([report, ...reports]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateReportModal({ courses, onClose, onReportCreated }: {
  courses: Course[];
  onClose: () => void;
  onReportCreated: (report: Report) => void;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response: any = await api.post('/daily-reports', {
        date: formData.date,
        content: formData.content,
      });
      onReportCreated(response.data);
    } catch (err: any) {
      setError(err.message || t('traineeReports.failedCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold">{t('traineeReports.submitTitle')}</h4>
          <p className="text-gray-600 mt-1">{t('traineeReports.submitSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">{t('traineeReports.dateLabel')}</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">{t('traineeReports.contentLabel')}</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={10}
              placeholder={t('traineeReports.contentPlaceholder')}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {t('traineeReports.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('traineeReports.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
