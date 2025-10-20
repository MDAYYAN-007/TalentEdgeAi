'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getApplicantTestDetails } from '@/actions/tests/getApplicantTestDetails';
import { getTestQuestions } from '@/actions/tests/getTestQuestions';
import { startTestAttempt } from '@/actions/tests/startTestAttempt';
import { submitTestResponse } from '@/actions/tests/submitTestResponse';
import { submitTestAttempt } from '@/actions/tests/submitTestAttempt';
import { updateProctoringViolation } from '@/actions/tests/updateProctoringViolation';
import {
    ArrowLeft, Clock, FileText, AlertCircle, CheckCircle,
    XCircle, Play, Pause, Flag, ChevronLeft, ChevronRight,
    Save, Send, Zap, Type, Code, Eye, EyeOff, Fullscreen,
    Minimize, User, Shield, Camera, Monitor, Smartphone,
    AlertTriangle, Info, Lock, Unlock, Copy, Mouse
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function TakeTestPage() {
    const params = useParams();
    const router = useRouter();
    const testAssignmentId = params.testAssignmentId;

    // Test state
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
    const [showInstructions, setShowInstructions] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Proctoring state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [cameraAccess, setCameraAccess] = useState(false);
    const [mediaStream, setMediaStream] = useState(null);
    const [isStartingTest, setIsStartingTest] = useState(false);
    const [proctoringWarnings, setProctoringWarnings] = useState([]);

    const proctoringInitializedRef = useRef(false);
    const cameraCheckIntervalRef = useRef(null);
    const violationCountRef = useRef(0);
    const timerRef = useRef(null);
    const autoSaveTimeoutRef = useRef(null);

    // Update ref when state changes
    useEffect(() => {
        violationCountRef.current = violationCount;
    }, [violationCount]);

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

    // Proctoring setup
    useEffect(() => {
        if (isTestStarted && !proctoringInitializedRef.current) {
            initializeProctoring();
        }

        return () => {
            cleanupProctoring();
        };
    }, [isTestStarted]);

    // Camera monitoring
    useEffect(() => {
        if (isTestStarted && testAssignment?.is_proctored) {
            cameraCheckIntervalRef.current = setInterval(() => {
                checkCameraStatus();
            }, 3000);
        }

        return () => {
            if (cameraCheckIntervalRef.current) {
                clearInterval(cameraCheckIntervalRef.current);
            }
        };
    }, [isTestStarted, testAssignment]);

    // Timer management
    // Timer management
    useEffect(() => {
        if (isTestStarted && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Don't call handleAutoSubmit directly here
                        // Instead, set timeLeft to 0 and let the effect handle it
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

    // Separate useEffect to handle auto-submit when time reaches 0
    useEffect(() => {
        if (isTestStarted && timeLeft === 0 && !isTestCompleted) {
            handleAutoSubmit();
        }
    }, [isTestStarted, timeLeft, isTestCompleted]);

    // Auto-save responses when they change
    useEffect(() => {
        if (isTestStarted && testAttemptId) {
            // Clear existing timeout
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Set new timeout to save after 2 seconds of inactivity
            autoSaveTimeoutRef.current = setTimeout(() => {
                saveAllResponses();
            }, 2000);
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [responses, isTestStarted, testAttemptId]);

    const fetchTestData = async (assignmentId, userId) => {
        try {
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
                const timeUntilStart = Math.max(0, Math.floor(assignment.time_until_start / 1000));
                setTimeLeft(timeUntilStart);

                if (timeUntilStart > 0) {
                    timerRef.current = setInterval(() => {
                        setTimeLeft(prev => {
                            if (prev <= 1) {
                                clearInterval(timerRef.current);
                                window.location.reload();
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                }

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

            // Test is available, load questions
            const questionsResult = await getTestQuestions(assignment.test_id);
            if (!questionsResult.success) {
                toast.error('Failed to load test questions');
                return;
            }

            setTestDetails(questionsResult.test);
            setQuestions(questionsResult.questions || []);

            // FIX: Use test duration in minutes instead of assignment end time
            const timeLeftSeconds = questionsResult.test.duration_minutes * 60;
            setTimeLeft(timeLeftSeconds);

            setIsLoading(false);

        } catch (error) {
            console.error('Error fetching test data:', error);
            toast.error('Error loading test');
            setIsLoading(false);
        }
    };

    // Proctoring functions
    const initializeProctoring = () => {
        if (proctoringInitializedRef.current) {
            return;
        }

        // Fullscreen change handler
        const handleFullscreenChange = () => {
            const fullscreen = !!document.fullscreenElement ||
                !!document.webkitFullscreenElement ||
                !!document.mozFullScreenElement;

            setIsFullscreen(fullscreen);

            if (!fullscreen && testAssignment?.proctoring_settings?.fullscreen_required) {
                handleViolation('fullscreen_exit', 'Exited fullscreen mode');
                setShowViolationModal(true);
            }
        };

        // Tab switch handler
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation('tab_switch', 'Switched tabs/windows');
            }
        };

        // Copy/Paste prevention
        const preventCopyPaste = (e) => {
            e.preventDefault();
            handleViolation('copy_paste', `${e.type} action detected`);
            toast.error(`${e.type.charAt(0).toUpperCase() + e.type.slice(1)} is disabled for this test`);
            return false;
        };

        // Right-click prevention
        const preventRightClick = (e) => {
            e.preventDefault();
            handleViolation('right_click', 'Right-click disabled');
            toast.error('Right-click is disabled for this test');
            return false;
        };

        // Keyboard shortcuts prevention
        const preventKeyboardShortcuts = (e) => {
            const forbiddenKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Escape'];

            // Prevent Ctrl+C, Ctrl+V, etc.
            if (e.ctrlKey || e.metaKey) {
                if (['c', 'v', 'x', 'a', 'z', 'y', 'p', 's'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    handleViolation('keyboard_shortcut', `Keyboard shortcut Ctrl+${e.key} disabled`);
                    toast.error(`Keyboard shortcut Ctrl+${e.key} is disabled`);
                    return;
                }
            }

            // Prevent function keys - only trigger once per key press
            if (forbiddenKeys.includes(e.key)) {
                e.preventDefault();
                handleViolation('function_key', `Function key ${e.key} disabled`);
                toast.error(`Function key ${e.key} is disabled`);
            }
        };

        // Add event listeners
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Copy/paste prevention
        if (testAssignment.proctoring_settings.copy_paste_prevention) {
            document.addEventListener('copy', preventCopyPaste);
            document.addEventListener('paste', preventCopyPaste);
            document.addEventListener('cut', preventCopyPaste);
            document.addEventListener('contextmenu', preventRightClick);
        }

        // Keyboard shortcuts prevention
        document.addEventListener('keydown', preventKeyboardShortcuts);

        // Store references for cleanup
        window._proctoringHandlers = {
            handleFullscreenChange,
            handleVisibilityChange,
            preventCopyPaste,
            preventRightClick,
            preventKeyboardShortcuts
        };

        proctoringInitializedRef.current = true;
    };

    const cleanupProctoring = () => {
        if (window._proctoringHandlers) {
            const {
                handleFullscreenChange,
                handleVisibilityChange,
                preventCopyPaste,
                preventRightClick,
                preventKeyboardShortcuts
            } = window._proctoringHandlers;

            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('copy', preventCopyPaste);
            document.removeEventListener('paste', preventCopyPaste);
            document.removeEventListener('cut', preventCopyPaste);
            document.removeEventListener('contextmenu', preventRightClick);
            document.removeEventListener('keydown', preventKeyboardShortcuts);

            delete window._proctoringHandlers;
        }

        // Stop camera stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
            setCameraAccess(false);
        }

        proctoringInitializedRef.current = false;
    };

    const checkCameraStatus = async () => {
        try {
            if (!mediaStream) {
                handleViolation('camera_disabled', 'Camera not active');
                setCameraAccess(false);
                return;
            }

            const videoTracks = mediaStream.getVideoTracks();

            if (videoTracks.length === 0) {
                handleViolation('camera_disabled', 'Camera disconnected');
                setCameraAccess(false);
                return;
            }

            const activeTracks = videoTracks.filter(track => track.readyState === 'live');

            if (activeTracks.length === 0) {
                handleViolation('camera_disabled', 'Camera stream inactive');
                setCameraAccess(false);
            } else {
                setCameraAccess(true);
            }
        } catch (error) {
            handleViolation('camera_disabled', 'Error accessing camera');
            setCameraAccess(false);
        }
    };

    const handleViolation = useCallback((type, message) => {
        setViolationCount(prevCount => {
            const newCount = prevCount + 1;
            return newCount;
        });

        // Add to proctoring warnings with auto-remove
        const warningId = Date.now();
        setProctoringWarnings(prev => [...prev, {
            id: warningId,
            type,
            message,
            timestamp: new Date().toISOString(),
            count: violationCountRef.current + 1
        }]);

        // Auto-remove warning after 5 seconds
        setTimeout(() => {
            setProctoringWarnings(prev => prev.filter(warning => warning.id !== warningId));
        }, 5000);

        // Save to database if test attempt exists
        if (testAttemptId) {
            updateProctoringViolation(testAttemptId, {
                type,
                message,
                timestamp: new Date().toISOString(),
                totalViolations: violationCountRef.current + 1
            });
        }

        // toast.error(`Violationsss: ${message}`);
    }, [testAttemptId]);

    const requestFullscreen = async () => {
        try {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            }
            return true;
        } catch (error) {
            return false;
        }
    };

    const requestCameraAccess = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error('Camera access not supported in this browser');
                return false;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            setMediaStream(stream);
            setCameraAccess(true);

            // Create a hidden video element to use the stream
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.play().catch(e => console.warn('Video play warning:', e));

            return true;
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                toast.error('Camera access was denied. Please allow camera permissions.');
            } else if (error.name === 'NotFoundError') {
                toast.error('No camera found. Please connect a camera.');
            } else {
                toast.error('Failed to access camera. Please check permissions.');
            }
            setCameraAccess(false);
            return false;
        }
    };

    const startTest = async () => {
        if (isStartingTest) return;

        setIsStartingTest(true);

        // Request camera access first if required
        if (testAssignment?.is_proctored && testAssignment?.proctoring_settings?.camera_required) {
            const cameraGranted = await requestCameraAccess();
            if (!cameraGranted) {
                toast.error('Camera access is required to start the test');
                setIsStartingTest(false);
                return;
            }
        }

        // Request fullscreen if required
        if (testAssignment?.is_proctored && testAssignment?.proctoring_settings?.fullscreen_required) {
            const success = await requestFullscreen();
            if (!success) {
                toast.error('Failed to enter fullscreen');
                setIsStartingTest(false);
                return;
            }
        }

        // Start test attempt in database
        try {
            const attemptResult = await startTestAttempt(testAssignmentId, user.id);
            if (!attemptResult.success) {
                toast.error(attemptResult.message || 'Failed to start test attempt');
                setIsStartingTest(false);
                return;
            }
            setTestAttemptId(attemptResult.attemptId);
        } catch (error) {
            toast.error('Error starting test attempt');
            setIsStartingTest(false);
            return;
        }

        setIsTestStarted(true);
        setShowInstructions(false);
        setIsStartingTest(false);
        toast.success('Test started! Proctoring active.');
    };

    const resumeTest = async () => {
        const success = await requestFullscreen();
        if (success) {
            setShowViolationModal(false);
        }
    };

    // Test functions
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatCountdown = (seconds) => {
        if (seconds < 60) {
            return `${seconds} seconds`;
        } else if (seconds < 3600) {
            const minutes = Math.ceil(seconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (seconds < 86400) {
            const hours = Math.ceil(seconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            const days = Math.ceil(seconds / 86400);
            return `${days} day${days > 1 ? 's' : ''}`;
        }
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

    const saveAllResponses = async () => {
        if (!testAttemptId || Object.keys(responses).length === 0) return;

        try {
            const submissionPromises = Object.entries(responses).map(([questionId, response]) =>
                submitTestResponse(testAttemptId, questionId, response)
            );
            await Promise.allSettled(submissionPromises);
        } catch (error) {
            console.error('Error auto-saving responses:', error);
        }
    };

    const handleSaveResponse = async (questionId) => {
        if (!testAttemptId) return;

        const response = responses[questionId];
        if (response) {
            try {
                await submitTestResponse(testAttemptId, questionId, response);
                toast.success('Response saved');
            } catch (error) {
                toast.error('Failed to save response');
            }
        }
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

    const submitAllResponses = async () => {
        // Ensure all questions have at least a null response in the database
        const allSubmissionPromises = questions.map(question => {
            const response = responses[question.id] || {
                answer: null,
                selectedOptions: null,
                questionType: question.question_type,
                timestamp: new Date().toISOString()
            };
            return submitTestResponse(testAttemptId, question.id, response);
        });

        await Promise.allSettled(allSubmissionPromises);
    };

    const handleAutoSubmit = async () => {
        if (isTestCompleted) return;

        setIsSubmitting(true);

        // Cleanup proctoring immediately when test ends
        cleanupProctoring();

        try {
            await submitAllResponses();
            const result = await submitTestAttempt(testAttemptId);

            if (result.success) {
                setIsTestCompleted(true);
                toast.success('Test submitted successfully!');
            } else {
                toast.error(result.message || 'Failed to submit test');
            }
        } catch (error) {
            toast.error('Error submitting test');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleSubmitTest = async () => {
        if (isSubmitting) return;
        setShowSubmitModal(true);
    };

    const confirmSubmitTest = async () => {
        setIsSubmitting(true);
        setShowSubmitModal(false);

        // Cleanup proctoring when manually submitting
        cleanupProctoring();

        try {
            await submitAllResponses();
            const result = await submitTestAttempt(testAttemptId);

            if (result.success) {
                setIsTestCompleted(true);
                toast.success('Test submitted successfully!');
            } else {
                toast.error(result.message || 'Failed to submit test');
            }
        } catch (error) {
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
        if (response && (response.answer || response.selectedOptions)) return 'answered';
        return 'not-answered';
    };

    // Render question function
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
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
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
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none cursor-text"
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
                                    <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs cursor-pointer">
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
                                className="w-full bg-gray-800 text-gray-100 border-0 focus:ring-0 font-mono resize-none cursor-text"
                                style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                            />
                        </div>
                    </div>
                );

            default:
                return <div>Unsupported question type</div>;
        }
    };

    // Loading state
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

    // Test hasn't started yet
    if (!isTestStarted && testAssignment?.availability === 'not_started') {
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
                        <p className="text-gray-600 mb-4">
                            This test is scheduled to begin on <strong>{new Date(testAssignment.test_start_date).toLocaleDateString()}</strong> at <strong>{new Date(testAssignment.test_start_date).toLocaleTimeString()}</strong>.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-3xl font-bold text-indigo-600 mb-2">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-sm text-gray-600">
                                Test will begin in {formatCountdown(timeLeft)}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button
                                disabled
                                className="w-full px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed opacity-50"
                            >
                                Start Test (Available Soon)
                            </button>
                            <div className="text-sm text-gray-500">
                                Please return to this page once the test start time has arrived.
                            </div>
                            <Link
                                href="/applications"
                                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all duration-200 cursor-pointer"
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

    // Test expired
    if (!isTestStarted && testAssignment?.availability === 'expired') {
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
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 cursor-pointer"
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
                            Thank you for completing the test. Your responses have been recorded.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <h4 className="font-semibold mb-2">Submission Details:</h4>
                            <p className="text-sm text-gray-600">• Total Questions: {questions.length}</p>
                            <p className="text-sm text-gray-600">• Questions Answered: {Object.keys(responses).filter(id => responses[id].answer || responses[id].selectedOptions).length}</p>
                            <p className="text-sm text-gray-600">• Proctoring Violations: {violationCount}</p>
                            <p className="text-sm text-green-600">• Camera & Proctoring: Disabled</p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => console.log('Test responses:', responses, 'Violations:', violationCount)}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 cursor-pointer"
                            >
                                View Submission Details (Console)
                            </button>
                            <Link
                                href="/applications"
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 cursor-pointer"
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
    if (showInstructions && !isTestStarted && testAssignment?.availability === 'available') {
        const isProctored = testAssignment?.is_proctored;
        const isCameraRequired = testAssignment.proctoring_settings?.camera_required;
        const isStartButtonEnabled = !isProctored || (isProctored && cameraAccess);

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
                                                    <li>Fullscreen mode is required throughout the test</li>
                                                )}
                                                {testAssignment.proctoring_settings?.tab_switching_detection && (
                                                    <li>Tab switching will be monitored and recorded</li>
                                                )}
                                                {testAssignment.proctoring_settings?.copy_paste_prevention && (
                                                    <li>Copy/paste functionality is disabled</li>
                                                )}
                                                <li>Camera access is required for monitoring</li>
                                                <li>Violations may affect your test results</li>
                                            </ul>
                                        </div>

                                        {/* Camera Check Section */}
                                        <div className="mt-4 p-4 bg-white rounded-lg border">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Camera className={`w-5 h-5 ${cameraAccess ? 'text-green-600' : 'text-red-600'}`} />
                                                    <span className="font-semibold">Camera Access</span>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${cameraAccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {cameraAccess ? 'Enabled' : 'Not Enabled'}
                                                </div>
                                            </div>
                                            {!cameraAccess && (
                                                <div className="text-sm text-gray-600 mb-3">
                                                    Camera access is required to start this proctored test.
                                                </div>
                                            )}
                                            <button
                                                onClick={requestCameraAccess}
                                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 cursor-pointer"
                                            >
                                                {cameraAccess ? 'Camera Enabled ✓' : 'Enable Camera Access'}
                                            </button>
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
                                                <p>• The test will auto-submit when time expires</p>
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
                                        <li>Any violation may be reported to the recruiter</li>
                                        {testAssignment?.is_proctored && (
                                            <li>Camera must remain enabled throughout the test</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
                                <Link
                                    href="/applications"
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all duration-200 text-center cursor-pointer"
                                >
                                    Cancel
                                </Link>
                                <button
                                    onClick={startTest}
                                    disabled={!isStartButtonEnabled || isStartingTest}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${isStartButtonEnabled
                                        ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                        : 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    {isStartingTest ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5" />
                                            {testAssignment?.is_proctored && !cameraAccess
                                                ? 'Enable Camera to Start Test'
                                                : 'Start Test'
                                            }
                                        </>
                                    )}
                                </button>
                            </div>

                            {testAssignment?.is_proctored && !cameraAccess && (
                                <div className="mt-4 text-center text-sm text-red-600">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    Camera access is required to start this proctored test.
                                </div>
                            )}
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
            <div className="min-h-screen bg-gray-50">
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

                                {/* Violation Count */}
                                {violationCount > 0 && (
                                    <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                                        <AlertTriangle className="w-4 h-4" />
                                        Violations: {violationCount}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Proctoring Status */}
                                {testAssignment?.is_proctored && (
                                    <div className="flex items-center gap-2 text-sm">
                                        {cameraAccess ? (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <Camera className="w-4 h-4" />
                                                <span>Camera Active</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-red-600">
                                                <Camera className="w-4 h-4" />
                                                <span>Camera Disabled</span>
                                            </div>
                                        )}
                                        {isFullscreen ? (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <Monitor className="w-4 h-4" />
                                                <span>Fullscreen</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-red-600">
                                                <Monitor className="w-4 h-4" />
                                                <span>Fullscreen Required</span>
                                            </div>
                                        )}
                                    </div>
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
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                                                className={`w-10 h-10 rounded-lg border-2 font-semibold text-sm transition-all cursor-pointer ${statusColors[status]
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
                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${flaggedQuestions.has(currentQuestion.id)
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
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleSaveResponse(currentQuestion.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 cursor-pointer"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save
                                        </button>

                                        {currentQuestionIndex < questions.length - 1 ? (
                                            <button
                                                onClick={goToNextQuestion}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 cursor-pointer"
                                            >
                                                Next
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSubmitTest}
                                                disabled={isSubmitting}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50 cursor-pointer"
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

            {/* Violation Modal */}
            {showViolationModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Fullscreen Violation</h3>
                        <p className="text-gray-600 mb-6">
                            You have exited fullscreen mode. Please return to fullscreen to continue.
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-700 font-semibold">Total Violations: {violationCount}</p>
                        </div>
                        <button
                            onClick={resumeTest}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                            Return to Fullscreen
                        </button>
                    </div>
                </div>
            )}

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Submit Test</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to submit the test?
                            You will not be able to make changes after submission.
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <p className="text-yellow-700 font-semibold">
                                Proctoring Violations: {violationCount}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all duration-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmitTest}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Submit Test
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Proctoring Warnings */}
            {proctoringWarnings.length > 0 && (
                <div className="fixed bottom-4 right-4 max-w-sm">
                    {proctoringWarnings.slice(-3).map(warning => (
                        <div
                            key={warning.id}
                            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-2 shadow-lg"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-red-700 font-semibold">
                                        Violation #{warning.count}
                                    </p>
                                    <p className="text-sm text-red-600">{warning.message}</p>
                                    <p className="text-xs text-red-500 mt-1">
                                        {new Date(warning.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}