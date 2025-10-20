'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
    ArrowLeft, Edit, FileText, Zap, Type, Users,
    Clock, Star, Calendar, Eye, EyeOff, CheckCircle,
    XCircle, BarChart3, Plus, Copy, Download,
    BookOpen, Play, Trash2, AlertTriangle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTestDetails } from '@/actions/tests/getTestDeatils';
import { setTestInactive } from '@/actions/tests/setTestInactive';
import { reactivateTest } from '@/actions/tests/setTestActive';

export default function TestDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const testId = params.testId;

    // State Management
    const [user, setUser] = useState(null);
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        type: '', // 'deactivate' or 'reactivate'
        testId: null,
        testTitle: '',
        action: null
    });

    // Loading States
    const [deactivateLoading, setDeactivateLoading] = useState(false);
    const [reactivateLoading, setReactivateLoading] = useState(false);

    // Authentication
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

    // Fetch test details
    const fetchTestDetails = async () => {
        if (!user?.orgId || !testId) return;

        setIsLoading(true);
        try {
            const result = await getTestDetails(testId, { orgId: user.orgId, userId: user.id });
            if (result.success) {
                console.log('Test Details:', result.questions);
                setTest(result.test);
                setQuestions(result.questions);
            } else {
                toast.error(result.message || 'Failed to load test details');
                router.push('/organization/tests');
            }
        } catch (error) {
            console.error('Error fetching test details:', error);
            toast.error('Error loading test details');
            router.push('/organization/tests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTestDetails();
        }
    }, [user, testId]);

    // Check if user has edit access (creator, allowed user, or OrgAdmin)
    const hasEditAccess = () => {
        if (!user || !test) return false;

        // User is the creator
        if (test.created_by === user.id) return true;

        // User is OrgAdmin (has access to all tests)
        if (user.role === 'OrgAdmin') return true;

        // Check if user is in the allowed_users array
        if (test.allowed_users && Array.isArray(test.allowed_users)) {
            return test.allowed_users.includes(user.id);
        }

        return false;
    };

    const userHasEditAccess = hasEditAccess();

    // Open confirmation modal
    const openConfirmationModal = (type, testId, testTitle, action) => {
        setModalData({
            type,
            testId,
            testTitle,
            action
        });
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setModalData({
            type: '',
            testId: null,
            testTitle: '',
            action: null
        });
    };

    // Handle modal confirmation
    const handleModalConfirm = async () => {
        if (!modalData.action) return;

        if (modalData.type === 'deactivate') {
            setDeactivateLoading(true);
        } else {
            setReactivateLoading(true);
        }

        try {
            await modalData.action();
            toast.success(
                modalData.type === 'deactivate'
                    ? 'Test deactivated successfully'
                    : 'Test reactivated successfully'
            );
            fetchTestDetails(); // Refresh the test data
        } catch (error) {
            console.error(`Error ${modalData.type}ing test:`, error);
            toast.error(`Error ${modalData.type}ing test`);
        } finally {
            if (modalData.type === 'deactivate') {
                setDeactivateLoading(false);
            } else {
                setReactivateLoading(false);
            }
            closeModal();
        }
    };

    // Toggle question expansion
    const toggleQuestionExpansion = (questionId) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getQuestionTypeInfo = (type) => {
        switch (type) {
            case 'mcq_single':
                return { icon: FileText, color: 'blue', label: 'Single Choice MCQ' };
            case 'mcq_multiple':
                return { icon: FileText, color: 'indigo', label: 'Multiple Choice MCQ' };
            case 'text':
                return { icon: Type, color: 'green', label: 'Text Answer' };
            case 'coding':
                return { icon: Zap, color: 'purple', label: 'Coding' };
            default:
                return { icon: FileText, color: 'gray', label: 'Unknown' };
        }
    };

    const getDifficultyColor = (level) => {
        switch (level) {
            case 'easy': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'hard': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (!user || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Test Not Found State
    if (!test) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Not Found</h2>
                    <p className="text-gray-600 mb-6">The test you're looking for doesn't exist or you don't have access to it.</p>
                    <button
                        onClick={() => router.push('/organization/tests')}
                        className="cursor-pointer px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        Back to Tests
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <Toaster />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => router.push('/organization/tests')}
                                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 cursor-pointer p-1 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Tests
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-indigo-100 rounded-xl">
                                            <FileText className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                                {test.title}
                                            </h1>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${test.is_active
                                                    ? 'bg-green-100 text-green-800 border-green-200'
                                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                                    }`}>
                                                    {test.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${userHasEditAccess
                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                    }`}>
                                                    {test.created_by === user.id ? 'Owner' : userHasEditAccess ? 'Can Edit' : 'View Only'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {test.description && (
                                        <p className="text-gray-600 text-lg mb-4">
                                            {test.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span>Created by {test.created_by_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Created {formatDate(test.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <span>{test.question_count} questions</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{test.duration_minutes} minutes</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    {/* Edit Button - Only for users with edit access */}
                                    {userHasEditAccess && (
                                        <button
                                            onClick={() => router.push(`/organization/create-test?edit=${test.id}`)}
                                            className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            <Edit className="w-5 h-5" />
                                            Edit Test
                                        </button>
                                    )}

                                    {/* Deactivate/Reactivate Button - Only for users with edit access */}
                                    {userHasEditAccess && (
                                        test.is_active ? (
                                            <button
                                                onClick={() => openConfirmationModal(
                                                    'deactivate',
                                                    test.id,
                                                    test.title,
                                                    () => setTestInactive(test.id, { orgId: user.orgId, userId: user.id })
                                                )}
                                                disabled={deactivateLoading}
                                                className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                            >
                                                {deactivateLoading ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openConfirmationModal(
                                                    'reactivate',
                                                    test.id,
                                                    test.title,
                                                    () => reactivateTest(test.id, { orgId: user.orgId, userId: user.id })
                                                )}
                                                disabled={reactivateLoading}
                                                className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                            >
                                                {reactivateLoading ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                ) : (
                                                    <Play className="w-5 h-5" />
                                                )}
                                                Reactivate
                                            </button>
                                        )
                                    )}

                                    {/* Assign Test Button - Redirects to assign test page */}
                                    <button
                                        onClick={() => router.push(`/organization/tests/${testId}/assign`)}
                                        className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Users className="w-5 h-5" />
                                        Assign Test
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-white rounded-2xl p-2 mb-8 shadow-lg border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart3 },
                                { id: 'questions', label: 'Questions', icon: BookOpen },
                                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
                            ].map((tab) => {
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
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="p-6 lg:p-8">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Test Overview</h2>

                                {/* Basic Test Information */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Duration</div>
                                                    <div className="text-2xl font-bold text-blue-600">{test.duration_minutes}</div>
                                                    <div className="text-sm text-gray-600">minutes</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Star className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Passing Score</div>
                                                    <div className="text-2xl font-bold text-green-600">{test.passing_marks}%</div>
                                                    <div className="text-sm text-gray-600">to pass</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FileText className="w-5 h-5 text-purple-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Total Questions</div>
                                                    <div className="text-2xl font-bold text-purple-600">{test.question_count}</div>
                                                    <div className="text-sm text-gray-600">questions</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Users className="w-5 h-5 text-orange-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Status</div>
                                                    <div className={`text-lg font-bold ${test.is_active ? 'text-green-600' : 'text-gray-600'
                                                        }`}>
                                                        {test.is_active ? 'Active' : 'Inactive'}
                                                    </div>
                                                    <div className="text-sm text-gray-600">test</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-indigo-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Total Marks</div>
                                                    <div className="text-lg font-bold text-indigo-600">{test.total_marks} marks</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Assignments</div>
                                                    <div className="text-lg font-bold text-blue-600">{test.assignment_count || 0} assigned</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Question Type Distribution */}
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                            <FileText className="w-6 h-6 text-indigo-600" />
                                            Question Types
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.entries(test.statistics?.questionTypes || {}).map(([type, count]) => {
                                                const typeInfo = getQuestionTypeInfo(type);
                                                const IconComponent = typeInfo.icon;
                                                const percentage = ((count / test.statistics.totalQuestions) * 100).toFixed(1);

                                                return (
                                                    <div key={type} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 bg-${typeInfo.color}-100 rounded-lg`}>
                                                                <IconComponent className={`w-4 h-4 text-${typeInfo.color}-600`} />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{typeInfo.label}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-semibold text-gray-900">{count}</div>
                                                            <div className="text-sm text-gray-500">{percentage}%</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Difficulty Distribution */}
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                                            Difficulty Levels
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.entries(test.statistics?.difficultyLevels || {}).map(([level, count]) => {
                                                const percentage = ((count / test.statistics.totalQuestions) * 100).toFixed(1);

                                                return (
                                                    <div key={level} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize ${getDifficultyColor(level)}`}>
                                                                {level}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-semibold text-gray-900">{count}</div>
                                                            <div className="text-sm text-gray-500">{percentage}%</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions Section */}
                                {test.instructions && (
                                    <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                            <FileText className="w-6 h-6 text-indigo-600" />
                                            Candidate Instructions
                                        </h3>
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                                                {test.instructions}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Questions Tab */}
                        {activeTab === 'questions' && (
                            <div className="p-6 lg:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Test Questions</h2>
                                    <div className="text-sm text-gray-600">
                                        {questions.length} questions • {test.total_marks} total marks
                                    </div>
                                </div>

                                {questions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Added</h3>
                                        <p className="text-gray-600 mb-6">This test doesn't have any questions yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {questions.map((question, index) => {
                                            const typeInfo = getQuestionTypeInfo(question.question_type);
                                            const IconComponent = typeInfo.icon;
                                            const isExpanded = expandedQuestions.has(question.id);

                                            return (
                                                <div key={question.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                                                    {/* Question Header */}
                                                    <div
                                                        className="bg-white p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                                        onClick={() => toggleQuestionExpansion(question.id)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-4 flex-1">
                                                                <div className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                                                                    {index + 1}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <h3 className="text-xl font-bold text-gray-900">
                                                                            {question.question_text}
                                                                        </h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(question.difficulty_level)}`}>
                                                                            {question.difficulty_level}
                                                                        </span>
                                                                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                                                                            {question.marks} marks
                                                                        </span>
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${typeInfo.color}-100 text-${typeInfo.color}-800 border border-${typeInfo.color}-200`}>
                                                                            <IconComponent className="w-4 h-4 inline mr-1" />
                                                                            {typeInfo.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-4">
                                                                {isExpanded ? (
                                                                    <EyeOff className="w-5 h-5 text-gray-400" />
                                                                ) : (
                                                                    <Eye className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Content */}
                                                    {isExpanded && (
                                                        <div className="bg-gray-50 border-t border-gray-200 p-6">
                                                            {/* MCQ Options */}
                                                            {(question.question_type === 'mcq_single' || question.question_type === 'mcq_multiple') && question.options && (
                                                                <div className="mb-6">
                                                                    <h4 className="font-semibold text-gray-900 mb-3">Options:</h4>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {Object.entries(question.options).map(([key, value]) => {
                                                                            const isCorrect = question.question_type === 'mcq_single'
                                                                                ? question.correct_options[0] === key
                                                                                : question.correct_options?.includes(key);

                                                                            return (
                                                                                <div key={key} className={`p-3 rounded-lg border-2 ${isCorrect
                                                                                    ? 'border-green-500 bg-green-50'
                                                                                    : 'border-gray-200 bg-white'
                                                                                    }`}>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${isCorrect
                                                                                            ? 'bg-green-500 text-white'
                                                                                            : 'bg-gray-100 text-gray-700'
                                                                                            }`}>
                                                                                            {key}
                                                                                        </div>
                                                                                        <span className="flex-1">{value}</span>
                                                                                        {isCorrect && (
                                                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Reference Answer for Text/Coding */}
                                                            {(question.question_type === 'text' || question.question_type === 'coding') && question.correct_answer && (
                                                                <div className="mb-6">
                                                                    <h4 className="font-semibold text-gray-900 mb-3">Reference Answer:</h4>
                                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                                        <pre className="whitespace-pre-wrap text-gray-700">
                                                                            {question.correct_answer}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Explanation */}
                                                            {question.explanation && (
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 mb-3">Explanation:</h4>
                                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                                        <p className="text-gray-700">{question.explanation}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && (
                            <div className="p-6 lg:p-8">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Test Analytics</h2>

                                <div className="text-center py-12">
                                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                                    <p className="text-gray-600 mb-6">
                                        Detailed analytics and performance reports will be available after candidates start taking the test.
                                    </p>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 inline-block">
                                        <div className="text-sm text-blue-700">
                                            <strong>Total Assignments:</strong> {test.assignment_count || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${modalData.type === 'deactivate'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                                }`}>
                                {modalData.type === 'deactivate' ? (
                                    <AlertTriangle className="w-6 h-6" />
                                ) : (
                                    <CheckCircle className="w-6 h-6" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {modalData.type === 'deactivate' ? 'Deactivate Test' : 'Reactivate Test'}
                            </h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600 mb-4">
                                {modalData.type === 'deactivate'
                                    ? `Are you sure you want to deactivate "${modalData.testTitle}"?`
                                    : `Are you sure you want to reactivate "${modalData.testTitle}"?`
                                }
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    {modalData.type === 'deactivate'
                                        ? 'The test will be hidden from assignment options but can be reactivated later.'
                                        : 'The test will become available for assignments again.'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeModal}
                                disabled={deactivateLoading || reactivateLoading}
                                className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalConfirm}
                                disabled={deactivateLoading || reactivateLoading}
                                className={`cursor-pointer px-6 py-2 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${modalData.type === 'deactivate'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {(deactivateLoading || reactivateLoading) ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {modalData.type === 'deactivate' ? 'Deactivating...' : 'Reactivating...'}
                                    </div>
                                ) : (
                                    modalData.type === 'deactivate' ? 'Deactivate Test' : 'Reactivate Test'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}