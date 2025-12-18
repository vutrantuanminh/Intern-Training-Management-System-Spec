import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { Search, Calendar, User, Loader2, FileText } from 'lucide-react';

interface Report {
    id: number;
    date: string;
    content: string;
    createdAt: string;
    trainee: {
        id: number;
        fullName: string;
        email: string;
        avatar?: string;
    };
}

export function TraineeReportsView() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            setLoading(true);
            const response: any = await api.get('/daily-reports?limit=100');
            setReports(response.data || []);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesSearch =
            report.trainee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.content.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = !dateFilter ||
            new Date(report.date).toISOString().split('T')[0] === dateFilter;

        return matchesSearch && matchesDate;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-gray-900">Trainee Daily Reports</h3>
                <p className="text-gray-600 mt-1">View reports submitted by trainees in your courses</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by trainee name or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                        <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        {report.trainee.avatar ? (
                                            <img src={report.trainee.avatar} alt="" className="w-12 h-12 rounded-full" />
                                        ) : (
                                            <User className="w-6 h-6 text-indigo-600" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h5 className="font-semibold text-gray-900">{report.trainee.fullName}</h5>
                                                <p className="text-gray-500 text-sm">{report.trainee.email}</p>
                                            </div>
                                            <div className="text-gray-500 text-sm flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(report.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>

                                        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-wrap">{report.content}</p>
                                        </div>

                                        <div className="text-gray-400 text-sm mt-3">
                                            Submitted {new Date(report.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                            {searchTerm || dateFilter ? 'No reports match your filters' : 'No reports submitted yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
