'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTestQuestions } from '@/actions/tests/getTestQuestions';
import { submitTestResponse } from '@/actions/tests/submitTestResponse';
import { submitTestAttempt } from '@/actions/tests/submitTestAttempt';
import {
    ArrowLeft, Clock, FileText, AlertCircle, CheckCircle,
    XCircle, Play, Pause, Flag, ChevronLeft, ChevronRight,
    Save, Send, Zap, Type, Code, Eye, EyeOff, Fullscreen,
    Minimize, User, Shield, Camera, Monitor, Smartphone
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { getApplicantTestDetails } from '@/actions/tests/getApplicantTestDetails';
import { startTestAttempt } from '@/actions/tests/startTestAttempt';

export default function TakeTestPage() {
    const params = useParams();
    const router = useRouter();
    const testAssignmentId = params.testAssignmentId;

    const [testAssignment, setTestAssignment] = useState(null);
    const [testDetails, setTestDetails] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTestStarted, setIsTestStarted] = useState(false);
    const [isTestCompleted, setIsTestCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testAttemptId, setTestAttemptId] = useState(null);
    const [user, setUser] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [proctoringWarnings, setProctoringWarnings] = useState([]);

    const timerRef = useRef(null);
    const fullscreenRef = useRef(null);

    // Authentication and initial data loading
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please sign in to take the test');
            router.push('/signin');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setUser(decoded);
            fetchTestData(testAssignmentId, decoded.id);
        } catch (error) {
            console.error('Error decoding token:', error);
            router.push('/signin');
        }
    }, [testAssignmentId, router]);

    const fetchTestData = async (assignmentId, userId) => {
        try {
            // Fetch test assignment details using the new applicant-specific function
            const assignmentResult = await getApplicantTestDetails(assignmentId, userId);
            if (!assignmentResult.success) {
                toast.error(assignmentResult.message || 'Failed to load test details');
                router.push('/applications');
                return;
            }

            const assignment = assignmentResult.testAssignment;
            setTestAssignment(assignment);

            // Check test availability
            if (assignment.availability === 'not_started') {
                setTimeLeft(Math.floor(assignment.time_until_start / 1000));
                setIsLoading(false);
                return;
            }

            if (assignment.availability === 'expired') {
                toast.error('This test has expired');
                router.push('/applications');
                return;
            }

            if (assignment.availability === 'completed') {
                toast.error('You have already completed this test');
                router.push('/applications');
                return;
            }

            // Test is available, load questions using your existing function
            const questionsResult = await getTestQuestions(assignment.test_id);
            if (!questionsResult.success) {
                toast.error('Failed to load test questions');
                return;
            }

            setTestDetails(questionsResult.test);
            setQuestions(questionsResult.questions || []);

            // Calculate time left
            const timeLeftSeconds = Math.floor(assignment.time_until_end / 1000);
            setTimeLeft(timeLeftSeconds);

            // Start test attempt
            const attemptResult = await startTestAttempt(assignmentId, userId);
            if (attemptResult.success) {
                setTestAttemptId(attemptResult.attemptId);
                setIsTestStarted(true);
                setShowInstructions(true);
            } else {
                toast.error(attemptResult.message || 'Failed to start test attempt');
            }

        } catch (error) {
            console.error('Error fetching test data:', error);
            toast.error('Error loading test');
        } finally {
            setIsLoading(false);
        }
    };

    // Timer management
    useEffect(() => {
        if (isTestStarted && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isTestStarted, timeLeft]);

    // Proctoring checks
    useEffect(() => {
        if (isTestStarted && testAssignment?.is_proctored) {
            initializeProctoring();
        }
    }, [isTestStarted, testAssignment]);

    const initializeProctoring = () => {
        // Check fullscreen
        if (testAssignment.proctoring_settings?.fullscreen_required) {
            document.addEventListener('fullscreenchange', handleFullscreenChange);
        }

        // Check tab switching
        if (testAssignment.proctoring_settings?.tab_switching_detection) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        // Check copy/paste prevention
        if (testAssignment.proctoring_settings?.copy_paste_prevention) {
            document.addEventListener('copy', preventCopyPaste);
            document.addEventListener('paste', preventCopyPaste);
            document.addEventListener('cut', preventCopyPaste);
        }
    };

    const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isCurrentlyFullscreen);

        if (!isCurrentlyFullscreen && testAssignment.proctoring_settings?.fullscreen_required) {
            setProctoringWarnings(prev => [...prev, {
                id: Date.now(),
                type: 'fullscreen',
                message: 'Please return to fullscreen mode',
                timestamp: new Date()
            }]);
        }
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            setProctoringWarnings(prev => [...prev, {
                id: Date.now(),
                type: 'tab_switch',
                message: 'Tab switching detected',
                timestamp: new Date()
            }]);
        }
    };

    const preventCopyPaste = (e) => {
        e.preventDefault();
        setProctoringWarnings(prev => [...prev, {
            id: Date.now(),
            type: 'copy_paste',
            message: 'Copy/paste is disabled for this test',
            timestamp: new Date()
        }]);
        return false;
    };

    const requestFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (error) {
            console.error('Error entering fullscreen:', error);
            toast.error('Could not enter fullscreen mode');
        }
    };

    const exitFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Error exiting fullscreen:', error);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartTest = () => {
        if (testAssignment?.is_proctored && testAssignment.proctoring_settings?.fullscreen_required) {
            requestFullscreen();
        }
        setShowInstructions(false);
    };

    const handleResponseChange = (questionId, response) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                ...response,
                timestamp: new Date().toISOString()
            }
        }));
    };

    const handleFlagQuestion = (questionId) => {
        setFlaggedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const goToQuestion = (index) => {
        setCurrentQuestionIndex(index);
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const goToPrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleAutoSubmit = async () => {
        if (isTestCompleted) return;

        setIsSubmitting(true);
        toast.loading('Time\'s up! Submitting your test...', { duration: 5000 });

        try {
            await submitAllResponses();
            const result = await submitTestAttempt(testAttemptId);

            if (result.success) {
                setIsTestCompleted(true);
                toast.success('Test submitted successfully!');
                // Redirect to results or applications page after delay
                setTimeout(() => {
                    router.push('/applications');
                }, 3000);
            } else {
                toast.error(result.message || 'Failed to submit test');
            }
        } catch (error) {
            console.error('Error auto-submitting test:', error);
            toast.error('Error submitting test');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitAllResponses = async () => {
        const submissionPromises = Object.entries(responses).map(([questionId, response]) =>
            submitTestResponse(testAttemptId, questionId, response)
        );
        await Promise.allSettled(submissionPromises);
    };

    const handleSubmitTest = async () => {
        if (isSubmitting) return;

        const confirmed = window.confirm(
            'Are you sure you want to submit the test? You will not be able to make changes after submission.'
        );

        if (!confirmed) return;

        setIsSubmitting(true);
        toast.loading('Submitting your test...', { duration: 5000 });

        try {
            await submitAllResponses();
            const result = await submitTestAttempt(testAttemptId);

            if (result.success) {
                setIsTestCompleted(true);
                toast.success('Test submitted successfully!');
                // Redirect after delay
                setTimeout(() => {
                    router.push('/applications');
                }, 3000);
            } else {
                toast.error(result.message || 'Failed to submit test');
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            toast.error('Error submitting test');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getQuestionStatus = (index) => {
        const question = questions[index];
        if (!question) return 'not-visited';

        const response = responses[question.id];
        if (flaggedQuestions.has(question.id)) return 'flagged';
        if (response) return 'answered';
        return 'not-answered';
    };

    const renderQuestion = (question) => {
        const response = responses[question.id] || {};

        switch (question.question_type) {
            case 'mcq_single':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(question.options || {}).map(([key, value]) => (
                                <label
                                    key={key}
                                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${response.selectedOptions?.[0] === key
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={key}
                                        checked={response.selectedOptions?.[0] === key}
                                        onChange={(e) => handleResponseChange(question.id, {
                                            selectedOptions: [e.target.value],
                                            questionType: question.question_type
                                        })}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="font-semibold text-gray-700 min-w-6">{key}.</span>
                                        <span className="text-gray-900">{value}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case 'mcq_multiple':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(question.options || {}).map(([key, value]) => (
                                <label
                                    key={key}
                                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${response.selectedOptions?.includes(key)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        value={key}
                                        checked={response.selectedOptions?.includes(key) || false}
                                        onChange={(e) => {
                                            const currentOptions = response.selectedOptions || [];
                                            const newOptions = e.target.checked
                                                ? [...currentOptions, key]
                                                : currentOptions.filter(opt => opt !== key);
                                            handleResponseChange(question.id, {
                                                selectedOptions: newOptions,
                                                questionType: question.question_type
                                            });
                                        }}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="font-semibold text-gray-700 min-w-6">{key}.</span>
                                        <span className="text-gray-900">{value}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div className="space-y-4">
                        <textarea
                            value={response.answer || ''}
                            onChange={(e) => handleResponseChange(question.id, {
                                answer: e.target.value,
                                questionType: question.question_type
                            })}
                            placeholder="Type your answer here..."
                            rows="8"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
                        />
                    </div>
                );

            case 'coding':
                return (
                    <div className="space-y-4">
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400">Code Editor</span>
                                <div className="flex gap-2">
                                    <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">
                                        <option>JavaScript</option>
                                        <option>Python</option>
                                        <option>Java</option>
                                        <option>C++</option>
                                    </select>
                                </div>
                            </div>
                            <textarea
                                value={response.answer || ''}
                                onChange={(e) => handleResponseChange(question.id, {
                                    answer: e.target.value,
                                    questionType: question.question_type
                                })}
                                placeholder="Write your code here..."
                                rows="12"
                                className="w-full bg-gray-800 text-gray-100 border-0 focus:ring-0 font-mono resize-none"
                                style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                            />
                        </div>
                    </div>
                );

            default:
                return <div>Unsupported question type</div>;
        }
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading test...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Test hasn't started yet - show countdown
    if (!isTestStarted && timeLeft > 0 && new Date() < new Date(testAssignment.test_start_date)) {
        const startTime = new Date(testAssignment.test_start_date);
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-lg border border-gray-200">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Not Started Yet</h2>
                        <p className="text-gray-600 mb-6">
                            This test will begin on {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString()}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-3xl font-bold text-indigo-600 mb-2">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-sm text-gray-600">Time until test starts</div>
                        </div>
                        <Link
                            href="/applications"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
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

    // Test expired
    if (!isTestStarted && new Date() > new Date(testAssignment.test_end_date)) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-lg border border-gray-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Expired</h2>
                        <p className="text-gray-600 mb-6">
                            This test is no longer available. The test window has ended.
                        </p>
                        <Link
                            href="/applications"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
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

    // Test completed
    if (isTestCompleted) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-lg border border-gray-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Submitted Successfully!</h2>
                        <p className="text-gray-600 mb-6">
                            Thank you for completing the test. Your results will be available soon.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/applications"
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Applications
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Instructions screen
    if (showInstructions && isTestStarted) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">{testDetails?.title}</h1>
                                <p className="text-gray-600">Please read the instructions carefully before starting the test</p>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                                        <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                        <div className="text-lg font-bold text-blue-600">{testDetails?.duration_minutes} mins</div>
                                        <div className="text-sm text-blue-700">Duration</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                                        <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <div className="text-lg font-bold text-green-600">{questions.length}</div>
                                        <div className="text-sm text-green-700">Questions</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                                        <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                        <div className="text-lg font-bold text-purple-600">{testDetails?.total_marks}</div>
                                        <div className="text-sm text-purple-700">Total Marks</div>
                                    </div>
                                </div>

                                {testAssignment?.is_proctored && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Shield className="w-6 h-6 text-yellow-600" />
                                            <h3 className="text-lg font-bold text-gray-900">Proctored Test</h3>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <p>This is a proctored test with the following restrictions:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {testAssignment.proctoring_settings?.fullscreen_required && (
                                                    <li>Fullscreen mode is required</li>
                                                )}
                                                {testAssignment.proctoring_settings?.tab_switching_detection && (
                                                    <li>Tab switching will be monitored</li>
                                                )}
                                                {testAssignment.proctoring_settings?.copy_paste_prevention && (
                                                    <li>Copy/paste functionality is disabled</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Test Instructions</h3>
                                    <div className="space-y-3 text-sm text-gray-700">
                                        {testDetails?.instructions ? (
                                            <div dangerouslySetInnerHTML={{ __html: testDetails.instructions }} />
                                        ) : (
                                            <>
                                                <p>• Read each question carefully before answering</p>
                                                <p>• You can navigate between questions using the question palette</p>
                                                <p>• Flag questions you want to review later</p>
                                                <p>• The timer will show the remaining time</p>
                                                <p>• Once submitted, you cannot change your answers</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <h4 className="font-bold text-red-800">Important</h4>
                                    </div>
                                    <ul className="text-sm text-red-700 space-y-1">
                                        <li>Do not refresh the page or close the browser during the test</li>
                                        <li>Do not switch tabs or applications</li>
                                        <li>Ensure you have a stable internet connection</li>
                                        <li>The test will auto-submit when time expires</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
                                <Link
                                    href="/applications"
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all duration-200 text-center"
                                >
                                    Cancel
                                </Link>
                                <button
                                    onClick={handleStartTest}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Play className="w-5 h-5" />
                                    Start Test
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Main test interface
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <>
            <Navbar />
            <Toaster />
            <div className="min-h-screen bg-gray-50" ref={fullscreenRef}>
                {/* Header Bar */}
                <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-gray-900 truncate max-w-xs">
                                            {testDetails?.title}
                                        </h1>
                                        <p className="text-sm text-gray-600">
                                            Question {currentQuestionIndex + 1} of {questions.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Proctoring Warnings */}
                                {proctoringWarnings.length > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setProctoringWarnings([])}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                                                {proctoringWarnings.length}
                                            </span>
                                        </button>
                                    </div>
                                )}

                                {/* Fullscreen Toggle */}
                                {testAssignment?.is_proctored && (
                                    <button
                                        onClick={isFullscreen ? exitFullscreen : requestFullscreen}
                                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Fullscreen className="w-5 h-5" />}
                                    </button>
                                )}

                                {/* Timer */}
                                <div className={`px-4 py-2 rounded-lg border-2 font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-100 border-red-300 text-red-700' :
                                    timeLeft < 600 ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
                                        'bg-green-100 border-green-300 text-green-700'
                                    }`}>
                                    {formatTime(timeLeft)}
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitTest}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Submit Test
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Questions Palette */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-24">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Questions</h3>
                                <div className="grid grid-cols-5 gap-2 mb-4">
                                    {questions.map((question, index) => {
                                        const status = getQuestionStatus(index);
                                        const statusColors = {
                                            'answered': 'bg-green-500 border-green-500 text-white',
                                            'not-answered': 'bg-white border-gray-300 text-gray-700',
                                            'flagged': 'bg-yellow-500 border-yellow-500 text-white',
                                            'not-visited': 'bg-gray-100 border-gray-300 text-gray-500'
                                        };
                                        const isCurrent = index === currentQuestionIndex;

                                        return (
                                            <button
                                                key={question.id}
                                                onClick={() => goToQuestion(index)}
                                                className={`w-10 h-10 rounded-lg border-2 font-semibold text-sm transition-all ${statusColors[status]
                                                    } ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                                                    }`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                                        <span>Answered</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                        <span>Flagged</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                        <span>Not Visited</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Question Area */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                {/* Question Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">
                                            {currentQuestionIndex + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-gray-500 uppercase">
                                                    {currentQuestion?.question_type?.replace('_', ' ')}
                                                </span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                                    {currentQuestion?.marks} mark{currentQuestion?.marks > 1 ? 's' : ''}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${currentQuestion?.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' :
                                                    currentQuestion?.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {currentQuestion?.difficulty_level}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleFlagQuestion(currentQuestion.id)}
                                        className={`p-2 rounded-lg transition-colors ${flaggedQuestions.has(currentQuestion.id)
                                            ? 'bg-yellow-100 text-yellow-600'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Flag className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Question Text */}
                                <div className="mb-6">
                                    <div className="prose max-w-none">
                                        <div className="text-lg text-gray-900 leading-relaxed mb-4">
                                            {currentQuestion?.question_text}
                                        </div>
                                        {currentQuestion?.question_image_url && (
                                            <img
                                                src={currentQuestion.question_image_url}
                                                alt="Question"
                                                className="max-w-full h-auto rounded-lg border border-gray-200"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Question Input */}
                                <div className="mb-8">
                                    {renderQuestion(currentQuestion)}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                                    <button
                                        onClick={goToPrevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                const response = responses[currentQuestion.id];
                                                if (response) {
                                                    toast.success('Response saved');
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save
                                        </button>

                                        {currentQuestionIndex < questions.length - 1 ? (
                                            <button
                                                onClick={goToNextQuestion}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
                                            >
                                                Next
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSubmitTest}
                                                disabled={isSubmitting}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                                            >
                                                <Send className="w-4 h-4" />
                                                Submit Test
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proctoring Warnings Modal */}
            {proctoringWarnings.length > 0 && (
                <div className="fixed bottom-4 right-4 max-w-sm">
                    {proctoringWarnings.slice(-3).map(warning => (
                        <div
                            key={warning.id}
                            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-2 shadow-lg"
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700">{warning.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}