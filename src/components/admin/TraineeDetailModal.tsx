import { useState, useEffect } from 'react';
import { X, Mail, Calendar, Award, BookOpen, TrendingUp } from 'lucide-react';
import { supervisorService } from '../../services/trainerService';

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
        // Backdrop - full screen overlay with blur
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            {/* Modal Container - Fixed size popup */}
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    width: '420px',
                    height: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        backgroundColor: 'white',
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                        Trainee Details
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '8px',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px',
                    }}
                >
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : details ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* User Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'linear-gradient(to right, #eef2ff, #faf5ff)', borderRadius: '8px' }}>
                                <div style={{ width: '48px', height: '48px', backgroundColor: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                                    {details.fullName?.charAt(0) || 'T'}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{details.fullName}</h4>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={14} /> {details.email}
                                    </p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={14} /> Joined {new Date(details.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={18} color="#4f46e5" />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Enrolled Courses</p>
                                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{details.courses?.length || 0}</p>
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={18} color="#059669" />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Avg Progress</p>
                                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                                            {details.courses?.length > 0
                                                ? Math.round(details.courses.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / details.courses.length)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Award size={18} color="#d97706" />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Avg Grade</p>
                                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>N/A</p>
                                    </div>
                                </div>
                            </div>

                            {/* Courses */}
                            <div>
                                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Enrolled Courses</h5>
                                {details.courses?.map((course: any) => (
                                    <div key={course.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>{course.title}</span>
                                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', backgroundColor: course.traineeStatus === 'PASS' ? '#dcfce7' : '#dbeafe', color: course.traineeStatus === 'PASS' ? '#166534' : '#1e40af' }}>
                                                {course.traineeStatus}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                                            Progress: {course.progress ?? 0}% • {course.subjects?.filter((s: any) => s.status === 'FINISHED').length || 0}/{course.subjects?.length || 0} Subjects
                                        </div>
                                        <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px' }}>
                                            <div style={{ height: '6px', backgroundColor: '#4f46e5', borderRadius: '3px', width: `${course.progress ?? 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Reports */}
                            {details.recentReports?.length > 0 && (
                                <div>
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Recent Reports</h5>
                                    {details.recentReports.slice(0, 3).map((report: any) => (
                                        <div key={report.id} style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                <span style={{ color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.content}</span>
                                                <span style={{ color: '#9ca3af', marginLeft: '8px', flexShrink: 0 }}>{new Date(report.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#6b7280' }}>Failed to load details</p>
                    )}
                </div>
            </div>
        </div>
    );
}
