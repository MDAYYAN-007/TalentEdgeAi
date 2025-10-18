// app/organization/create-test/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
    Plus, Trash2, Save, ArrowLeft, Clock, FileText,
    Zap, Type, Hash, Star, Settings, Eye
} from 'lucide-react';
import { createTest } from '@/actions/tests/createTest';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CreateTestPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [activeQuestionTab, setActiveQuestionTab] = useState('mcq_single');

    // Test basic information
    const [testData, setTestData] = useState({
        title: '',
        description: '',
        durationMinutes: 60,
        passingMarks: 60,
        isProctored: false,
        instructions: '',
        proctoringSettings: {
            fullscreen_required: true,
            tab_switching_detection: true,
            copy_paste_prevention: true
        }
    });

    // Questions state - Start with empty array
    const [questions, setQuestions] = useState([]);

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

    // Add question function
    const addQuestion = (type = 'mcq_single') => {
        const newQuestion = {
            id: Date.now(),
            questionType: type,
            questionText: '',
            marks: 1,
            options: type.includes('mcq') ? { A: '', B: '', C: '', D: '' } : undefined,
            correctAnswer: '',
            correctOptions: type === 'mcq_multiple' ? [] : undefined,
            explanation: '',
            difficultyLevel: 'medium'
        };
        setQuestions([...questions, newQuestion]);
        setActiveQuestionTab(type);
    };

    // Remove question
    const removeQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    // Update question field
    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    // Update question option
    const updateQuestionOption = (questionIndex, optionKey, value) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options[optionKey] = value;
        setQuestions(newQuestions);
    };

    // Add option to question
    const addOption = (questionIndex) => {
        const newQuestions = [...questions];
        const options = newQuestions[questionIndex].options;
        const optionKeys = Object.keys(options);
        const lastKey = optionKeys[optionKeys.length - 1];
        const newKey = String.fromCharCode(lastKey.charCodeAt(0) + 1);

        newQuestions[questionIndex].options[newKey] = '';
        setQuestions(newQuestions);
    };

    // Remove option from question
    const removeOption = (questionIndex, optionKey) => {
        const newQuestions = [...questions];
        const options = { ...newQuestions[questionIndex].options };
        delete options[optionKey];

        if (newQuestions[questionIndex].correctAnswer === optionKey) {
            newQuestions[questionIndex].correctAnswer = '';
        }
        if (newQuestions[questionIndex].correctOptions?.includes(optionKey)) {
            const newCorrectOptions = newQuestions[questionIndex].correctOptions.filter(opt => opt !== optionKey);
            newQuestions[questionIndex].correctOptions = newCorrectOptions;
        }

        newQuestions[questionIndex].options = options;
        setQuestions(newQuestions);
    };

    // Calculate total marks
    const totalMarks = questions.reduce((sum, question) => sum + parseInt(question.marks || 0), 0);

    // Validation functions
    const validateStep1 = () => {
        if (!testData.title.trim()) {
            toast.error('Test title is required');
            return false;
        }
        if (!testData.durationMinutes || testData.durationMinutes < 30 || testData.durationMinutes > 180) {
            toast.error('Duration must be between 30 and 180 minutes');
            return false;
        }
        if (!testData.passingMarks || testData.passingMarks < 0 || testData.passingMarks > 100) {
            toast.error('Passing marks must be between 0 and 100');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (questions.length === 0) {
            toast.error('At least one question is required');
            return false;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            if (!q.questionText.trim()) {
                toast.error(`Question ${i + 1} text is required`);
                setActiveQuestionTab(q.questionType);
                return false;
            }

            if (q.questionType.includes('mcq')) {
                const emptyOptions = Object.values(q.options).some(opt => !opt.trim());
                if (emptyOptions) {
                    toast.error(`All options for Question ${i + 1} must be filled`);
                    return false;
                }

                if (q.questionType === 'mcq_single' && !q.correctAnswer) {
                    toast.error(`Please select correct answer for Question ${i + 1}`);
                    return false;
                }
                if (q.questionType === 'mcq_multiple' && (!q.correctOptions || q.correctOptions.length === 0)) {
                    toast.error(`Please select at least one correct answer for Question ${i + 1}`);
                    return false;
                }
            }

            if ((q.questionType === 'text' || q.questionType === 'coding') && !q.correctAnswer.trim()) {
                toast.error(`Reference answer is required for Question ${i + 1}`);
                return false;
            }

            if (!q.marks || q.marks < 1) {
                toast.error(`Marks must be at least 1 for Question ${i + 1}`);
                return false;
            }
        }

        return true;
    };

    // Navigation handlers
    const handleNextToQuestions = () => {
        if (validateStep1()) {
            setActiveStep(2);
        }
    };

    const handleNextToReview = () => {
        if (validateStep2()) {
            setActiveStep(3);
        }
    };

    const handleTabSwitch = (tabId) => {
        setActiveQuestionTab(tabId);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep1() || !validateStep2()) {
            toast.error('Please fix all errors before submitting');
            return;
        }

        setIsLoading(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await createTest(testData, questions, authData);

            if (result.success) {
                toast.success('Test created successfully!');
                router.push('/organization/tests');
            } else {
                toast.error(result.message || 'Failed to create test');
            }
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Error creating test');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <Toaster />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                Create New Test
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Build comprehensive assessments with multiple question types and proctoring options.
                            </p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
                        <div className="flex flex-wrap gap-4 justify-between items-center">
                            {[
                                { number: 1, label: 'Test Details', icon: Settings },
                                { number: 2, label: 'Questions', icon: FileText },
                                { number: 3, label: 'Review', icon: Eye }
                            ].map((step) => {
                                const IconComponent = step.icon;
                                return (
                                    <div key={step.number} className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${activeStep >= step.number
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                            {activeStep > step.number ? (
                                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                                </div>
                                            ) : (
                                                step.number
                                            )}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-sm text-gray-500">Step {step.number}</p>
                                            <p className="font-semibold text-gray-900">{step.label}</p>
                                        </div>
                                        {step.number < 3 && (
                                            <div className="hidden md:block w-12 h-0.5 bg-gray-300 ml-4"></div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Total Marks Display */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200">
                                <div className="text-2xl font-bold text-green-600">{totalMarks}</div>
                                <div className="text-sm text-green-700 font-semibold">Total Marks</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Test Details */}
                        {activeStep === 1 && (
                            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <Settings className="w-8 h-8 text-indigo-600" />
                                    Test Basic Information
                                </h2>

                                <div className="space-y-6">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Test Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={testData.title}
                                            onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                            placeholder="Enter test title (e.g., Frontend Developer Assessment)"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={testData.description}
                                            onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                                            placeholder="Describe what this test assesses..."
                                            rows="3"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        />
                                    </div>

                                    {/* Duration & Passing Marks */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Clock className="w-4 h-4 inline mr-2" />
                                                Duration (Minutes) *
                                            </label>
                                            <input
                                                type="number"
                                                value={testData.durationMinutes}
                                                onChange={(e) => setTestData({ ...testData, durationMinutes: e.target.value })}
                                                min="30"
                                                max="180"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Must be between 30-180 minutes</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Star className="w-4 h-4 inline mr-2" />
                                                Passing Marks (%) *
                                            </label>
                                            <input
                                                type="number"
                                                value={testData.passingMarks}
                                                onChange={(e) => setTestData({ ...testData, passingMarks: e.target.value })}
                                                min="0"
                                                max="100"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Proctoring Settings */}
                                    <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Zap className="w-6 h-6 text-blue-600" />
                                            <h3 className="text-xl font-bold text-gray-900">Proctoring Settings</h3>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <input
                                                type="checkbox"
                                                id="isProctored"
                                                checked={testData.isProctored}
                                                onChange={(e) => setTestData({ ...testData, isProctored: e.target.checked })}
                                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor="isProctored" className="text-lg font-semibold text-gray-900">
                                                Enable Proctoring
                                            </label>
                                        </div>

                                        {testData.isProctored && (
                                            <div className="space-y-3 ml-8">
                                                {[
                                                    { key: 'fullscreen_required', label: 'Require Full Screen' },
                                                    { key: 'tab_switching_detection', label: 'Detect Tab Switching' },
                                                    { key: 'copy_paste_prevention', label: 'Prevent Copy/Paste' }
                                                ].map((setting) => (
                                                    <div key={setting.key} className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id={setting.key}
                                                            checked={testData.proctoringSettings[setting.key]}
                                                            onChange={(e) => setTestData({
                                                                ...testData,
                                                                proctoringSettings: {
                                                                    ...testData.proctoringSettings,
                                                                    [setting.key]: e.target.checked
                                                                }
                                                            })}
                                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor={setting.key} className="text-gray-700">
                                                            {setting.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <FileText className="w-4 h-4 inline mr-2" />
                                            Instructions for Candidates
                                        </label>
                                        <textarea
                                            value={testData.instructions}
                                            onChange={(e) => setTestData({ ...testData, instructions: e.target.value })}
                                            placeholder="Provide clear instructions for candidates..."
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleNextToQuestions}
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Next: Add Questions
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Questions with Tabs */}
                        {activeStep === 2 && (
                            <div className="space-y-6">
                                {/* Question Type Tabs */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-indigo-600" />
                                        Add Questions
                                    </h2>

                                    {/* Tabs Navigation */}
                                    <div className="border-b border-gray-200">
                                        <nav className="flex flex-wrap gap-2 -mb-px">
                                            {[
                                                {
                                                    id: 'mcq_single',
                                                    label: 'Single Choice MCQs',
                                                    icon: FileText,
                                                    color: 'blue',
                                                    count: questions.filter(q => q.questionType === 'mcq_single').length
                                                },
                                                {
                                                    id: 'mcq_multiple',
                                                    label: 'Multiple Choice MCQs',
                                                    icon: FileText,
                                                    color: 'indigo',
                                                    count: questions.filter(q => q.questionType === 'mcq_multiple').length
                                                },
                                                {
                                                    id: 'text',
                                                    label: 'Text Answers',
                                                    icon: Type,
                                                    color: 'green',
                                                    count: questions.filter(q => q.questionType === 'text').length
                                                },
                                                {
                                                    id: 'coding',
                                                    label: 'Coding Questions',
                                                    icon: Zap,
                                                    color: 'purple',
                                                    count: questions.filter(q => q.questionType === 'coding').length
                                                }
                                            ].map((tab) => {
                                                const IconComponent = tab.icon;
                                                const isActive = activeQuestionTab === tab.id;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => handleTabSwitch(tab.id)}
                                                        className={`flex items-center gap-2 px-4 py-3 rounded-t-lg border-b-2 font-semibold transition-all duration-200 ${isActive
                                                            ? `border-${tab.color}-500 text-${tab.color}-700 bg-${tab.color}-50`
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <IconComponent className="w-5 h-5" />
                                                        <span>{tab.label}</span>
                                                        {tab.count > 0 && (
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${isActive ? `bg-${tab.color}-500 text-white` : 'bg-gray-200 text-gray-700'
                                                                }`}>
                                                                {tab.count}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="mt-6">
                                        {/* Single Choice MCQs Tab */}
                                        {activeQuestionTab === 'mcq_single' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">Single Choice Questions</h3>
                                                        <p className="text-gray-600">Questions with one correct answer</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addQuestion('mcq_single')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        Add Single Choice Question
                                                    </button>
                                                </div>

                                                {questions.filter(q => q.questionType === 'mcq_single').length === 0 ? (
                                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                                                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Single Choice Questions</h4>
                                                        <p className="text-gray-600 mb-4">Add your first single choice question</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => addQuestion('mcq_single')}
                                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                                        >
                                                            Add First Question
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {questions
                                                            .filter(q => q.questionType === 'mcq_single')
                                                            .map((question, index) => (
                                                                <QuestionCard
                                                                    key={question.id}
                                                                    question={question}
                                                                    index={index}
                                                                    globalIndex={questions.findIndex(q => q.id === question.id)}
                                                                    onUpdate={updateQuestion}
                                                                    onRemove={removeQuestion}
                                                                    onUpdateOption={updateQuestionOption}
                                                                    onAddOption={addOption}
                                                                    onRemoveOption={removeOption}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Multiple Choice MCQs Tab */}
                                        {activeQuestionTab === 'mcq_multiple' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">Multiple Choice Questions</h3>
                                                        <p className="text-gray-600">Questions with multiple correct answers</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addQuestion('mcq_multiple')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        Add Multiple Choice Question
                                                    </button>
                                                </div>

                                                {questions.filter(q => q.questionType === 'mcq_multiple').length === 0 ? (
                                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                                                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Multiple Choice Questions</h4>
                                                        <p className="text-gray-600 mb-4">Add your first multiple choice question</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => addQuestion('mcq_multiple')}
                                                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                                        >
                                                            Add First Question
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {questions
                                                            .filter(q => q.questionType === 'mcq_multiple')
                                                            .map((question, index) => (
                                                                <QuestionCard
                                                                    key={question.id}
                                                                    question={question}
                                                                    index={index}
                                                                    globalIndex={questions.findIndex(q => q.id === question.id)}
                                                                    onUpdate={updateQuestion}
                                                                    onRemove={removeQuestion}
                                                                    onUpdateOption={updateQuestionOption}
                                                                    onAddOption={addOption}
                                                                    onRemoveOption={removeOption}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Text Answers Tab */}
                                        {activeQuestionTab === 'text' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">Text Answer Questions</h3>
                                                        <p className="text-gray-600">Questions requiring descriptive answers (AI-graded)</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addQuestion('text')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        Add Text Question
                                                    </button>
                                                </div>

                                                {questions.filter(q => q.questionType === 'text').length === 0 ? (
                                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                                                        <Type className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Text Answer Questions</h4>
                                                        <p className="text-gray-600 mb-4">Add your first text answer question</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => addQuestion('text')}
                                                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                                        >
                                                            Add First Question
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {questions
                                                            .filter(q => q.questionType === 'text')
                                                            .map((question, index) => (
                                                                <QuestionCard
                                                                    key={question.id}
                                                                    question={question}
                                                                    index={index}
                                                                    globalIndex={questions.findIndex(q => q.id === question.id)}
                                                                    onUpdate={updateQuestion}
                                                                    onRemove={removeQuestion}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Coding Questions Tab */}
                                        {activeQuestionTab === 'coding' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">Coding Questions</h3>
                                                        <p className="text-gray-600">Programming questions with code evaluation</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addQuestion('coding')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        Add Coding Question
                                                    </button>
                                                </div>

                                                {questions.filter(q => q.questionType === 'coding').length === 0 ? (
                                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                                                        <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Coding Questions</h4>
                                                        <p className="text-gray-600 mb-4">Add your first coding question</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => addQuestion('coding')}
                                                            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                                                        >
                                                            Add First Question
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {questions
                                                            .filter(q => q.questionType === 'coding')
                                                            .map((question, index) => (
                                                                <QuestionCard
                                                                    key={question.id}
                                                                    question={question}
                                                                    index={index}
                                                                    globalIndex={questions.findIndex(q => q.id === question.id)}
                                                                    onUpdate={updateQuestion}
                                                                    onRemove={removeQuestion}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Questions Summary */}
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Questions Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { type: 'mcq_single', label: 'Single Choice', color: 'blue', icon: FileText },
                                            { type: 'mcq_multiple', label: 'Multiple Choice', color: 'indigo', icon: FileText },
                                            { type: 'text', label: 'Text Answers', color: 'green', icon: Type },
                                            { type: 'coding', label: 'Coding', color: 'purple', icon: Zap }
                                        ].map((summary) => {
                                            const IconComponent = summary.icon;
                                            const count = questions.filter(q => q.questionType === summary.type).length;
                                            const marks = questions.filter(q => q.questionType === summary.type)
                                                .reduce((sum, q) => sum + parseInt(q.marks || 0), 0);

                                            return (
                                                <div
                                                    key={summary.type}
                                                    onClick={() => handleTabSwitch(summary.type)}
                                                    className={`bg-white p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${activeQuestionTab === summary.type
                                                        ? `border-${summary.color}-500 shadow-sm`
                                                        : 'border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`bg-${summary.color}-100 p-2 rounded-lg`}>
                                                            <IconComponent className={`w-5 h-5 text-${summary.color}-600`} />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{count}</div>
                                                            <div className="text-sm text-gray-600">{summary.label}</div>
                                                            <div className="text-xs text-gray-500">{marks} marks</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setActiveStep(1)}
                                        className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-all duration-200"
                                    >
                                        Back to Details
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextToReview}
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Review Test
                                    </button>
                                </div>
                            </div>
                        )}

                        // Step 3: Review
                        {activeStep === 3 && (
                            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <Eye className="w-8 h-8 text-indigo-600" />
                                    Review Your Test
                                </h2>

                                {/* Test Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                        <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                                        <div className="text-sm text-blue-700 font-semibold">Total Questions</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <div className="text-2xl font-bold text-green-600">{totalMarks}</div>
                                        <div className="text-sm text-green-700 font-semibold">Total Marks</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                        <div className="text-2xl font-bold text-purple-600">{testData.durationMinutes}</div>
                                        <div className="text-sm text-purple-700 font-semibold">Minutes</div>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                        <div className="text-2xl font-bold text-orange-600">{testData.passingMarks}%</div>
                                        <div className="text-sm text-orange-700 font-semibold">Passing Score</div>
                                    </div>
                                </div>

                                {/* Questions Review - Categorized by Type and Sorted by Difficulty */}
                                <div className="space-y-8 mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Questions Preview</h3>

                                    {/* Categorize questions by type */}
                                    {(() => {
                                        // Group questions by type
                                        const questionsByType = questions.reduce((acc, question) => {
                                            const type = question.questionType;
                                            if (!acc[type]) acc[type] = [];
                                            acc[type].push(question);
                                            return acc;
                                        }, {});

                                        // Define type labels and order
                                        const typeOrder = ['mcq_single', 'mcq_multiple', 'text', 'coding'];
                                        const typeLabels = {
                                            'mcq_single': 'Single Choice MCQs',
                                            'mcq_multiple': 'Multiple Choice MCQs',
                                            'text': 'Text Answer Questions',
                                            'coding': 'Coding Questions'
                                        };

                                        const typeIcons = {
                                            'mcq_single': FileText,
                                            'mcq_multiple': FileText,
                                            'text': Type,
                                            'coding': Zap
                                        };

                                        const typeColors = {
                                            'mcq_single': 'blue',
                                            'mcq_multiple': 'indigo',
                                            'text': 'green',
                                            'coding': 'purple'
                                        };

                                        return typeOrder.map(type => {
                                            if (!questionsByType[type] || questionsByType[type].length === 0) return null;

                                            const IconComponent = typeIcons[type];
                                            const color = typeColors[type];
                                            const typeQuestions = questionsByType[type];

                                            // Sort questions by difficulty (easy -> medium -> hard)
                                            const sortedQuestions = typeQuestions.sort((a, b) => {
                                                const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                                                return difficultyOrder[a.difficultyLevel] - difficultyOrder[b.difficultyLevel];
                                            });

                                            return (
                                                <div key={type} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                                                    {/* Category Header */}
                                                    <div className={`bg-${color}-50 border-b-2 border-${color}-200 p-4`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`bg-${color}-100 p-2 rounded-lg`}>
                                                                <IconComponent className={`w-5 h-5 text-${color}-600`} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-lg">
                                                                    {typeLabels[type]}
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {sortedQuestions.length} question{sortedQuestions.length > 1 ? 's' : ''} •
                                                                    Total {sortedQuestions.reduce((sum, q) => sum + parseInt(q.marks), 0)} marks
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Questions List */}
                                                    <div className="divide-y divide-gray-200">
                                                        {sortedQuestions.map((question, index) => (
                                                            <div key={question.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-start gap-3 mb-2">
                                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1 ${question.difficultyLevel === 'easy'
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : question.difficultyLevel === 'medium'
                                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                                    : 'bg-red-100 text-red-800'
                                                                                }`}>
                                                                                {index + 1}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <h5 className="font-semibold text-gray-900 mb-1">
                                                                                    {question.questionText}
                                                                                </h5>
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${question.difficultyLevel === 'easy'
                                                                                        ? 'bg-green-100 text-green-800'
                                                                                        : question.difficultyLevel === 'medium'
                                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                                            : 'bg-red-100 text-red-800'
                                                                                        }`}>
                                                                                        {question.difficultyLevel}
                                                                                    </span>
                                                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                                                                                        {question.marks} mark{question.marks > 1 ? 's' : ''}
                                                                                    </span>
                                                                                    {question.questionType.includes('mcq') && (
                                                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                                                                            {question.questionType === 'mcq_single'
                                                                                                ? 'Single Correct'
                                                                                                : 'Multiple Correct'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Show correct answers for MCQs */}
                                                                        {(question.questionType === 'mcq_single' || question.questionType === 'mcq_multiple') && (
                                                                            <div className="ml-9 mt-2">
                                                                                <p className="text-sm text-gray-600 mb-1">
                                                                                    <strong>Correct Answer{question.questionType === 'mcq_multiple' ? 's' : ''}:</strong>{' '}
                                                                                    {question.questionType === 'mcq_single'
                                                                                        ? question.correctAnswer
                                                                                        : question.correctOptions?.join(', ')
                                                                                    }
                                                                                </p>
                                                                                {question.explanation && (
                                                                                    <p className="text-sm text-gray-600">
                                                                                        <strong>Explanation:</strong> {question.explanation}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Show reference answer for text/coding questions */}
                                                                        {(question.questionType === 'text' || question.questionType === 'coding') && (
                                                                            <div className="ml-9 mt-2">
                                                                                <p className="text-sm text-gray-600">
                                                                                    <strong>Reference Answer:</strong>{' '}
                                                                                    {question.correctAnswer.length > 100
                                                                                        ? `${question.correctAnswer.substring(0, 100)}...`
                                                                                        : question.correctAnswer
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }).filter(Boolean) // Remove null entries for empty categories
                                    })()}
                                </div>

                                {/* Difficulty Summary */}
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 mb-6">
                                    <h4 className="font-bold text-gray-900 mb-4">Difficulty Distribution</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['easy', 'medium', 'hard'].map(level => {
                                            const levelQuestions = questions.filter(q => q.difficultyLevel === level);
                                            const levelMarks = levelQuestions.reduce((sum, q) => sum + parseInt(q.marks), 0);
                                            const percentage = totalMarks > 0 ? Math.round((levelMarks / totalMarks) * 100) : 0;

                                            const levelColors = {
                                                easy: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
                                                medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
                                                hard: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
                                            };

                                            const colors = levelColors[level];

                                            return (
                                                <div key={level} className={`border-2 ${colors.border} ${colors.bg} rounded-lg p-4 text-center`}>
                                                    <div className="text-2xl font-bold mb-1 capitalize">{level}</div>
                                                    <div className={`text-lg font-semibold ${colors.text} mb-1`}>
                                                        {levelQuestions.length} question{levelQuestions.length !== 1 ? 's' : ''}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {levelMarks} marks ({percentage}%)
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setActiveStep(2)}
                                        className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-all duration-200"
                                    >
                                        Back to Questions
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Creating Test...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Create Test
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}


const QuestionCard = ({
    question,
    index,
    globalIndex,
    onUpdate,
    onRemove,
    onUpdateOption,
    onAddOption,
    onRemoveOption
}) => {
    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            {/* Question Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">
                        {globalIndex + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {question.questionType === 'mcq_single' ? 'Single Choice' :
                            question.questionType === 'mcq_multiple' ? 'Multiple Choice' :
                                question.questionType === 'text' ? 'Text Answer' : 'Coding'} Question
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    {/* Marks Input */}
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                        <Hash className="w-4 h-4 text-gray-600" />
                        <input
                            type="number"
                            value={question.marks}
                            onChange={(e) => onUpdate(globalIndex, 'marks', e.target.value)}
                            min="1"
                            className="w-16 bg-transparent border-none focus:ring-0 text-gray-900 font-semibold"
                        />
                        <span className="text-gray-600 font-semibold">marks</span>
                    </div>

                    {/* Remove Question Button */}
                    <button
                        type="button"
                        onClick={() => onRemove(globalIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Rest of the question form fields */}
            <div className="space-y-6">
                {/* Question Text */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Question Text *
                    </label>
                    <textarea
                        value={question.questionText}
                        onChange={(e) => onUpdate(globalIndex, 'questionText', e.target.value)}
                        placeholder="Enter your question here..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    />
                </div>

                {/* MCQ Options */}
                {(question.questionType === 'mcq_single' || question.questionType === 'mcq_multiple') && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Options *
                        </label>
                        <div className="space-y-3">
                            {Object.entries(question.options).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-semibold text-gray-700 flex-shrink-0">
                                        {key}
                                    </div>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => onUpdateOption(globalIndex, key, e.target.value)}
                                        placeholder={`Option ${key}`}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {Object.keys(question.options).length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveOption(globalIndex, key)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Add Option Button */}
                            {Object.keys(question.options).length < 6 && (
                                <button
                                    type="button"
                                    onClick={() => onAddOption(globalIndex)}
                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mt-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Option
                                </button>
                            )}
                        </div>

                        {/* Correct Answer Selection */}
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {question.questionType === 'mcq_single' ? 'Correct Answer *' : 'Correct Answers *'}
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {Object.keys(question.options).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            if (question.questionType === 'mcq_single') {
                                                onUpdate(globalIndex, 'correctAnswer', key);
                                            } else {
                                                const currentAnswers = question.correctOptions || [];
                                                const newAnswers = currentAnswers.includes(key)
                                                    ? currentAnswers.filter(k => k !== key)
                                                    : [...currentAnswers, key];
                                                onUpdate(globalIndex, 'correctOptions', newAnswers);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all duration-200 ${(question.questionType === 'mcq_single' && question.correctAnswer === key) ||
                                            (question.questionType === 'mcq_multiple' && question.correctOptions?.includes(key))
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Text Answer Reference */}
                {(question.questionType === 'text' || question.questionType === 'coding') && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reference Answer *
                        </label>
                        <textarea
                            value={question.correctAnswer}
                            onChange={(e) => onUpdate(globalIndex, 'correctAnswer', e.target.value)}
                            placeholder={
                                question.questionType === 'text'
                                    ? "Enter the expected answer for AI evaluation..."
                                    : "Enter the expected code solution or output..."
                            }
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        />
                    </div>
                )}

                {/* Explanation */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Explanation (Optional)
                    </label>
                    <textarea
                        value={question.explanation}
                        onChange={(e) => onUpdate(globalIndex, 'explanation', e.target.value)}
                        placeholder="Provide explanation for the correct answer..."
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    />
                </div>

                {/* Difficulty Level */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Difficulty Level
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {['easy', 'medium', 'hard'].map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => onUpdate(globalIndex, 'difficultyLevel', level)}
                                className={`px-4 py-2 rounded-lg border-2 font-semibold capitalize ${question.difficultyLevel === level
                                    ? level === 'easy' ? 'border-green-500 bg-green-50 text-green-700'
                                        : level === 'medium' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                            : 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};