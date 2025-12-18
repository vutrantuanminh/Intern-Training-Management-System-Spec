import { useState, useEffect } from 'react';
import { supervisorService } from '../../services/trainerService';
import { Users, Search, Filter, TrendingUp, Award } from 'lucide-react';
import { TraineeDetailModal } from './TraineeDetailModal';

export function TraineeManagement() {
    const [trainees, setTrainees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainee, setSelectedTrainee] = useState<any>(null);
    const [filters, setFilters] = useState({
        search: '',
        courseId: '',
        status: 'all',
    });

    useEffect(() => {
        loadTrainees();
    }, [filters]);

    const loadTrainees = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filters.search) params.search = filters.search;
            if (filters.courseId) params.courseId = filters.courseId;
            if (filters.status !== 'all') params.status = filters.status;

            const { data } = await supervisorService.getAllTrainees(params);
            setTrainees(data || []);
        } catch (error) {
            console.error('Failed to load trainees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (traineeId: number, courseId: number, status: string) => {
        try {
            await supervisorService.updateTraineeStatus(courseId, traineeId, status);
            loadTrainees();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-gray-900">Trainee Management</h3>
                <p className="text-gray-600 mt-1">View and manage all trainees in the system</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search trainees..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PASS">Passed</option>
                        <option value="FAIL">Failed</option>
                        <option value="RESIGN">Resigned</option>
                    </select>
                </div>
            </div>

            {/* Trainees Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Courses</th>

                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {trainees.map((trainee) => (
                            <tr key={trainee.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                                            {trainee.fullName?.charAt(0) || trainee.name?.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900">{trainee.fullName || trainee.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{trainee.email}</td>
                                <td className="px-6 py-4 text-gray-600">{trainee.enrolledCourses?.length || 0}</td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${trainee.status === 'PASS'
                                            ? 'bg-green-100 text-green-700'
                                            : trainee.status === 'FAIL'
                                                ? 'bg-red-100 text-red-700'
                                                : trainee.status === 'RESIGN'
                                                    ? 'bg-gray-100 text-gray-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {trainee.status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedTrainee(trainee)}
                                        className="text-indigo-600 hover:underline text-sm font-medium"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {loading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
            )}

            {!loading && trainees.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No trainees found</p>
                </div>
            )}

            {/* Detail Modal */}
            {selectedTrainee && (
                <TraineeDetailModal traineeId={selectedTrainee.id} onClose={() => setSelectedTrainee(null)} />
            )}
        </div>
    );
}
