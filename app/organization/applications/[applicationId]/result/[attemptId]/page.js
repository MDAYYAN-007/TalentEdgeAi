'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import {
    ArrowLeft, FileText, CheckCircle, XCircle, Star,
    Edit, Save, Clock, User, Building, MapPin,
    Calendar, Mail, Eye, EyeOff, Download,
    ChevronDown, ChevronUp, Search, Filter,
    MessageSquare, ThumbsUp, ThumbsDown, AlertCircle,
    RefreshCw, BarChart3, Target, Award
} from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { getTestResults } from '@/actions/tests/getTestResults';
import { updateTestMarks } from '@/actions/tests/updateTestMarks';

export default function TestResultsPage() {
    const router = useRouter();
    const params = useParams();
    const applicationId = params.applicationId;
    const attemptId = params.attemptId;

    const [testResults, setTestResults] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMarks, setEditedMarks] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchUserAndCheckAuth = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    return;
                }

                setUser(currentUser);

                if (currentUser.role && !['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    router.push('/dashboard');
                    return;
                }

            } catch (error) {
                console.error('Error getting current user:', error);
                router.push('/signin');
            }finally {
                setIsLoading(false);
            }
        };

        fetchUserAndCheckAuth();
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchTestResults();
        }
    }, [user, applicationId]);

    const fetchTestResults = async () => {
        setIsLoading(true);
        try {
            const result = await getTestResults(attemptId);

            if (result.success) {
                setTestResults(result.data);
                const initialMarks = {};
                result.data.responses.forEach(response => {
                    initialMarks[response.id] = response.marks_awarded;
                });
                setEditedMarks(initialMarks);
            } else {
                toast.error(result.message || 'Failed to load test results');
            }
        } catch (error) {
            console.error('Error fetching test results:', error);
            toast.error('Error loading test results');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkChange = (responseId, newMark) => {
        const response = testResults.responses.find(r => r.id === responseId);
        const maxMarks = response.marks;

        let validatedMark;
        if (newMark === '' || isNaN(newMark)) {
            validatedMark = 0;
        } else {
            validatedMark = Math.max(0, Math.min(parseFloat(newMark), maxMarks));
        }

        setEditedMarks(prev => ({
            ...prev,
            [responseId]: validatedMark
        }));
    };

    const handleSaveMarks = async () => {
        setIsSaving(true);
        try {
            const updates = [];

            for (const [responseId, newMark] of Object.entries(editedMarks)) {
                const originalMark = testResults.responses.find(r => r.id === parseInt(responseId)).marks_awarded;

                if (newMark !== originalMark) {
                    updates.push(
                        updateTestMarks(
                            parseInt(responseId),
                            newMark,
                            `Marks manually adjusted by ${user.name} from ${originalMark} to ${newMark}`
                        )
                    );
                }
            }

            const results = await Promise.all(updates);
            const allSuccessful = results.every(result => result.success);

            if (allSuccessful) {
                toast.success('Marks updated successfully!');
                setIsEditing(false);
                // Refresh the data
                await fetchTestResults();
            } else {
                toast.error('Some marks failed to update');
            }
        } catch (error) {
            console.error('Error saving marks:', error);
            toast.error('Error saving marks');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleQuestionExpansion = (questionId) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
    };

    const getScoreColor = (score, maxScore) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            easy: 'text-green-600 bg-green-50 border-green-200',
            medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            hard: 'text-red-600 bg-red-50 border-red-200'
        };
        return colors[difficulty] || 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const getQuestionTypeColor = (type) => {
        const colors = {
            mcq_single: 'text-blue-600 bg-blue-50 border-blue-200',
            mcq_multiple: 'text-purple-600 bg-purple-50 border-purple-200',
            text: 'text-orange-600 bg-orange-50 border-orange-200',
            coding: 'text-indigo-600 bg-indigo-50 border-indigo-200'
        };
        return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const formatTimeSpent = (seconds) => {
        if (!seconds) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
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

    const filteredResponses = testResults?.responses.filter(response => {
        const matchesSearch = searchQuery === '' ||
            response.question_text.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterType === 'all' ||
            (filterType === 'correct' && response.marks_awarded === response.marks) ||
            (filterType === 'incorrect' && response.marks_awarded === 0) ||
            (filterType === 'partial' && response.marks_awarded > 0 && response.marks_awarded < response.marks) ||
            (filterType === 'type' && response.question_type === filterType);

        return matchesSearch && matchesFilter;
    }) || [];

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading test results...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
                        <p className="text-gray-600 mb-6">You need to be signed in to view test results.</p>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/signin"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!testResults) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Results Not Found</h2>
                        <p className="text-gray-600 mb-6">No test results available for this application.</p>
                        <Link
                            href={`/organization/applications/${applicationId}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Application
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const { attempt, test, application, responses, summary } = testResults;

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
                                href={`/organization/applications/${applicationId}`}
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Application
                            </Link>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        {application.title}
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    Test Results - {application.applicant_name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-medium">{test.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Completed {formatDate(attempt.submitted_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getScoreColor(summary.percentage, 100)} shadow-sm`}>
                                    <Star className="w-4 h-4" />
                                    <span className="font-semibold text-sm">{summary.percentage}% Overall</span>
                                </div>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${summary.is_passed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} shadow-sm`}>
                                    {summary.is_passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    <span className="font-semibold text-sm">{summary.is_passed ? 'PASSED' : 'FAILED'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{summary.correct_answers}</div>
                                    <div className="text-sm text-gray-600">Correct Answers</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">{Math.round((summary.correct_answers / summary.total_questions) * 100)}% of total</div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{summary.incorrect_answers}</div>
                                    <div className="text-sm text-gray-600">Incorrect Answers</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">{Math.round((summary.incorrect_answers / summary.total_questions) * 100)}% of total</div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Star className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{summary.partial_marks}</div>
                                    <div className="text-sm text-gray-600">Partial Marks</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">{Math.round((summary.partial_marks / summary.total_questions) * 100)}% of total</div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Target className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{summary.total_score}/{test.total_marks}</div>
                                    <div className="text-sm text-gray-600">Total Score</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">Passing: {test.passing_marks}%</div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors w-64"
                                    />
                                </div>

                                {/* Filter */}
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                                >
                                    <option value="all">All Questions</option>
                                    <option value="correct">Correct Answers</option>
                                    <option value="incorrect">Incorrect Answers</option>
                                    <option value="partial">Partial Marks</option>
                                    <option value="mcq_single">Single Choice</option>
                                    <option value="mcq_multiple">Multiple Choice</option>
                                    <option value="text">Text Answers</option>
                                    <option value="coding">Coding Questions</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                // Reset edited marks
                                                const initialMarks = {};
                                                responses.forEach(response => {
                                                    initialMarks[response.id] = response.marks_awarded;
                                                });
                                                setEditedMarks(initialMarks);
                                            }}
                                            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveMarks}
                                            disabled={isSaving}
                                            className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Marks
                                    </button>
                                )}

                                <button
                                    onClick={fetchTestResults}
                                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </button>

                                <button
                                    onClick={() => toast.success('Export functionality coming soon!')}
                                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-6">
                        {filteredResponses.map((response, index) => {
                            const isExpanded = expandedQuestions.has(response.id);
                            const isFullyCorrect = response.marks_awarded === response.marks;
                            const isPartiallyCorrect = response.marks_awarded > 0 && response.marks_awarded < response.marks;
                            const isIncorrect = response.marks_awarded === 0;

                            return (
                                <div key={response.id} className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                    {/* Question Header */}
                                    <div
                                        className="cursor-pointer p-6 hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleQuestionExpansion(response.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-lg font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                                                        Q{index + 1}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getQuestionTypeColor(response.question_type)}`}>
                                                        {response.question_type === 'mcq_single' && 'Single Choice'}
                                                        {response.question_type === 'mcq_multiple' && 'Multiple Choice'}
                                                        {response.question_type === 'text' && 'Text Answer'}
                                                        {response.question_type === 'coding' && 'Coding'}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(response.difficulty_level)}`}>
                                                        {response.difficulty_level}
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                                    {response.question_text}
                                                </h3>

                                                <div className="flex items-center gap-4">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border-2 ${getScoreColor(response.marks_awarded, response.marks)}`}>
                                                        <Star className="w-4 h-4" />
                                                        <span className="font-semibold">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={isNaN(editedMarks[response.id]) ? 0 : editedMarks[response.id]}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        const numericValue = value === '' ? 0 : parseFloat(value);
                                                                        handleMarkChange(response.id, numericValue);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onKeyDown={(e) => e.stopPropagation()}
                                                                    min="0"
                                                                    max={response.marks}
                                                                    step="0.5"
                                                                    className="w-16 bg-transparent border-none focus:outline-none focus:ring-0 cursor-text"
                                                                />
                                                            ) : (
                                                                response.marks_awarded
                                                            )}
                                                            /{response.marks}
                                                        </span>
                                                    </div>

                                                    {isFullyCorrect && (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Correct</span>
                                                        </div>
                                                    )}
                                                    {isPartiallyCorrect && (
                                                        <div className="flex items-center gap-1 text-yellow-600">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Partial</span>
                                                        </div>
                                                    )}
                                                    {isIncorrect && (
                                                        <div className="flex items-center gap-1 text-red-600">
                                                            <XCircle className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Incorrect</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Candidate's Answer */}
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                        Candidate's Answer
                                                    </h4>

                                                    {response.question_type.includes('mcq') ? (
                                                        <div className="space-y-2">
                                                            {response.selected_options && response.selected_options.length > 0 ? (
                                                                response.selected_options.map((option, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${response.correct_options?.includes(option)
                                                                            ? 'bg-green-100 border-green-500 text-green-600'
                                                                            : 'bg-red-100 border-red-500 text-red-600'
                                                                            }`}>
                                                                            {response.correct_options?.includes(option) ?
                                                                                <CheckCircle className="w-4 h-4" /> :
                                                                                <XCircle className="w-4 h-4" />
                                                                            }
                                                                        </div>
                                                                        <span className="font-medium">{option}. {response.options?.[option]}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-gray-500 italic">No answer provided</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                            <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm">
                                                                {response.answer || 'No answer provided'}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Evaluation & Feedback */}
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <FileText className="w-5 h-5 text-green-600" />
                                                        Evaluation & Feedback
                                                    </h4>

                                                    {/* Correct Answer */}
                                                    {response.correct_options && (
                                                        <div className="mb-4">
                                                            <div className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {response.correct_options.map((option, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                                        {option}. {response.options?.[option]}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {response.correct_answer && (
                                                        <div className="mb-4">
                                                            <div className="text-sm font-medium text-gray-700 mb-2">Expected Answer:</div>
                                                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                                <p className="text-green-800">{response.correct_answer}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Explanation */}
                                                    {response.explanation && (
                                                        <div className="mb-4">
                                                            <div className="text-sm font-medium text-gray-700 mb-2">Explanation:</div>
                                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                                <p className="text-blue-800">{response.explanation}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* AI Feedback */}
                                                    {response.ai_feedback && (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-700 mb-2">AI Feedback:</div>
                                                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                                                <p className="text-purple-800">{response.ai_feedback}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mark Adjustment (Editing Mode) */}
                                            {isEditing && (
                                                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Edit className="w-5 h-5 text-yellow-600" />
                                                        <h5 className="font-semibold text-yellow-800">Adjust Marks</h5>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium text-gray-700">Marks:</label>
                                                            <input
                                                                type="number"
                                                                value={isNaN(editedMarks[response.id]) ? 0 : editedMarks[response.id]}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const numericValue = value === '' ? 0 : parseFloat(value);
                                                                    handleMarkChange(response.id, numericValue);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                min="0"
                                                                max={response.marks}
                                                                step="0.5"
                                                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-text"
                                                            />
                                                            <span className="text-sm text-gray-500">/ {response.marks}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {((editedMarks[response.id] / response.marks) * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* No Results Message */}
                    {filteredResponses.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
                            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}