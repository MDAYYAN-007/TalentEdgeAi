'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
    ArrowLeft, Calendar, MapPin, Building, User, Star,
    CheckCircle, XCircle, Clock, FileText, Zap, Video,
    Mail, Phone, Briefcase, GraduationCap, DollarSign,
    Users, Target, BookOpen, Award, Clock4, Download,
    Send, Eye, EyeOff
} from 'lucide-react';
import { getRecruiterApplicationDetails } from '@/actions/applications/getRecruiterApplicationDetails';
import { updateApplicationStatus } from '@/actions/applications/updateApplicationStatus';
import { getJobDetails } from '@/actions/jobs/getJobDetails';
import { getApplicationStatusHistory } from '@/actions/applications/getApplicationStatusHistory';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function RecruiterApplicationDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const applicationId = params.applicationId;

    const [application, setApplication] = useState(null);
    const [fullJob, setFullJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('actions');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [notes, setNotes] = useState('');
    // Add this state variable with other state declarations
    const [statusHistory, setStatusHistory] = useState([]);

    // JWT decoding and authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/signin');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const userData = {
                name: decoded.name || 'User',
                email: decoded.email,
                role: decoded.role || 'User',
                id: decoded.id,
                orgId: decoded.orgId
            };
            setUser(userData);

            if (decoded.role && !['HR', 'SeniorHR', 'OrgAdmin'].includes(decoded.role)) {
                router.push('/dashboard');
                return;
            }

        } catch (err) {
            console.error('Invalid token', err);
            localStorage.removeItem('token');
            router.push('/signin');
        }
    }, [router]);

    // Fetch application details
    const fetchApplicationDetails = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const appResult = await getRecruiterApplicationDetails(authData, applicationId);

            if (appResult.success) {
                const applicationData = appResult.application;
                setApplication(applicationData);

                // Fetch full job details based on the application's job_id
                const jobResult = await getJobDetails(applicationData.job_id);

                if (jobResult.success) {
                    setFullJob(jobResult.job);
                } else {
                    toast.error(jobResult.message || 'Failed to load job details');
                }
            } else {
                toast.error(appResult.message || 'Failed to load application details');
                router.push('/organization/applications');
            }
        } catch (error) {
            console.error('Error fetching application or job details:', error);
            toast.error('Error loading details');
            // router.push('/organization/applications');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch application status history
    const fetchStatusHistory = async () => {
        if (!applicationId) return;

        try {
            const result = await getApplicationStatusHistory(applicationId);
            if (result.success) {
                setStatusHistory(result.history);
            } else {
                console.error('Failed to fetch status history:', result.message);
            }
        } catch (error) {
            console.error('Error fetching status history:', error);
        }
    };

    useEffect(() => {
        if (application) {
            fetchStatusHistory();
        }
    }, [application]);

    useEffect(() => {
        if (user) {
            fetchApplicationDetails();
        }
    }, [user, applicationId]);

    // Update application status
    const handleStatusUpdate = async (newStatus) => {
        if (!user || !application) return;

        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateApplicationStatus(authData, applicationId, newStatus);

            if (result.success) {
                setApplication(prev => ({ ...prev, status: newStatus }));
                toast.success(`Application ${newStatus.replace('_', ' ')}`);
            } else {
                toast.error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error updating application status');
        } finally {
            setIsUpdating(false);
        }
    };

    const openConfirmationModal = (action) => {
        setPendingAction(action);

        // Set default notes based on action
        const defaultNotes = {
            shortlisted: `Candidate ${application.applicant_name} has been shortlisted for ${application.job_title} position. Strong match based on skills and experience.`,
            test_scheduled: `Technical assessment test assigned to ${application.applicant_name} for ${application.job_title} position.`,
            interview_scheduled: `Interview scheduled with ${application.applicant_name} for ${application.job_title} position.`,
            waiting_for_result: `Interview completed with ${application.applicant_name}. Waiting for final decision.`,
            hired: `Congratulations! ${application.applicant_name} has been hired for ${application.job_title} position.`,
            rejected: `Application from ${application.applicant_name} has been rejected for ${application.job_title} position.`
        };

        setNotes(defaultNotes[action.newStatus] || '');
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setPendingAction(null);
        setNotes('');
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateApplicationStatus(authData, applicationId, pendingAction.newStatus, notes);

            if (result.success) {
                setApplication(prev => ({ ...prev, status: pendingAction.newStatus }));
                toast.success(`Application ${pendingAction.newStatus.replace('_', ' ')}`);

                // Refresh history
                await fetchStatusHistory();
                closeModal();
            } else {
                toast.error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error updating application status');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'hired':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'interview_scheduled':
                return <Video className="w-5 h-5 text-purple-500" />;
            case 'test_scheduled':
                return <Zap className="w-5 h-5 text-blue-500" />;
            case 'shortlisted':
                return <Star className="w-5 h-5 text-indigo-500" />;
            case 'waiting_for_result':
                return <Clock className="w-5 h-5 text-orange-500" />;
            case 'submitted':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            shortlisted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            test_scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            interview_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
            waiting_for_result: 'bg-orange-100 text-orange-800 border-orange-200',
            hired: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format salary
    const formatSalary = (min, max, currency = 'INR') => {
        if (!min && !max) return 'Not specified';

        const formatNumber = (num) => {
            if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
            if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
            return num.toString();
        };

        if (min && max) return `${formatNumber(min)} - ${formatNumber(max)} ${currency}`;
        if (min) return `From ${formatNumber(min)} ${currency}`;
        return `Up to ${formatNumber(max)} ${currency}`;
    };

    // Loading state
    if (!user || isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading application details...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!application) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
                        <p className="text-gray-600 mb-6">The application you're looking for doesn't exist or you don't have access to it.</p>
                        <Link
                            href="/organization/applications"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Applications
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const tabs = [
        { id: 'actions', label: 'Actions', icon: Send },
        { id: 'resume', label: 'Resume Details', icon: User },
        { id: 'job', label: 'Job Details', icon: Building },
        ...(application.ai_feedback ? [{ id: 'ai-analysis', label: 'AI Analysis', icon: Zap }] : [])
    ];

    // Action handlers
    const handleAssignTest = () => {
        console.log('Assigning test to applicant:', {
            applicantId: application.applicant_id,
            applicantName: application.applicant_name,
            jobId: application.job_id,
            jobTitle: application.job_title
        });
        toast.success('Test assignment functionality will be implemented soon');
    };

    const handleScheduleInterview = () => {
        console.log('Scheduling interview for:', {
            applicantId: application.applicant_id,
            applicantName: application.applicant_name,
            jobId: application.job_id,
            jobTitle: application.job_title,
            applicantEmail: application.applicant_email
        });
        toast.success('Interview scheduling functionality will be implemented soon');
    };

    const handleDownloadResume = () => {
        toast.success('Download functionality will be implemented soon');
    };

    const handleShareApplication = () => {
        toast.success('Share functionality will be implemented soon');
    };

    // Replace all direct handleStatusUpdate calls in availableActions with openConfirmationModal
    const getAvailableActions = () => {
        const currentStatus = application.status;

        switch (currentStatus) {
            case 'submitted':
                return [
                    {
                        id: 'shortlist',
                        label: 'Shortlist Candidate',
                        description: 'Move candidate to shortlisted pool for further evaluation',
                        icon: Star,
                        color: 'bg-indigo-600 hover:bg-indigo-700',
                        action: () => openConfirmationModal({ newStatus: 'shortlisted' })
                    },
                    {
                        id: 'assign_test',
                        label: 'Assign Test',
                        description: 'Send assessment test to evaluate candidate skills',
                        icon: Zap,
                        color: 'bg-blue-600 hover:bg-blue-700',
                        action: handleAssignTest
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview with the candidate',
                        icon: Video,
                        color: 'bg-purple-600 hover:bg-purple-700',
                        action: handleScheduleInterview
                    },
                    {
                        id: 'direct_hire',
                        label: 'Direct Hire',
                        description: 'Hire candidate directly without further process',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate at this stage',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'shortlisted':
                return [
                    {
                        id: 'assign_test',
                        label: 'Assign Test',
                        description: 'Send assessment test to evaluate candidate skills',
                        icon: Zap,
                        color: 'bg-blue-600 hover:bg-blue-700',
                        action: handleAssignTest
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview with the candidate',
                        icon: Video,
                        color: 'bg-purple-600 hover:bg-purple-700',
                        action: handleScheduleInterview
                    },
                    {
                        id: 'direct_hire',
                        label: 'Direct Hire',
                        description: 'Hire candidate directly without further process',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate at this stage',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'test_scheduled':
                return [
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview with the candidate',
                        icon: Video,
                        color: 'bg-purple-600 hover:bg-purple-700',
                        action: handleScheduleInterview
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate at this stage',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'interview_scheduled':
                return [
                    {
                        id: 'waiting_result',
                        label: 'Mark as Waiting for Result',
                        description: 'Interview completed, waiting for final decision',
                        icon: Clock,
                        color: 'bg-orange-600 hover:bg-orange-700',
                        action: () => openConfirmationModal({ newStatus: 'waiting_for_result' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate after interview',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'waiting_for_result':
                return [
                    {
                        id: 'hire',
                        label: 'Hire Candidate',
                        description: 'Final decision - Hire the candidate',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Final decision - Reject the candidate',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            default:
                return [];
        }
    };

    const availableActions = getAvailableActions();

    return (
        <>
            <Navbar />
            <Toaster position="top-right" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/organization/applications"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Applications
                            </Link>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                        <Building className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        {application.job_title}
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {application.applicant_name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">{application.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Applied {formatDate(application.applied_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm font-medium">{application.applicant_email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(application.status)} shadow-sm`}>
                                    {getStatusIcon(application.status)}
                                    <span className="font-semibold capitalize text-sm">{application.status.replace('_', ' ')}</span>
                                </div>
                                {application.resume_score > 0 && (
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getScoreColor(application.resume_score)} shadow-sm`}>
                                        <Star className="w-4 h-4" />
                                        <span className="font-semibold text-sm">{application.resume_score}% Match Score</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions - Only Download Button */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={handleDownloadResume}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Download className="w-4 h-4" />
                                Download Application
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Mobile Tab Selector */}
                    <div className="md:hidden mb-6">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-lg"
                        >
                            <span className="font-semibold text-gray-700">
                                {tabs.find(tab => tab.id === activeTab)?.label}
                            </span>
                            {isMobileMenuOpen ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>

                        {isMobileMenuOpen && (
                            <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Navigation Tabs */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-200 p-2 mb-8 shadow-lg">
                        <div className="flex gap-2">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Tab Content */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        {activeTab === 'actions' && (
                            <div className="p-6 lg:p-8">
                                <div className="mb-8">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Application Actions</h2>
                                    <p className="text-gray-600 text-lg">
                                        Current Status: <span className={`font-semibold ${getStatusColor(application.status)} px-3 py-1 rounded-full`}>
                                            {application.status.replace('_', ' ')}
                                        </span>
                                    </p>
                                </div>

                                {availableActions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableActions.map((action) => {
                                            const IconComponent = action.icon;
                                            return (
                                                <div key={action.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col h-full">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                <IconComponent className="w-6 h-6 text-gray-700" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-gray-900">{action.label}</h3>
                                                        </div>

                                                        <p className="text-gray-600 mb-6 flex-grow">
                                                            {action.description}
                                                        </p>

                                                        <button
                                                            onClick={action.action}
                                                            disabled={isUpdating}
                                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                                                        >
                                                            {isUpdating ? (
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                            ) : (
                                                                <>
                                                                    <IconComponent className="w-4 h-4" />
                                                                    {action.label}
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Actions Available</h3>
                                        <p className="text-gray-600">
                                            All actions have been completed for this application.
                                        </p>
                                    </div>
                                )}

                                {/* Status History Timeline */}
                                <div className="mt-12">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Status History</h3>
                                    {statusHistory.length > 0 ? (
                                        <div className="space-y-4">
                                            {statusHistory.map((historyItem, index) => (
                                                <div key={historyItem.id} className="flex gap-4">
                                                    {/* Timeline line */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                                        {index < statusHistory.length - 1 && (
                                                            <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-4">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                                                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(historyItem.newStatus)}`}>
                                                                    {getStatusIcon(historyItem.newStatus)}
                                                                    {historyItem.newStatus.replace('_', ' ')}
                                                                </div>
                                                                {historyItem.oldStatus && (
                                                                    <>
                                                                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(historyItem.oldStatus)}`}>
                                                                            {getStatusIcon(historyItem.oldStatus)}
                                                                            {historyItem.oldStatus.replace('_', ' ')}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                                                                {formatDate(historyItem.performedAt)}
                                                            </div>
                                                        </div>

                                                        <div className="text-sm text-gray-600 mb-2">
                                                            Updated by: <span className="font-semibold text-gray-800">
                                                                {historyItem.performerName || 'System'}
                                                            </span>
                                                            {historyItem.performerEmail && (
                                                                <span className="text-gray-500"> ({historyItem.performerEmail})</span>
                                                            )}
                                                        </div>

                                                        {historyItem.notes && (
                                                            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                                                <p className="text-sm text-gray-700 leading-relaxed">{historyItem.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                                            <Clock4 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-700 mb-2">No Status History</h4>
                                            <p className="text-gray-600">Status changes will appear here once they occur.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'resume' && (
                            <div className="p-6 lg:p-8 space-y-8">
                                {/* Personal Information */}
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Personal Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                            <p className="text-gray-900 text-lg font-semibold">{application.application_data?.basic?.name}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                            <p className="text-gray-900 text-lg">{application.application_data?.basic?.email}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                            <p className="text-gray-900 text-lg">{application.application_data?.basic?.phone}</p>
                                        </div>
                                        {application.application_data?.basic?.linkedinUrl && (
                                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
                                                <a href={application.application_data.basic.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-lg hover:text-blue-700 font-medium">
                                                    View Profile
                                                </a>
                                            </div>
                                        )}
                                        {application.application_data?.basic?.portfolioUrl && (
                                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200 shadow-sm">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio</label>
                                                <a href={application.application_data.basic.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 text-lg hover:text-orange-700 font-medium">
                                                    Visit Portfolio
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Skills */}
                                {application.application_data?.skills && application.application_data.skills.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Skills</h2>
                                        <div className="flex flex-wrap gap-3">
                                            {application.application_data.skills.map((skill, index) => (
                                                <span key={index} className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Work Experience */}
                                {application.application_data?.experiences && application.application_data.experiences.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg">
                                                <Briefcase className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            Work Experience
                                        </h2>
                                        <div className="space-y-6">
                                            {application.application_data.experiences.map((exp, index) => (
                                                <div key={index} className="border-l-4 border-indigo-500 pl-6 py-5 bg-gradient-to-r from-indigo-50 to-white rounded-r-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                                                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900">{exp.jobTitle}</h3>
                                                        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full font-semibold border shadow-sm mt-2 sm:mt-0">
                                                            {exp.duration}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg lg:text-xl text-gray-700 font-semibold mb-4">{exp.company}</p>
                                                    {exp.description && (
                                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line bg-white p-5 rounded-xl border text-lg">
                                                            {exp.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {application.application_data?.education && application.application_data.education.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <GraduationCap className="w-6 h-6 text-green-600" />
                                            </div>
                                            Education
                                        </h2>
                                        <div className="space-y-4">
                                            {application.application_data.education.map((edu, index) => (
                                                <div key={index} className="border-l-4 border-green-500 pl-6 py-5 bg-gradient-to-r from-green-50 to-white rounded-r-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                                                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900">{edu.degree}</h3>
                                                        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full font-semibold border shadow-sm mt-2 sm:mt-0">
                                                            {edu.year}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg lg:text-xl text-gray-700 font-semibold mb-3">{edu.institution}</p>
                                                    {edu.grade && (
                                                        <p className="text-gray-600 font-semibold text-lg">Grade: {edu.grade}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cover Letter */}
                                {application.cover_letter && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Cover Letter</h2>
                                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg lg:text-xl">
                                                {application.cover_letter}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'job' && fullJob && (
                            <div className="p-6 lg:p-8 space-y-8">
                                {/* Job Header */}
                                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 lg:p-8 border border-blue-200 shadow-lg">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                        <div className="flex-1">
                                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{fullJob.title}</h1>
                                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-base lg:text-lg text-gray-700">
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
                                                    <Building className="w-5 h-5 text-blue-600" />
                                                    <span className="font-semibold">{fullJob.company_name || application.department}</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
                                                    <MapPin className="w-5 h-5 text-green-600" />
                                                    <span>{fullJob.location}</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
                                                    <Users className="w-5 h-5 text-purple-600" />
                                                    <span className="capitalize">{fullJob.experience_level} Level</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl lg:w-80 w-full flex-shrink-0">
                                            <div className="text-center">
                                                <div className="text-2xl lg:text-3xl font-bold text-indigo-600 mb-3">
                                                    {formatSalary(fullJob.min_salary, fullJob.max_salary, fullJob.currency)}
                                                </div>
                                                <div className="text-gray-600 font-medium">Annual Salary Range</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Details Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Job Description */}
                                        {fullJob.job_description && (
                                            <div>
                                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    Job Overview
                                                </h2>
                                                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
                                                    <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                                                        {fullJob.job_description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Key Responsibilities */}
                                        {fullJob.responsibilities && fullJob.responsibilities.length > 0 && (
                                            <div>
                                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                                    <div className="p-2 bg-red-100 rounded-lg">
                                                        <Target className="w-6 h-6 text-red-600" />
                                                    </div>
                                                    Key Responsibilities
                                                </h2>
                                                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                                    <ul className="space-y-4">
                                                        {fullJob.responsibilities.map((responsibility, index) => (
                                                            <li key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                                                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                                                                <p className="text-gray-700 text-lg leading-relaxed flex-1">{responsibility}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Required Skills */}
                                        {fullJob.required_skills && fullJob.required_skills.length > 0 && (
                                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                    <Zap className="w-5 h-5 text-yellow-600" />
                                                    Required Skills
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {fullJob.required_skills.map((skill, index) => (
                                                        <span key={index} className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border border-yellow-200">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Qualifications */}
                                        {fullJob.qualifications && fullJob.qualifications.length > 0 && (
                                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                    <Award className="w-5 h-5 text-indigo-600" />
                                                    Qualifications
                                                </h3>
                                                <div className="space-y-3">
                                                    {fullJob.qualifications.map((qualification, index) => (
                                                        <div key={index} className="flex items-start gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                            <p className="text-base flex-1">{qualification}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Employment Details */}
                                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">Employment Details</h3>
                                            <div className="space-y-3">
                                                {fullJob.job_type && (
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-gray-600 font-medium">Job Type</span>
                                                        <span className="text-gray-900 font-semibold capitalize bg-blue-100 px-3 py-1 rounded-full text-sm">
                                                            {fullJob.job_type}
                                                        </span>
                                                    </div>
                                                )}
                                                {fullJob.work_mode && (
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-gray-600 font-medium">Work Mode</span>
                                                        <span className="text-gray-900 font-semibold capitalize bg-green-100 px-3 py-1 rounded-full text-sm">
                                                            {fullJob.work_mode}
                                                        </span>
                                                    </div>
                                                )}
                                                {fullJob.experience_level && (
                                                    <div className="flex justify-between items-center py-2">
                                                        <span className="text-gray-600 font-medium">Experience Level</span>
                                                        <span className="text-gray-900 font-semibold capitalize bg-purple-100 px-3 py-1 rounded-full text-sm">
                                                            {fullJob.experience_level}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Job Dates */}
                                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-gray-600" />
                                                Key Dates
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">Posted:</span>
                                                    <span className="font-semibold text-gray-900">{formatDate(fullJob.created_at)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">Last Updated:</span>
                                                    <span className="font-semibold text-gray-900">{formatDate(fullJob.updated_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai-analysis' && application.ai_feedback && (
                            <div className="p-6 lg:p-8 space-y-8">
                                {/* Score Overview */}
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">AI Analysis Overview</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{application.resume_score}%</div>
                                            <div className="text-lg font-semibold text-gray-700">Overall Match Score</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-3">
                                                {application.ai_feedback.objectiveScore}/30
                                            </div>
                                            <div className="text-lg font-semibold text-green-700">Objective Score</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-3">
                                                {application.ai_feedback.subjectiveScore}/70
                                            </div>
                                            <div className="text-lg font-semibold text-blue-700">Subjective Score</div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Feedback */}
                                {application.ai_feedback.explanationList && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Detailed Analysis</h2>
                                        <div className="space-y-4">
                                            {application.ai_feedback.explanationList.map((explanation, index) => {
                                                const isPositive = explanation.toLowerCase().includes('strong') ||
                                                    explanation.toLowerCase().includes('excellent') ||
                                                    explanation.toLowerCase().includes('align') ||
                                                    explanation.toLowerCase().includes('solid');

                                                return (
                                                    <div key={index} className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${isPositive ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                        <p className="text-gray-700 text-lg leading-relaxed flex-1">{explanation}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Confirmation Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Send className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Confirm Status Change</h3>
                                </div>

                                <div className="mb-6">
                                    <p className="text-gray-600 mb-4">
                                        You are about to change the status from{' '}
                                        <span className={`font-semibold ${getStatusColor(application.status)} px-2 py-1 rounded`}>
                                            {application.status.replace('_', ' ')}
                                        </span>{' '}
                                        to{' '}
                                        <span className={`font-semibold ${getStatusColor(pendingAction?.newStatus)} px-2 py-1 rounded`}>
                                            {pendingAction?.newStatus.replace('_', ' ')}
                                        </span>
                                    </p>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Add notes about this status change..."
                                            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            These notes will be saved in the status history.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={closeModal}
                                        disabled={isUpdating}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmAction}
                                        disabled={isUpdating}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Updating...
                                            </div>
                                        ) : (
                                            'Confirm Change'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div >
            <Footer />
        </>
    );
}