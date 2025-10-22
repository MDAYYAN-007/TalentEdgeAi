'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getApplicantTests } from '@/actions/tests/getApplicantTests';
import {
    ArrowRight, Calendar, Clock, FileText, Zap, MapPin,
    Building, User, AlertCircle, CheckCircle, Play, Eye,
    Star, Target, TrendingUp, ArrowLeft, ExternalLink,
    X, FileCheck, CheckCircle as CheckCircleIcon, XCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { getTestResults } from '@/actions/tests/getTestResults';
import { getTestAttemptId } from '@/actions/tests/getTestAttemptId';

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
                    ) : detailedResult ? (
                        <>
                            {/* Score Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-200">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {detailedResult.attempt?.percentage || 0}%
                                    </div>
                                    <div className="text-sm text-blue-700 font-medium">Percentage</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-200">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {testAssignment.passing_marks}%
                                    </div>
                                    <div className="text-sm text-green-700 font-medium">Passing Percentage</div>
                                </div>
                                <div className={`rounded-xl p-4 text-center border ${(detailedResult.attempt?.percentage || 0) >= testAssignment.passing_marks
                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                    : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                                    }`}>
                                    <div className={`text-2xl font-bold mb-1 ${(detailedResult.attempt?.percentage || 0) >= testAssignment.passing_marks ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {(detailedResult.attempt?.percentage || 0) >= testAssignment.passing_marks ? 'PASSED' : 'FAILED'}
                                    </div>
                                    <div className={`text-sm font-medium ${(detailedResult.attempt?.percentage || 0) >= testAssignment.passing_marks ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        Result
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center border border-purple-200">
                                    <div className="text-2xl font-bold text-purple-600 mb-1">
                                        {testAssignment.total_marks}
                                    </div>
                                    <div className="text-sm text-purple-700 font-medium">Total Marks</div>
                                </div>
                            </div>

                            {/* Performance Summary */}
                            {detailedResult.summary && (
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
                                        <span className="font-semibold ml-2 capitalize">{testAssignment.assignment_status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Analysis */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Performance Analysis</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Your Score</span>
                                        <span className="font-semibold text-gray-900">{detailedResult.attempt?.percentage || 0}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Passing Requirement</span>
                                        <span className="font-semibold text-gray-900">{testAssignment.passing_marks}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${(detailedResult.attempt?.percentage || 0) >= testAssignment.passing_marks ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(detailedResult.attempt?.percentage || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>0%</span>
                                        <span>{testAssignment.passing_marks}% (Passing)</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Question-wise Breakdown */}
                            {detailedResult.questionResults && detailedResult.questionResults.length > 0 && (
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
                                                            <CheckCircleIcon className="w-4 h-4 text-white" />
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
                                    {testAssignment.started_at && (
                                        <div>
                                            <span className="text-gray-600">Started:</span>
                                            <span className="font-semibold ml-2">{formatDateTime(testAssignment.started_at)}</span>
                                        </div>
                                    )}
                                    {testAssignment.submitted_at && (
                                        <div>
                                            <span className="text-gray-600">Submitted:</span>
                                            <span className="font-semibold ml-2">{formatDateTime(testAssignment.submitted_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Detailed Results Available</h4>
                            <p className="text-gray-600">
                                Detailed test results are not available for this test yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="cursor-pointer px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
                        >
                            Close Results
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ApplicantTestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState('all');

    // Add these state variables for the result modal
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [selectedTestAssignment, setSelectedTestAssignment] = useState(null);
    const [detailedTestResult, setDetailedTestResult] = useState(null);
    const [isLoadingResult, setIsLoadingResult] = useState(false);

    useEffect(() => {
        const fetchUserAndTests = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    toast.error('Please sign in to view your tests');
                    router.push('/signin');
                    return;
                }

                setUser(currentUser);
                await fetchApplicantTests(currentUser.id);
            } catch (error) {
                console.error('Error fetching user:', error);
                toast.error('Please sign in to view your tests');
                router.push('/signin');
            }
        };

        fetchUserAndTests();
    }, [router]);

    const fetchApplicantTests = async (userId) => {
        try {
            const result = await getApplicantTests(userId);
            if (result.success) {
                setTests(result.tests || []);
            } else {
                toast.error(result.message || 'Failed to load tests');
            }
        } catch (error) {
            console.error('Error fetching tests:', error);
            toast.error('Error loading tests');
        } finally {
            setIsLoading(false);
        }
    };

    const getTestStatus = (test) => {
        console.log(test)
        if (test.status === 'completed' || test.attempt_status === 'completed' || test.status === 'attempted' || test.attempt_status === 'submitted') {
            return 'completed';
        }

        if (test.attempt_status === 'in_progress') {
            return 'attempted';
        }

        const now = new Date();
        const endDate = new Date(test.test_end_date);
        if (now > endDate) {
            return 'expired';
        }

        const startDate = new Date(test.test_start_date);
        if (now < startDate) {
            return 'not_started';
        }

        return 'assigned';
    };

    const getStatusColor = (status) => {
        const colors = {
            assigned: 'bg-blue-100 text-blue-800 border-blue-200',
            attempted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            expired: 'bg-red-100 text-red-800 border-red-200',
            not_started: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'attempted':
                return <Play className="w-4 h-4" />;
            case 'expired':
                return <AlertCircle className="w-4 h-4" />;
            case 'not_started':
                return <Clock className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
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

    const getTimeUntilStart = (startDate) => {
        if (!startDate) return null;
        const now = new Date();
        const start = new Date(startDate);
        const diffMs = start - now;

        if (diffMs <= 0) return null;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Add the handleViewTestResults function
    const handleViewTestResults = async (test) => {
        setSelectedTestAssignment(test);
        setIsLoadingResult(true);
        setIsResultModalOpen(true);

        try {
            // First get the attempt ID
            const attemptResult = await getTestAttemptId(test.test_id, test.application_id);
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

    const filteredTests = tests.filter(test => {
        const status = getTestStatus(test);
        if (filter === 'all') return true;
        return status === filter;
    });

    const statusCounts = {
        all: tests.length,
        assigned: tests.filter(test => getTestStatus(test) === 'assigned').length,
        attempted: tests.filter(test => getTestStatus(test) === 'attempted').length,
        completed: tests.filter(test => getTestStatus(test) === 'completed').length,
        expired: tests.filter(test => getTestStatus(test) === 'expired').length,
        not_started: tests.filter(test => getTestStatus(test) === 'not_started').length,
    };

    const handleTakeTest = (test) => {
        const status = getTestStatus(test);

        if (status === 'completed') {
            toast.error('You have already completed this test');
            return;
        }
        if (status === 'expired') {
            toast.error('This test has expired');
            return;
        }
        if (status === 'not_started') {
            toast.error('This test has not started yet');
            return;
        }

        router.push(`/tests/${test.test_id}`);
    };

    const handleViewApplication = (applicationId) => {
        router.push(`/applications/${applicationId}`);
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
                                    You need to be signed in to view your tests.
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
                            Loading Your Tests
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Fetching your assigned tests...
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
    return (
        <>
            <Toaster />
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
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
                                    <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                        <FileText className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        My Tests
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    Assessment Tests
                                </h1>

                                <p className="text-gray-600 text-lg max-w-2xl">
                                    Manage and take your assigned assessment tests. Track your progress and view results.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg lg:w-80">
                                    <div className="text-center">
                                        <div className="text-2xl lg:text-3xl font-bold text-indigo-600 mb-2">
                                            {tests.length}
                                        </div>
                                        <div className="text-gray-600 font-medium">Total Tests Assigned</div>
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
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Test Overview</h2>
                                    <p className="text-gray-600">
                                        Track your test progress and performance
                                    </p>
                                </div>

                                {/* Status Filters */}
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'all', label: 'All Tests', count: statusCounts.all },
                                        { key: 'assigned', label: 'Assigned', count: statusCounts.assigned },
                                        { key: 'not_started', label: 'Not Started', count: statusCounts.not_started },
                                        { key: 'attempted', label: 'In Progress', count: statusCounts.attempted },
                                        { key: 'completed', label: 'Completed', count: statusCounts.completed },
                                        { key: 'expired', label: 'Expired', count: statusCounts.expired },
                                    ].map(({ key, label, count }) => (
                                        <button
                                            key={key}
                                            onClick={() => setFilter(key)}
                                            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${filter === key
                                                ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span>{label}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${filter === key
                                                ? 'bg-indigo-500 text-white'
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
                                        {statusCounts.assigned + statusCounts.not_started}
                                    </div>
                                    <div className="text-sm text-blue-700 font-medium">Pending</div>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                                        {statusCounts.attempted}
                                    </div>
                                    <div className="text-sm text-yellow-700 font-medium">In Progress</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {statusCounts.completed}
                                    </div>
                                    <div className="text-sm text-green-700 font-medium">Completed</div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
                                    <div className="text-2xl font-bold text-red-600 mb-1">
                                        {statusCounts.expired}
                                    </div>
                                    <div className="text-sm text-red-700 font-medium">Expired</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tests List */}
                    <div className="space-y-6">
                        {filteredTests.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {filter === 'all' ? 'No Tests Assigned' : `No ${filter.replace('_', ' ')} tests`}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {filter === 'all'
                                        ? "You don't have any tests assigned yet. Check back later for new assessments."
                                        : `You don't have any ${filter.replace('_', ' ')} tests at the moment.`
                                    }
                                </p>
                                <Link
                                    href="/applications"
                                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Applications
                                </Link>
                            </div>
                        ) : (
                            filteredTests.map((test) => {
                                const status = getTestStatus(test);
                                const timeUntilStart = getTimeUntilStart(test.test_start_date);

                                return (
                                    <div key={test.assignment_id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                            <div className="flex-1">
                                                {/* Test Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <FileText className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900">{test.test_title}</h3>
                                                            <p className="text-gray-600 text-sm">
                                                                For: <span className="font-semibold">{test.job_title}</span> at <span className="font-semibold">{test.company_name}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
                                                        {getStatusIcon(status)}
                                                        {status.replace('_', ' ')}
                                                    </div>
                                                </div>

                                                {/* Test Details Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="text-sm text-gray-600 font-medium">Duration</div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {test.duration_minutes} mins
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="text-sm text-gray-600 font-medium">Total Marks</div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {test.total_marks}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="text-sm text-gray-600 font-medium">Passing Marks</div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {test.passing_marks}%
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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
                                                                <Zap className="w-4 h-4 text-blue-600" />
                                                                <span className="text-blue-600 font-medium">Proctored Test</span>
                                                            </div>
                                                        )}
                                                        {timeUntilStart && (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-amber-600" />
                                                                <span className="text-amber-600 font-medium">
                                                                    Starts in {timeUntilStart}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Score Display */}
                                                {test.percentage !== null && test.percentage !== undefined ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getScoreColor(test.percentage)}`}>
                                                            <Star className="w-4 h-4" />
                                                            <span className="font-semibold">Score: {test.percentage}%</span>
                                                        </div>
                                                        {test.passing_marks && (
                                                            <div className={`text-sm font-medium ${test.percentage >= test.passing_marks ? 'text-green-600' : 'text-red-600'}`}>
                                                                {test.percentage >= test.passing_marks ? 'Passed' : 'Failed'}
                                                                (Required: {test.passing_marks}%)
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : status === 'completed' && (
                                                    <div className="text-sm text-gray-500">
                                                        Test completed - Score pending evaluation
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col gap-3 lg:w-48">
                                                {status === 'assigned' && (
                                                    <button
                                                        onClick={() => handleTakeTest(test)}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        Take Test
                                                    </button>
                                                )}

                                                {status === 'attempted' && (
                                                    <button
                                                        onClick={() => handleTakeTest(test)}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        Continue Test
                                                    </button>
                                                )}

                                                {status === 'completed' && (
                                                    <button
                                                        onClick={() => handleViewTestResults(test)}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                    >
                                                        <FileCheck className="w-4 h-4" />
                                                        View Results
                                                    </button>
                                                )}

                                                {(status === 'expired' || status === 'not_started') && (
                                                    <div className="text-center text-gray-500 text-sm p-3 bg-gray-50 rounded-lg border">
                                                        {status === 'expired'
                                                            ? 'This test has expired'
                                                            : `Test starts ${formatDateTime(test.test_start_date)}`
                                                        }
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleViewApplication(test.application_id)}
                                                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-all duration-200 font-medium"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    View Application
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

            {/* Add the Result Modal */}
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