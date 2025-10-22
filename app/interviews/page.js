'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getApplicantInterviews } from '@/actions/interviews/getApplicantInterviews';
import {
    ArrowRight, Calendar, Clock, Video, MapPin, Users,
    Building, User, AlertCircle, CheckCircle, Play, Eye,
    Star, Target, TrendingUp, ArrowLeft, ExternalLink,
    Phone, Mail, Globe, Linkedin, PhoneCall, Monitor,
    UserCheck, Clock4, XCircle, CheckCircle as CheckCircleIcon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function ApplicantInterviewsPage() {
    const router = useRouter();
    const [interviews, setInterviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState('all'); // all, scheduled, completed, cancelled, upcoming, past

    useEffect(() => {
        const checkAuthAndLoadInterviews = async () => {
            try {
                // Check authentication using new cookie-based system
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    // User not authenticated - will show beautiful unauthorized component
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);

                // Now load interviews with authenticated user
                await fetchApplicantInterviews(currentUser.id);
            } catch (error) {
                console.error('Authentication error:', error);
                setIsLoading(false);
            }
        };

        checkAuthAndLoadInterviews();
    }, [router]);

    const fetchApplicantInterviews = async (userId) => {
        try {
            const result = await getApplicantInterviews(userId);
            if (result.success) {
                setInterviews(result.interviews || []);
            } else {
                toast.error(result.message || 'Failed to load interviews');
            }
        } catch (error) {
            console.error('Error fetching interviews:', error);
            toast.error('Error loading interviews');
        } finally {
            setIsLoading(false);
        }
    };

    const getInterviewStatus = (interview) => {
        const now = new Date();
        const scheduledAt = new Date(interview.scheduled_at);
        const endTime = new Date(scheduledAt.getTime() + interview.duration_minutes * 60000);

        if (interview.status === 'completed') return 'completed';
        if (interview.status === 'cancelled') return 'cancelled';
        if (interview.status === 'rescheduled') return 'rescheduled';

        if (now > endTime) return 'completed';
        if (now >= scheduledAt && now <= endTime) return 'in_progress';
        if (now < scheduledAt) return 'scheduled';

        return 'scheduled';
    };

    const getStatusColor = (status) => {
        const colors = {
            scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            in_progress: 'bg-green-100 text-green-800 border-green-200',
            completed: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            rescheduled: 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'in_progress':
                return <Play className="w-4 h-4" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4" />;
            case 'rescheduled':
                return <Clock4 className="w-4 h-4" />;
            default:
                return <Calendar className="w-4 h-4" />;
        }
    };

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'google_meet':
                return <Video className="w-4 h-4 text-red-500" />;
            case 'zoom':
                return <Video className="w-4 h-4 text-blue-500" />;
            case 'teams':
                return <Video className="w-4 h-4 text-purple-500" />;
            case 'phone':
                return <Phone className="w-4 h-4 text-green-500" />;
            case 'in_person':
                return <MapPin className="w-4 h-4 text-orange-500" />;
            default:
                return <Video className="w-4 h-4 text-gray-500" />;
        }
    };

    const getPlatformDisplayName = (platform) => {
        const names = {
            'google_meet': 'Google Meet',
            'zoom': 'Zoom',
            'teams': 'Microsoft Teams',
            'phone': 'Phone Call',
            'in_person': 'In Person',
            'other': 'Other Platform'
        };
        return names[platform] || platform;
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

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeUntilInterview = (scheduledAt) => {
        if (!scheduledAt) return null;
        const now = new Date();
        const scheduled = new Date(scheduledAt);
        const diffMs = scheduled - now;

        if (diffMs <= 0) return null;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const isInterviewStartingSoon = (scheduledAt) => {
        if (!scheduledAt) return false;
        const now = new Date();
        const scheduled = new Date(scheduledAt);
        const diffMs = scheduled - now;
        return diffMs > 0 && diffMs <= 30 * 60 * 1000; // 30 minutes
    };

    const handleJoinInterview = (interview) => {
        if (interview.meeting_platform === 'in_person') {
            toast.success('In-person interview scheduled');
            if (interview.meeting_location) {
                window.open(`https://maps.google.com/?q=${encodeURIComponent(interview.meeting_location)}`, '_blank');
            }
        } else if (interview.meeting_platform === 'phone' && interview.meeting_link) {
            window.open(`tel:${interview.meeting_link}`, '_blank');
        } else if (interview.meeting_link) {
            window.open(interview.meeting_link, '_blank');
        } else {
            toast.error('No meeting link provided for this interview');
        }
    };

    const handleViewApplication = (applicationId) => {
        router.push(`/applications/${applicationId}`);
    };

    const handleViewJob = (jobId) => {
        router.push(`/jobs/${jobId}`);
    };

    const filteredInterviews = interviews.filter(interview => {
        const status = getInterviewStatus(interview);
        const now = new Date();
        const scheduledAt = new Date(interview.scheduled_at);

        if (filter === 'all') return true;
        if (filter === 'upcoming') return status === 'scheduled' && scheduledAt > now;
        if (filter === 'past') return scheduledAt < now;
        return status === filter;
    });

    const statusCounts = {
        all: interviews.length,
        scheduled: interviews.filter(interview => getInterviewStatus(interview) === 'scheduled').length,
        in_progress: interviews.filter(interview => getInterviewStatus(interview) === 'in_progress').length,
        completed: interviews.filter(interview => getInterviewStatus(interview) === 'completed').length,
        cancelled: interviews.filter(interview => getInterviewStatus(interview) === 'cancelled').length,
        rescheduled: interviews.filter(interview => getInterviewStatus(interview) === 'rescheduled').length,
        upcoming: interviews.filter(interview => {
            const status = getInterviewStatus(interview);
            const scheduledAt = new Date(interview.scheduled_at);
            return status === 'scheduled' && scheduledAt > new Date();
        }).length,
        past: interviews.filter(interview => new Date(interview.scheduled_at) < new Date()).length,
    };

    // Unauthenticated Component
    const UnauthenticatedComponent = () => (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
                <div className="max-w-md w-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                                <Video className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Sign In Required
                                </h1>
                                <p className="text-slate-600">
                                    Please sign in to view your interviews.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/signin')}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                >
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );

    if (isLoading) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-lg mx-auto mb-6 flex items-center justify-center">
                            <Video className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Loading Interviews
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Fetching your interview schedule...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user && !isLoading) {
        return <UnauthenticatedComponent />;
    }

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center gap-4 mb-6">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Dashboard
                            </Link>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-100 rounded-lg shadow-sm">
                                        <Video className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        My Interviews
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    Interview Schedule
                                </h1>

                                <p className="text-gray-600 text-lg max-w-2xl">
                                    Manage and join your scheduled interviews. Track your interview progress and outcomes.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg lg:w-80">
                                    <div className="text-center">
                                        <div className="text-2xl lg:text-3xl font-bold text-purple-600 mb-2">
                                            {interviews.length}
                                        </div>
                                        <div className="text-gray-600 font-medium">Total Interviews Scheduled</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats and Filters */}
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Interview Overview</h2>
                                    <p className="text-gray-600">
                                        Track your interview schedule and participation
                                    </p>
                                </div>

                                {/* Status Filters */}
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'all', label: 'All Interviews', count: statusCounts.all },
                                        { key: 'upcoming', label: 'Upcoming', count: statusCounts.upcoming },
                                        { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled },
                                        { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
                                        { key: 'completed', label: 'Completed', count: statusCounts.completed },
                                        { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
                                    ].map(({ key, label, count }) => (
                                        <button
                                            key={key}
                                            onClick={() => setFilter(key)}
                                            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${filter === key
                                                ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span>{label}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${filter === key
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                {count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {statusCounts.upcoming}
                                    </div>
                                    <div className="text-sm text-blue-700 font-medium">Upcoming</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {statusCounts.in_progress}
                                    </div>
                                    <div className="text-sm text-green-700 font-medium">In Progress</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                                    <div className="text-2xl font-bold text-gray-600 mb-1">
                                        {statusCounts.completed}
                                    </div>
                                    <div className="text-sm text-gray-700 font-medium">Completed</div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
                                    <div className="text-2xl font-bold text-red-600 mb-1">
                                        {statusCounts.cancelled}
                                    </div>
                                    <div className="text-sm text-red-700 font-medium">Cancelled</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interviews List */}
                    <div className="space-y-6">
                        {filteredInterviews.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Video className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {filter === 'all' ? 'No Interviews Scheduled' : `No ${filter.replace('_', ' ')} interviews`}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {filter === 'all'
                                        ? "You don't have any interviews scheduled yet. Check back later for new interview invitations."
                                        : `You don't have any ${filter.replace('_', ' ')} interviews at the moment.`
                                    }
                                </p>
                                <Link
                                    href="/applications"
                                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Applications
                                </Link>
                            </div>
                        ) : (
                            filteredInterviews.map((interview) => {
                                const status = getInterviewStatus(interview);
                                const timeUntilInterview = getTimeUntilInterview(interview.scheduled_at);
                                const isStartingSoon = isInterviewStartingSoon(interview.scheduled_at);
                                const endTime = new Date(new Date(interview.scheduled_at).getTime() + interview.duration_minutes * 60000);

                                return (
                                    <div key={interview.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                            <div className="flex-1">
                                                {/* Interview Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-purple-100 rounded-lg">
                                                            <Video className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900 capitalize">
                                                                {interview.interview_type?.replace('_', ' ') || 'Interview'}
                                                            </h3>
                                                            <p className="text-gray-600 text-sm">
                                                                For: <span className="font-semibold">{interview.job_title}</span> at <span className="font-semibold">{interview.company_name}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {isStartingSoon && status === 'scheduled' && (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold border border-amber-200">
                                                                <Clock className="w-4 h-4" />
                                                                Starting Soon
                                                            </div>
                                                        )}
                                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
                                                            {getStatusIcon(status)}
                                                            {status.replace('_', ' ')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Interview Details Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="text-sm text-gray-600 font-medium">Date & Time</div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {formatDateTime(interview.scheduled_at)}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="text-sm text-gray-600 font-medium">Duration</div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {interview.duration_minutes} mins
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="text-sm text-gray-600 font-medium">Platform</div>
                                                        <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                            {getPlatformIcon(interview.meeting_platform)}
                                                            {getPlatformDisplayName(interview.meeting_platform)}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="text-sm text-gray-600 font-medium">Interviewers</div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {interview.interviewer_names?.length || interview.interviewer_count || 0}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Meeting Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                                    <div className="space-y-2">
                                                        {interview.meeting_platform === 'in_person' ? (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>Location: {interview.meeting_location || 'Not specified'}</span>
                                                            </div>
                                                        ) : interview.meeting_platform === 'phone' ? (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4" />
                                                                <span>Phone: {interview.meeting_link || 'Number not provided'}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Video className="w-4 h-4" />
                                                                <span>Link: {interview.meeting_link ? (
                                                                    <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
                                                                        Join Meeting
                                                                    </a>
                                                                ) : 'Not provided'}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Scheduled: {formatDateTime(interview.created_at)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {interview.interviewer_names && interview.interviewer_names.length > 0 && (
                                                            <div className="flex items-start gap-2">
                                                                <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                <span>Interviewers: {interview.interviewer_names.join(', ')}</span>
                                                            </div>
                                                        )}
                                                        {timeUntilInterview && status === 'scheduled' && (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-blue-600" />
                                                                <span className="text-blue-600 font-medium">
                                                                    Starts in {timeUntilInterview}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Interview Notes */}
                                                {interview.notes && (
                                                    <div className="mb-4">
                                                        <div className="text-sm font-semibold text-gray-700 mb-2">Interview Notes</div>
                                                        <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border">
                                                            {interview.notes}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Status Information */}
                                                {status === 'completed' && interview.feedback && (
                                                    <div className="mb-4">
                                                        <div className="text-sm font-semibold text-gray-700 mb-2">Feedback</div>
                                                        <p className="text-gray-600 text-sm leading-relaxed bg-green-50 p-3 rounded-lg border border-green-200">
                                                            {interview.feedback}
                                                        </p>
                                                    </div>
                                                )}

                                                {status === 'cancelled' && interview.cancellation_reason && (
                                                    <div className="mb-4">
                                                        <div className="text-sm font-semibold text-gray-700 mb-2">Cancellation Reason</div>
                                                        <p className="text-gray-600 text-sm leading-relaxed bg-red-50 p-3 rounded-lg border border-red-200">
                                                            {interview.cancellation_reason}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col gap-3 lg:w-48">
                                                {(status === 'scheduled' || status === 'in_progress') && (
                                                    <button
                                                        onClick={() => handleJoinInterview(interview)}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                    >
                                                        {interview.meeting_platform === 'in_person' ? (
                                                            <>
                                                                <MapPin className="w-4 h-4" />
                                                                View Location
                                                            </>
                                                        ) : interview.meeting_platform === 'phone' ? (
                                                            <>
                                                                <Phone className="w-4 h-4" />
                                                                Call Now
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Video className="w-4 h-4" />
                                                                Join Interview
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {status === 'completed' && (
                                                    <div className="text-center text-green-600 text-sm font-medium p-3 bg-green-50 rounded-lg border border-green-200">
                                                        <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                                                        Interview Completed
                                                    </div>
                                                )}

                                                {status === 'cancelled' && (
                                                    <div className="text-center text-red-600 text-sm font-medium p-3 bg-red-50 rounded-lg border border-red-200">
                                                        <XCircle className="w-4 h-4 inline mr-1" />
                                                        Interview Cancelled
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleViewApplication(interview.application_id)}
                                                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-all duration-200 font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Application
                                                </button>

                                                <button
                                                    onClick={() => handleViewJob(interview.job_id)}
                                                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-300 text-purple-700 rounded-lg hover:border-purple-400 transition-all duration-200 font-medium"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    View Job
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}