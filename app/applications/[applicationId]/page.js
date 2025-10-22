'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getApplicationDetails } from '@/actions/applications/getApplicationDetails';
import { getApplicationStatusHistory } from '@/actions/applications/getApplicationStatusHistory';
import { getTestsForApplication } from '@/actions/tests/getTestsForApplication';
import { getInterviewsForApplication } from '@/actions/interviews/getInterviewsForApplication';
import {
    ArrowLeft, Calendar, MapPin, Building, Clock, User,
    CheckCircle, XCircle, Clock4, AlertCircle, FileText,
    TrendingUp, Star, Zap, Target, Award, Briefcase,
    GraduationCap, BookOpen, Phone, Mail, Globe, Linkedin,
    Download, Share, Eye, Sparkles, Video, Play, FileCheck,
    Users, ExternalLink, Mail as MailIcon, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { getTestResults } from '@/actions/tests/getTestResults';
import { getTestAttemptId } from '@/actions/tests/getTestAttemptId';
import { getCurrentUser } from '@/actions/auth/auth-utils';

export default function ApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.applicationId;

    const [application, setApplication] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [testAssignments, setTestAssignments] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [isLoadingTests, setIsLoadingTests] = useState(false);
    const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [selectedTestAssignment, setSelectedTestAssignment] = useState(null);
    const [detailedTestResult, setDetailedTestResult] = useState(null);
    const [isLoadingResult, setIsLoadingResult] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUserAndApplication = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    toast.error('Please sign in to view application details');
                    router.push('/signin');
                    return;
                }

                setUser(currentUser);
                await fetchApplicationDetails(applicationId, currentUser.id);
            } catch (error) {
                console.error('Error fetching user:', error);
                toast.error('Please sign in to view application details');
                router.push('/signin');
            }
        };

        fetchUserAndApplication();
    }, [applicationId, router]);

    const fetchApplicationDetails = async (appId, userId) => {
        try {
            const result = await getApplicationDetails(appId, userId);
            if (result.success) {
                setApplication(result.application);

                await Promise.all([
                    fetchStatusHistory(appId),
                    fetchTestAssignments(appId),
                    fetchInterviews(appId)
                ]);
            } else {
                toast.error('Failed to load application details');
                router.push('/applications');
            }
        } catch (error) {
            console.error('Error fetching application details:', error);
            toast.error('Error loading application details');
            router.push('/applications');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStatusHistory = async (appId) => {
        try {
            const result = await getApplicationStatusHistory(appId);
            if (result.success) {
                setStatusHistory(result.history);
            }
        } catch (error) {
            console.error('Error fetching status history:', error);
        }
    };

    const fetchTestAssignments = async (appId) => {
        setIsLoadingTests(true);
        try {
            const result = await getTestsForApplication(appId);
            if (result.success) {
                console.log(result)
                setTestAssignments(result.tests || []);
            }
        } catch (error) {
            console.error('Error fetching test assignments:', error);
        } finally {
            setIsLoadingTests(false);
        }
    };

    const fetchInterviews = async (appId) => {
        setIsLoadingInterviews(true);
        try {
            const result = await getInterviewsForApplication(appId);
            if (result.success) {
                setInterviews(result.interviews || []);
            }
        } catch (error) {
            console.error('Error fetching interviews:', error);
        } finally {
            setIsLoadingInterviews(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'hired':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'interview_scheduled':
                return <Video className="w-5 h-5 text-purple-600" />;
            case 'test_scheduled':
                return <Zap className="w-5 h-5 text-blue-600" />;
            case 'test_completed':
                return <FileCheck className="w-5 h-5 text-green-600" />;
            case 'shortlisted':
                return <Star className="w-5 h-5 text-indigo-600" />;
            case 'waiting_for_result':
                return <Clock className="w-5 h-5 text-orange-600" />;
            case 'submitted':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            shortlisted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            test_scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            test_completed: 'bg-green-100 text-green-800 border-green-200',
            interview_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
            waiting_for_result: 'bg-orange-100 text-orange-800 border-orange-200',
            hired: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getTestStatusColor = (status) => {
        const colors = {
            assigned: 'bg-blue-100 text-blue-800 border-blue-200',
            attempted: 'bg-green-100 text-green-800 border-green-200',
            expired: 'bg-red-100 text-red-800 border-red-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getInterviewStatusColor = (status, scheduledAt) => {
        const now = new Date();
        const interviewTime = new Date(scheduledAt);

        if (status === 'scheduled' && now > interviewTime) {
            return 'bg-amber-100 text-amber-800 border-amber-200';
        }

        const colors = {
            scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            rescheduled: 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getInterviewStatusIcon = (status, scheduledAt) => {
        const now = new Date();
        const interviewTime = new Date(scheduledAt);

        if (status === 'scheduled' && now > interviewTime) {
            return <AlertCircle className="w-4 h-4 text-amber-600" />;
        }

        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-600" />;
            case 'rescheduled':
                return <Clock4 className="w-4 h-4 text-purple-600" />;
            case 'scheduled':
                return <Calendar className="w-4 h-4 text-blue-600" />;
            default:
                return <Calendar className="w-4 h-4 text-gray-600" />;
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-700 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-red-700 bg-red-50 border-red-200';
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

    const handleTakeTest = (testAssignment) => {
        console.log('Taking test:', testAssignment);
        router.push(`/tests/${testAssignment.id}`);
    };

    // Update the handleViewTestResults function
    const handleViewTestResults = async (testAssignment) => {
        setSelectedTestAssignment(testAssignment);
        setIsLoadingResult(true);
        setIsResultModalOpen(true);

        try {
            // First get the attempt ID
            const attemptResult = await getTestAttemptId(testAssignment.test_id, applicationId);
            console.log('Attempt result:', attemptResult);

            if (attemptResult.success && attemptResult.attempt) {
                console.log('Found attempt ID:', attemptResult.attempt.id);

                // Then get detailed results using the attempt ID
                const result = await getTestResults(attemptResult.attempt.id, user.id);
                console.log('Detailed result:', result);

                if (result.success) {
                    setDetailedTestResult(result.data);
                } else {
                    toast.error(result.message || 'Failed to load test results');
                    setDetailedTestResult(null);
                }
            } else {
                toast.error(attemptResult.message || 'No test attempt found');
                setDetailedTestResult(null);
            }
        } catch (error) {
            console.error('Error fetching test results:', error);
            toast.error('Error loading test results');
            setDetailedTestResult(null);
        } finally {
            setIsLoadingResult(false);
        }
    };

    const handleJoinInterview = (interview) => {
        if (interview.meeting_link) {
            window.open(interview.meeting_link, '_blank');
        } else {
            toast.error('No meeting link provided for this interview');
        }
    };

    const TestAssignmentsSection = () => {
        if (isLoadingTests) {
            return (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Test Assignments</h3>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading test assignments...</p>
                    </div>
                </div>
            );
        }

        if (testAssignments.length === 0) {
            return null;
        }

        return (
            <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Test Assignments</h3>
                <div className="space-y-6">
                    {testAssignments.map((test) => (
                        <div key={test.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                <div className="flex-1">
                                    {/* Test Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900">{test.test_title}</h4>
                                                <p className="text-gray-600 text-sm">
                                                    Assigned by: <span className="font-semibold">{test.assigned_by_name}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getTestStatusColor(test.status)}`}>
                                            {test.status === 'assigned' && <Clock className="w-4 h-4" />}
                                            {test.status === 'attempted' && <FileCheck className="w-4 h-4" />}
                                            {test.status === 'expired' && <XCircle className="w-4 h-4" />}
                                            {test.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                                            {test.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    {/* Test Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="text-sm text-gray-600 font-medium">Duration</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {test.duration_minutes} mins
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="text-sm text-gray-600 font-medium">Total Marks</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {test.total_marks}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="text-sm text-gray-600 font-medium">Passing Percentage</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {test.passing_percentage}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="text-sm text-gray-600 font-medium">Test Type</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {test.is_proctored ? 'Proctored' : 'Regular'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Description */}
                                    {test.test_description && (
                                        <div className="mb-4">
                                            <div className="text-sm font-semibold text-gray-700 mb-2">Description</div>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {test.test_description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Timing Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Assigned: {formatDateTime(test.assigned_at)}</span>
                                            </div>
                                            {test.test_start_date && (
                                                <div className="flex items-center gap-2">
                                                    <Play className="w-4 h-4" />
                                                    <span>Start: {formatDateTime(test.test_start_date)}</span>
                                                </div>
                                            )}
                                            {test.test_end_date && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>End: {formatDateTime(test.test_end_date)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {test.is_proctored && (
                                                <div className="flex items-center gap-2">
                                                    <Eye className="w-4 h-4 text-blue-600" />
                                                    <span className="text-blue-600 font-medium">Proctored Test</span>
                                                </div>
                                            )}
                                            {test.proctoring_settings && (
                                                <div className="text-xs text-gray-500">
                                                    {test.proctoring_settings.fullscreen_required && 'Fullscreen • '}
                                                    {test.proctoring_settings.copy_paste_prevention && 'Copy Prevention • '}
                                                    {test.proctoring_settings.tab_switching_detection && 'Tab Switching Detection'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score Display */}
                                    {test.score !== null && test.score !== undefined ? (
                                        <div className="flex items-center gap-4">
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getScoreColor(test.score)}`}>
                                                <Star className="w-4 h-4" />
                                                <span className="font-semibold">Score: {test.score}%</span>
                                            </div>
                                            {test.passing_marks && (
                                                <div className={`text-sm font-medium ${test.score >= test.passing_marks ? 'text-green-600' : 'text-red-600'}`}>
                                                    {test.score >= test.passing_marks ? 'Passed' : 'Failed'}
                                                    (Required: {test.passing_marks}%)
                                                </div>
                                            )}
                                        </div>
                                    ) : test.status === 'attempted' && (
                                        <div className="text-sm text-gray-500">
                                            Test completed - Score pending evaluation
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 lg:w-48">
                                    {test.status === 'assigned' && (
                                        <button
                                            onClick={() => handleTakeTest(test)}
                                            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                        >
                                            <Play className="w-4 h-4" />
                                            Take Test
                                        </button>
                                    )}
                                    {test.status === 'attempted' && (
                                        <button
                                            onClick={() => handleViewTestResults(test)}
                                            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                        >
                                            <FileCheck className="w-4 h-4" />
                                            View Results
                                        </button>
                                    )}
                                    {(test.status === 'expired' || test.status === 'cancelled') && (
                                        <div className="text-center text-gray-500 text-sm">
                                            This test is no longer available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const InterviewsSection = () => {
        if (isLoadingInterviews) {
            return (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Interview Schedule</h3>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading interviews...</p>
                    </div>
                </div>
            );
        }

        if (interviews.length === 0) {
            return null;
        }

        return (
            <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Interview Schedule</h3>
                <div className="space-y-6">
                    {interviews.map((interview) => {
                        const isCompleted = new Date() > new Date(interview.scheduled_at) && interview.status === 'scheduled';

                        return (
                            <div key={interview.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                        {/* Interview Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <Video className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900 capitalize">
                                                        {interview.interview_type?.replace('_', ' ') || 'Interview'}
                                                    </h4>
                                                    <p className="text-gray-600 text-sm">
                                                        Scheduled by: <span className="font-semibold">{interview.scheduled_by_name}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getInterviewStatusColor(interview.status, interview.scheduled_at)}`}>
                                                {getInterviewStatusIcon(interview.status, interview.scheduled_at)}
                                                {interview.status === 'scheduled' && isCompleted ? 'Time Completed' : interview.status.replace('_', ' ')}
                                            </div>
                                        </div>

                                        {/* Interview Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Date & Time</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {formatDateTime(interview.scheduled_at)}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Duration</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {interview.duration_minutes} mins
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Platform</div>
                                                <div className="text-lg font-semibold text-gray-900 capitalize">
                                                    {interview.meeting_platform?.replace('_', ' ') || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Interviewers</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {interview.interviewer_names?.length || 0}
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
                                                ) : interview.meeting_platform !== 'phone' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Video className="w-4 h-4" />
                                                        <span>Link: {interview.meeting_link ? (
                                                            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
                                                                Join Meeting
                                                            </a>
                                                        ) : 'Not provided'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        <span>Phone Interview</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {interview.interviewer_names && interview.interviewer_names.length > 0 && (
                                                    <div className="flex items-start gap-2">
                                                        <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                        <span>Interviewers: {interview.interviewer_names.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {interview.notes && (
                                            <div className="mb-4">
                                                <div className="text-sm font-semibold text-gray-700 mb-2">Notes</div>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    {interview.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Status Alert for Completed Time */}
                                        {isCompleted && (
                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-center gap-2 text-amber-800">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="font-medium">Interview time has completed</span>
                                                    <span className="text-sm">- Please wait for further instructions</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3 lg:w-48">
                                        {interview.status === 'scheduled' && interview.meeting_platform !== 'in_person' && interview.meeting_platform !== 'phone' && interview.meeting_link && (
                                            <button
                                                onClick={() => handleJoinInterview(interview)}
                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Join Interview
                                            </button>
                                        )}
                                        {interview.status === 'completed' && (
                                            <div className="text-center text-green-600 text-sm font-medium">
                                                Interview Completed
                                            </div>
                                        )}
                                        {interview.status === 'cancelled' && (
                                            <div className="text-center text-red-600 text-sm font-medium">
                                                Interview Cancelled
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const UnauthenticatedComponent = () => (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="max-w-md w-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                <FileText className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Authentication Required
                                </h1>
                                <p className="text-slate-600">
                                    You need to be signed in to view application details.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/signin')}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
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

    const StatusHistorySection = () => {
        if (statusHistory.length === 0) {
            return null;
        }

        return (
            <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Application Status History</h3>
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
            </div>
        );
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-lg mx-auto mb-6 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Loading Application Details
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Fetching your application information...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user && !isLoading) {
        return <UnauthenticatedComponent />;
    }

    if (!application) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
                        <p className="text-gray-600 mb-6">The application you're looking for doesn't exist or you don't have access to it.</p>
                        <Link
                            href="/applications"
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
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'actions', label: 'Application Status', icon: TrendingUp },
        { id: 'application', label: 'Full Application', icon: FileText },
        ...(application.aiFeedback ? [{ id: 'ai-analysis', label: 'AI Analysis', icon: Target }] : [])
    ];

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/applications"
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
                                        {application.companyName}
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {application.jobTitle}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">{application.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Applied {formatDate(application.appliedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="text-sm font-medium capitalize">{application.experienceLevel}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(application.status)} shadow-sm`}>
                                    {getStatusIcon(application.status)}
                                    <span className="font-semibold capitalize text-sm">{application.status.replace('_', ' ')}</span>
                                </div>
                                {application.resumeScore > 0 && (
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getScoreColor(application.resumeScore)} shadow-sm`}>
                                        <Star className="w-4 h-4" />
                                        <span className="font-semibold text-sm">{application.resumeScore}% Match Score</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Mobile Tab Selector */}
                    <div className="md:hidden mb-6">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="cursor-pointer w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-lg"
                        >
                            <span className="font-semibold text-gray-700">
                                {tabs.find(tab => tab.id === activeTab)?.label}
                            </span>
                            {isMobileMenuOpen ? <Eye className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>

                        {isMobileMenuOpen && (
                            <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                                {tabs.map((tab) => {
                                    const IconComponent = tab.icon;
                                    return (
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
                                            <IconComponent className="w-5 h-5" />
                                            <span className="font-medium">{tab.label}</span>
                                        </button>
                                    );
                                })}
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
                                        className={`cursor-pointer flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap overflow-y-hidden ${activeTab === tab.id
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
                        {activeTab === 'overview' && (
                            <div className="p-4 lg:p-8 space-y-8">
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Application Summary</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-5 h-5 text-blue-600" />
                                                <span className="font-semibold text-gray-900">Experience Level</span>
                                            </div>
                                            <p className="text-gray-700 text-lg font-medium capitalize">{application.experienceLevel}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Briefcase className="w-5 h-5 text-green-600" />
                                                <span className="font-semibold text-gray-900">Job Type</span>
                                            </div>
                                            <p className="text-gray-700 text-lg font-medium capitalize">{application.jobType}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-5 h-5 text-purple-600" />
                                                <span className="font-semibold text-gray-900">Work Mode</span>
                                            </div>
                                            <p className="text-gray-700 text-lg font-medium capitalize">{application.workMode}</p>
                                        </div>
                                    </div>

                                    {application.aiFeedback && (
                                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                                AI Score Breakdown
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                                                        {application.resumeScore}%
                                                    </div>
                                                    <div className="text-sm text-gray-600">Overall Match Score</div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700">Objective Score</span>
                                                        <span className="font-semibold text-green-600">
                                                            {application.aiFeedback.objectiveScore}/30
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700">Subjective Score</span>
                                                        <span className="font-semibold text-blue-600">
                                                            {application.aiFeedback.subjectiveScore}/70
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Test Assignments Section */}
                                <TestAssignmentsSection />

                                {/* Interviews Section */}
                                <InterviewsSection />
                            </div>
                        )}

                        {activeTab === 'actions' && (
                            <div className="p-4 lg:p-8">
                                <div className="mb-8">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Application Status & Actions</h2>
                                    <p className="text-gray-600 text-lg">
                                        Current Status: <span className={`font-semibold ${getStatusColor(application.status)} px-3 py-1 rounded-full`}>
                                            {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </p>
                                </div>

                                {/* Test Assignments Section */}
                                <TestAssignmentsSection />

                                {/* Interviews Section */}
                                <InterviewsSection />

                                {/* Status History */}
                                <StatusHistorySection />
                            </div>
                        )}

                        {activeTab === 'ai-analysis' && application.aiFeedback && (
                            <div className="p-4 lg:p-8 space-y-8">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">AI Resume Analysis</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-200 shadow-sm">
                                        <div className="text-3xl font-bold text-indigo-600 mb-2">{application.resumeScore}%</div>
                                        <div className="text-indigo-700 font-medium">Overall Match</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border border-green-200 shadow-sm">
                                        <div className="text-2xl font-bold text-green-600 mb-2">{application.aiFeedback.objectiveScore}/30</div>
                                        <div className="text-green-700 font-medium">Objective Score</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 text-center border border-blue-200 shadow-sm">
                                        <div className="text-2xl font-bold text-blue-600 mb-2">{application.aiFeedback.subjectiveScore}/70</div>
                                        <div className="text-blue-700 font-medium">Subjective Score</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            Key Strengths
                                        </h3>
                                        <div className="space-y-3">
                                            {application?.aiFeedback?.explanationList?.map((explanation, index) => (
                                                <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${explanation.toLowerCase().includes('exceed') ||
                                                        explanation.toLowerCase().includes('solid') ||
                                                        explanation.toLowerCase().includes('strong') ||
                                                        explanation.toLowerCase().includes('align')
                                                        ? 'bg-green-500' : 'bg-amber-500'
                                                        }`}></div>
                                                    <p className="text-gray-700 leading-relaxed flex-1">{explanation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-amber-600" />
                                            Improvement Suggestions
                                        </h3>
                                        <div className="space-y-3">
                                            {application?.aiImprovementSuggestions?.map((suggestion, index) => (
                                                <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                                    <span className="text-amber-600 font-medium mt-0.5 flex-shrink-0">{index + 1}.</span>
                                                    <p className="text-gray-700 leading-relaxed flex-1">{suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai-analysis' && !application.aiFeedback && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Target className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Analysis Available</h3>
                                <p className="text-gray-600">
                                    AI analysis was not performed for this application.
                                </p>
                            </div>
                        )}

                        {activeTab === 'application' && (
                            <div className="p-4 lg:p-8 space-y-8">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Complete Application Details</h2>

                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Personal Information
                                    </h3>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                <label className="block text-sm font-medium text-blue-700 mb-1">Full Name</label>
                                                <p className="text-gray-900 font-medium text-lg">{application.applicationData.basic.name}</p>
                                            </div>
                                            <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                                                <p className="text-gray-900 font-medium text-lg">{application.applicationData.basic.email}</p>
                                            </div>
                                            <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                <label className="block text-sm font-medium text-blue-700 mb-1">Phone</label>
                                                <p className="text-gray-900 font-medium text-lg">{application.applicationData.basic.phone}</p>
                                            </div>
                                            {application.applicationData.basic.linkedinUrl && (
                                                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                    <label className="block text-sm font-medium text-blue-700 mb-1">LinkedIn</label>
                                                    <a href={application.applicationData.basic.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium text-lg hover:text-blue-700">
                                                        View Profile
                                                    </a>
                                                </div>
                                            )}
                                            {application.applicationData.basic.portfolioUrl && (
                                                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                    <label className="block text-sm font-medium text-blue-700 mb-1">Portfolio</label>
                                                    <a href={application.applicationData.basic.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium text-lg hover:text-indigo-700">
                                                        Visit Portfolio
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {application.applicationData.skills && application.applicationData.skills.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-amber-600" />
                                            Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {application.applicationData.skills.map((skill, index) => (
                                                <span key={index} className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {application.applicationData.experiences && application.applicationData.experiences.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-green-600" />
                                            Work Experience
                                        </h3>
                                        <div className="space-y-6">
                                            {application.applicationData.experiences.map((exp, index) => (
                                                <div key={index} className="border-l-4 border-green-500 pl-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-r-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                                                        <h4 className="text-xl font-bold text-gray-900">{exp.jobTitle}</h4>
                                                        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full font-semibold border shadow-sm mt-2 sm:mt-0">
                                                            {exp.duration}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg text-gray-700 font-semibold mb-4">{exp.company}</p>
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

                                {application.applicationData.education && application.applicationData.education.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-purple-600" />
                                            Education
                                        </h3>
                                        <div className="space-y-4">
                                            {application.applicationData.education.map((edu, index) => (
                                                <div key={index} className="border-l-4 border-purple-500 pl-6 py-5 bg-gradient-to-r from-purple-50 to-violet-50 rounded-r-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                                                        <h4 className="text-xl font-bold text-gray-900">{edu.degree}</h4>
                                                        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full font-semibold border shadow-sm mt-2 sm:mt-0">
                                                            {edu.year}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg text-gray-700 font-semibold mb-3">{edu.institution}</p>
                                                    {edu.grade && (
                                                        <p className="text-gray-600 font-semibold text-lg bg-white px-4 py-2 rounded-lg border border-purple-100 inline-block">
                                                            Grade: {edu.grade}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {application.coverLetter && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-indigo-600" />
                                            Cover Letter
                                        </h3>
                                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                                                {application.coverLetter}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Link
                            href={`/jobs/${application.jobId}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer font-medium"
                        >
                            <Eye className="w-4 h-4" />
                            View Job Posting
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />

            {/* Result Modal */}
            <ResultModal
                isOpen={isResultModalOpen}
                onClose={() => {
                    setIsResultModalOpen(false);
                    setSelectedTestAssignment(null);
                    setDetailedTestResult(null);
                }}
                testAssignment={selectedTestAssignment}
                detailedResult={detailedTestResult}
                isLoading={isLoadingResult}
                formatDateTime={formatDateTime}
            />
        </>
    );
}

const ResultModal = ({ isOpen, onClose, testAssignment, detailedResult, isLoading, formatDateTime }) => {
    if (!isOpen || !testAssignment) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Test Results</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {testAssignment.test_title}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading detailed results...</p>
                        </div>
                    ) : (
                        <>
                            {/* Score Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-200">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {detailedResult.attempt.percentage || 0}%
                                    </div>
                                    <div className="text-sm text-blue-700 font-medium">Percentage</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-200">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {testAssignment.passing_percentage}%
                                    </div>
                                    <div className="text-sm text-green-700 font-medium">Passing Percentage</div>
                                </div>
                                <div className={`rounded-xl p-4 text-center border ${(detailedResult.attempt.percentage || 0) >= testAssignment.passing_percentage
                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                    : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                                    }`}>
                                    <div className={`text-2xl font-bold mb-1 ${(detailedResult.attempt.percentage || 0) >= testAssignment.passing_percentage ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {(detailedResult.attempt.percentage || 0) >= testAssignment.passing_percentage ? 'PASSED' : 'FAILED'}
                                    </div>
                                    <div className={`text-sm font-medium ${(detailedResult.attempt.percentage || 0) >= testAssignment.passing_percentage ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        Result
                                    </div>
                                </div>

                            </div>

                            {/* Performance Summary */}
                            {detailedResult && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                            {detailedResult.summary.correct_answers || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Correct Answers</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                            {detailedResult.summary.incorrect_answers || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Incorrect Answers</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                            {detailedResult.summary.partial_marks || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Skipped Questions</div>
                                    </div>
                                </div>
                            )}

                            {/* Test Details */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Test Details</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-semibold ml-2">{testAssignment.duration_minutes} mins</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total Marks:</span>
                                        <span className="font-semibold ml-2">{testAssignment.total_marks}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Test Type:</span>
                                        <span className="font-semibold ml-2">
                                            {testAssignment.is_proctored ? 'Proctored' : 'Regular'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <span className="font-semibold ml-2 capitalize">{testAssignment.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Analysis */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Performance Analysis</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Your Score</span>
                                        <span className="font-semibold text-gray-900">{detailedResult.attempt.percentage || 0}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Passing Requirement</span>
                                        <span className="font-semibold text-gray-900">{testAssignment.passing_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${(detailedResult.attempt.percentage || 0) >= testAssignment.passing_percentage ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(detailedResult.attempt.percentage || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>0%</span>
                                        <span>{testAssignment.passing_percentage}% (Passing)</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Question-wise Breakdown */}
                            {detailedResult && detailedResult.questionResults && detailedResult.questionResults.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Question-wise Breakdown</h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {detailedResult.questionResults.map((question, index) => (
                                            <div key={index} className={`p-3 rounded-lg border ${question.isCorrect
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                                }`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-gray-900">Q{index + 1}:</span>
                                                            <span className="text-sm text-gray-700 line-clamp-2">{question.questionText}</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-600">Your Answer:</span>
                                                                <span className="font-medium ml-1">{question.userAnswer || 'Not attempted'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Correct Answer:</span>
                                                                <span className="font-medium ml-1">{question.correctAnswer}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Marks:</span>
                                                                <span className="font-medium ml-1">{question.marksObtained}/{question.totalMarks}</span>
                                                            </div>
                                                            {question.timeSpent && (
                                                                <div>
                                                                    <span className="text-gray-600">Time Spent:</span>
                                                                    <span className="font-medium ml-1">{question.timeSpent}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${question.isCorrect ? 'bg-green-500' : 'bg-red-500'
                                                        }`}>
                                                        {question.isCorrect ? (
                                                            <CheckCircle className="w-4 h-4 text-white" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            {testAssignment.feedback && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Evaluator Feedback
                                    </h4>
                                    <p className="text-blue-800 text-sm">{testAssignment.feedback}</p>
                                </div>
                            )}

                            {/* Proctoring Information */}
                            {testAssignment.is_proctored && (
                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        Proctored Test Information
                                    </h4>
                                    <div className="text-amber-800 text-sm space-y-1">
                                        <p>This test was monitored with proctoring features:</p>
                                        {testAssignment.proctoring_settings && (
                                            <ul className="list-disc list-inside ml-2">
                                                {testAssignment.proctoring_settings.fullscreen_required && (
                                                    <li>Fullscreen mode was required</li>
                                                )}
                                                {testAssignment.proctoring_settings.copy_paste_prevention && (
                                                    <li>Copy-paste was disabled</li>
                                                )}
                                                {testAssignment.proctoring_settings.tab_switching_detection && (
                                                    <li>Tab switching was monitored</li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Test Timeline */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Test Timeline</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Assigned:</span>
                                        <span className="font-semibold ml-2">{formatDateTime(testAssignment.assigned_at)}</span>
                                    </div>
                                    {testAssignment.attempted_at && (
                                        <div>
                                            <span className="text-gray-600">Attempted:</span>
                                            <span className="font-semibold ml-2">{formatDateTime(testAssignment.attempted_at)}</span>
                                        </div>
                                    )}
                                    {testAssignment.completed_at && (
                                        <div>
                                            <span className="text-gray-600">Completed:</span>
                                            <span className="font-semibold ml-2">{formatDateTime(testAssignment.completed_at)}</span>
                                        </div>
                                    )}
                                    {testAssignment.evaluated_at && (
                                        <div>
                                            <span className="text-gray-600">Evaluated:</span>
                                            <span className="font-semibold ml-2">{formatDateTime(testAssignment.evaluated_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
                        >
                            Close Results
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};