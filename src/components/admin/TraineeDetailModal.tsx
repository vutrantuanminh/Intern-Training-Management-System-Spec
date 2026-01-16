import { useState, useEffect } from 'react';
import { X, Mail, Calendar, Award, BookOpen, TrendingUp } from 'lucide-react';
import { supervisorService } from '../../services/trainerService';
import '../../styles/TraineeDetailModal.css';

interface TraineeDetailModalProps {
    traineeId: number;
    onClose: () => void;
}

export function TraineeDetailModal({ traineeId, onClose }: TraineeDetailModalProps) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetails();
    }, [traineeId]);

    const loadDetails = async () => {
        try {
            const response: any = await supervisorService.getTraineeDetails(traineeId);
            setDetails(response.data || response);
        } catch (error) {
            console.error('Failed to load trainee details:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trainee-modal-backdrop" onClick={onClose}>
            <div className="trainee-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="trainee-modal-header">
                    <h3 className="trainee-modal-title">Trainee Details</h3>
                    <button className="trainee-modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="trainee-modal-content">
                    {loading ? (
                        <div className="trainee-modal-loading">
                            <div className="trainee-modal-spinner" />
                        </div>
                    ) : details ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="trainee-modal-userinfo">
                                <div className="trainee-modal-avatar">
                                    {details.fullName?.charAt(0) || 'T'}
                                </div>
                                <div>
                                    <h4 className="trainee-modal-username">{details.fullName}</h4>
                                    <p className="trainee-modal-userinfo-row"><Mail size={14} /> {details.email}</p>
                                    <p className="trainee-modal-userinfo-row"><Calendar size={14} /> Joined {new Date(details.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="trainee-modal-stats">
                                <div className="trainee-modal-stat-box">
                                    <BookOpen size={18} color="#4f46e5" />
                                    <div>
                                        <p className="trainee-modal-stat-label">Enrolled Courses</p>
                                        <p className="trainee-modal-stat-value">{details.courses?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="trainee-modal-stat-box">
                                    <TrendingUp size={18} color="#059669" />
                                    <div>
                                        <p className="trainee-modal-stat-label">Avg Progress</p>
                                        <p className="trainee-modal-stat-value">
                                            {details.courses?.length > 0
                                                ? Math.round(details.courses.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / details.courses.length)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>
                                <div className="trainee-modal-stat-box">
                                    <Award size={18} color="#d97706" />
                                    <div>
                                        <p className="trainee-modal-stat-label">Avg Grade</p>
                                        <p className="trainee-modal-stat-value">N/A</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h5 className="trainee-modal-courses-title">Enrolled Courses</h5>
                                {details.courses?.map((course: any) => (
                                    <div key={course.id} className="trainee-modal-course-box">
                                        <div className="trainee-modal-course-header">
                                            <span className="trainee-modal-course-title">{course.title}</span>
                                            <span className={`trainee-modal-course-status ${course.traineeStatus === 'PASS' ? 'pass' : 'fail'}`}>
                                                {course.traineeStatus}
                                            </span>
                                        </div>
                                        <div className="trainee-modal-course-progress-label">
                                            Progress: {course.progress ?? 0}% • {course.subjects?.filter((s: any) => s.status === 'FINISHED').length || 0}/{course.subjects?.length || 0} Subjects
                                        </div>
                                        <div className="trainee-modal-course-progress-bar-bg">
                                            <div className="trainee-modal-course-progress-bar" style={{ width: `${course.progress ?? 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {details.recentReports?.length > 0 && (
                                <div>
                                    <h5 className="trainee-modal-reports-title">Recent Reports</h5>
                                    {details.recentReports.slice(0, 3).map((report: any) => (
                                        <div key={report.id} className="trainee-modal-report-box">
                                            <div className="trainee-modal-report-row">
                                                <span className="trainee-modal-report-content">{report.content}</span>
                                                <span className="trainee-modal-report-date">{new Date(report.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="trainee-modal-fail">Failed to load details</p>
                    )}
                </div>
            </div>
        </div>
    );
}
