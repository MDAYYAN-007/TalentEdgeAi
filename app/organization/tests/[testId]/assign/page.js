'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import {
    ArrowLeft, Users, Search, Filter, X, Calendar,
    Eye, CheckCircle, Clock, FileText, Star,
    Download, Send, UserCheck, Building, Briefcase,
    AlertCircle, CheckSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getApplicantsForTestAssignment } from '@/actions/tests/getApplicantsForTestAssignment';
import { assignTestToApplicants } from '@/actions/tests/assignTestToApplicants';
import { getTestDetails } from '@/actions/tests/getTestDeatils';

export default function AssignTestPage() {
    const router = useRouter();
    const params = useParams();
    const testId = params.testId;

    const [user, setUser] = useState(null);
    const [test, setTest] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [filteredApplicants, setFilteredApplicants] = useState([]);
    const [selectedApplicants, setSelectedApplicants] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [assignLoading, setAssignLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        jobTitles: [],
        departments: [],
        minScore: 0,
        maxScore: 100,
        experienceLevels: [],
        applicationStatus: 'all',
        alreadyAssigned: 'all'
    });

    const [testStartDate, setTestStartDate] = useState('');
    const [testEndDate, setTestEndDate] = useState('');
    const [proctoringSettings, setProctoringSettings] = useState({
        isProctored: false,
        proctoringSettings: {
            fullscreen_required: true,
            tab_switching_detection: true,
            copy_paste_prevention: true
        }
    });
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    useEffect(() => {
        const fetchUserAndData = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);

                // Check authorization - ONLY HR, SeniorHR, OrgAdmin can access
                if (!['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    setIsLoading(false);
                    return;
                }

                // If authorized, fetch the data
                if (currentUser.orgId && testId) {
                    await fetchTestAndApplicants(currentUser);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setUser(null);
                setIsLoading(false);
            }
        };

        fetchUserAndData();
    }, [testId]);

    const fetchTestAndApplicants = async (currentUser = user) => {
        setIsLoading(true);
        try {
            const userToUse = currentUser || user;
            if (!userToUse?.orgId) {
                throw new Error('User organization not found');
            }

            const testResult = await getTestDetails(testId, {
                orgId: userToUse.orgId,
                userId: userToUse.id
            });
            if (!testResult.success) {
                throw new Error(testResult.message);
            }
            setTest(testResult.test);

            const applicantsResult = await getApplicantsForTestAssignment(
                userToUse.orgId,
                testId,
                userToUse.id
            );
            if (!applicantsResult.success) {
                throw new Error(applicantsResult.message);
            }
            setApplicants(applicantsResult.applicants);
            setFilteredApplicants(applicantsResult.applicants);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let filtered = applicants;

        if (searchTerm) {
            filtered = filtered.filter(applicant =>
                applicant.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                applicant.applicant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                applicant.job_title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.jobTitles.length > 0) {
            filtered = filtered.filter(applicant =>
                filters.jobTitles.includes(applicant.job_title)
            );
        }

        if (filters.departments.length > 0) {
            filtered = filtered.filter(applicant =>
                filters.departments.includes(applicant.department)
            );
        }

        filtered = filtered.filter(applicant =>
            applicant.resume_score >= filters.minScore &&
            applicant.resume_score <= filters.maxScore
        );

        if (filters.experienceLevels.length > 0) {
            filtered = filtered.filter(applicant =>
                filters.experienceLevels.includes(applicant.experience_level)
            );
        }

        if (filters.applicationStatus !== 'all') {
            filtered = filtered.filter(applicant =>
                applicant.status === filters.applicationStatus
            );
        }

        if (filters.alreadyAssigned !== 'all') {
            if (filters.alreadyAssigned === 'assigned') {
                filtered = filtered.filter(applicant => applicant.already_assigned_to_this_test);
            } else {
                filtered = filtered.filter(applicant => !applicant.already_assigned_to_this_test);
            }
        }

        setFilteredApplicants(filtered);
    }, [applicants, searchTerm, filters]);

    const parseSkills = (skills) => {
        if (!skills) return [];
        try {
            const parsed = typeof skills === 'string' ? JSON.parse(skills) : skills;
            return Array.isArray(parsed) ? parsed : [skills];
        } catch (error) {
            return [skills];
        }
    };

    // Get unique values for filters
    const uniqueJobTitles = [...new Set(applicants.map(app => app.job_title))];
    const uniqueDepartments = [...new Set(applicants.map(app => app.department).filter(Boolean))];
    const uniqueExperienceLevels = [...new Set(applicants.map(app => app.experience_level).filter(Boolean))];

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => {
            if (Array.isArray(prev[filterType])) {
                return {
                    ...prev,
                    [filterType]: prev[filterType].includes(value)
                        ? prev[filterType].filter(item => item !== value)
                        : [...prev[filterType], value]
                };
            }
            return { ...prev, [filterType]: value };
        });
    };

    // Clear all filters
    const clearAllFilters = () => {
        setFilters({
            jobTitles: [],
            departments: [],
            minScore: 0,
            maxScore: 100,
            experienceLevels: [],
            applicationStatus: 'all',
            alreadyAssigned: 'all'
        });
        setSearchTerm('');
    };

    // Select/Deselect all
    const toggleSelectAll = () => {
        if (selectedApplicants.size === filteredApplicants.length) {
            setSelectedApplicants(new Set());
        } else {
            setSelectedApplicants(new Set(filteredApplicants.map(app => app.application_id)));
        }
    };

    const handleAssignTest = async () => {
        if (selectedApplicants.size === 0 || !testStartDate || !testEndDate) {
            toast.error('Please select applicants and set both start and end dates');
            return;
        }

        setAssignLoading(true);
        try {
            const result = await assignTestToApplicants(
                testId,
                Array.from(selectedApplicants),
                testStartDate,
                testEndDate,
                user.id,
                user.orgId,
                proctoringSettings
            );

            if (result.success) {
                toast.success(result.message);
                router.push(`/organization/tests/${testId}`);
            } else {
                toast.error(result.message || 'Failed to assign test');
            }
        } catch (error) {
            console.error('Error assigning test:', error);
            toast.error('Error assigning test');
        } finally {
            setAssignLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    // Get status color and label
    const getStatusInfo = (status, alreadyAssigned, otherTestsCount) => {
        if (alreadyAssigned) {
            return {
                color: 'text-blue-600 bg-blue-50 border-blue-200',
                label: `Already assigned to this test${otherTestsCount > 0 ? ` (+${otherTestsCount} other tests)` : ''}`
            };
        }

        switch (status) {
            case 'shortlisted':
                return { color: 'text-green-600 bg-green-50 border-green-200', label: 'Shortlisted' };
            case 'test_scheduled':
                return { color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Test Scheduled' };
            default:
                return { color: 'text-gray-600 bg-gray-50 border-gray-200', label: status };
        }
    };

    // Unauthenticated Component
    const UnauthenticatedComponent = () => (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="max-w-md w-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Authentication Required
                                </h1>
                                <p className="text-slate-600">
                                    You need to be signed in to assign tests.
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

    // Unauthorized Component
    const UnauthorizedComponent = () => (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="max-w-md w-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                                <AlertCircle className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Access Denied
                                </h1>
                                <p className="text-slate-600">
                                    Only <strong>HR</strong>, <strong>SeniorHR</strong>, and <strong>OrgAdmin</strong> can assign tests.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="cursor-pointer w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                                >
                                    Go to Dashboard
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
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Loading Test Assignment
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Preparing test assignment interface...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Show unauthenticated component if no user
    if (!user && !isLoading) {
        return <UnauthenticatedComponent />;
    }

    // Check if user is unauthorized - FIXED THIS LOGIC
    if (user && !['HR', 'SeniorHR', 'OrgAdmin'].includes(user.role)) {
        return <UnauthorizedComponent />;
    }

    // If user is authorized but no test data loaded
    if (!test && user && ['HR', 'SeniorHR', 'OrgAdmin'].includes(user.role)) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Not Found</h2>
                        <p className="text-gray-600 mb-6">The test you're looking for doesn't exist or you don't have access to it.</p>
                        <button
                            onClick={() => router.push('/organization/tests')}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Back to Tests
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Toaster position="top-right" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-4 sm:pb-8">
                {/* Header - Consistent with Other Pages */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.push(`/organization/tests/${testId}`)}
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group cursor-pointer"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Test Details
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        Assign Test
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    Assign: {test.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-medium">{test.question_count} Questions</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">{test.duration_minutes} Minutes</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Star className="w-4 h-4" />
                                        <span className="text-sm font-medium">{test.passing_marks}% Passing</span>
                                    </div>
                                    <div className={`flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm ${test.is_active ? 'border-green-200' : 'border-gray-200'}`}>
                                        <div className={`w-2 h-2 rounded-full ${test.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm font-medium">{test.is_active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                                    <UserCheck className="w-5 h-5" />
                                    <span className="font-semibold text-lg">
                                        {selectedApplicants.size} Selected
                                    </span>
                                </div>
                                {test.is_active ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="font-semibold text-sm">Test is Active</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-700">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span className="font-semibold text-sm">Test is Inactive</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

                    {/* Assignment Settings - Always Visible */}
                    {applicants.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                Assignment Settings
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-4">
                                    {/* Test Start Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                            Test Start Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={testStartDate}
                                            onChange={(e) => {
                                                setTestStartDate(e.target.value);
                                                if (e.target.value && test) {
                                                    const start = new Date(e.target.value);
                                                    const end = new Date(start.getTime() + (test.duration_minutes + 5) * 60 * 1000);
                                                    setTestEndDate(end.toISOString().slice(0, 16));
                                                }
                                            }}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="w-full px-3 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            When applicants can start taking the test
                                        </p>
                                    </div>

                                    {/* Test End Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                            Test End Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={testEndDate}
                                            onChange={(e) => setTestEndDate(e.target.value)}
                                            min={testStartDate ? new Date(new Date(testStartDate).getTime() + (test.duration_minutes + 5) * 60 * 1000).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                                            className="w-full px-3 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Last date/time to complete the test
                                        </p>

                                        {testStartDate && testEndDate && test && (
                                            <div className="mt-2">
                                                {(() => {
                                                    const start = new Date(testStartDate);
                                                    const end = new Date(testEndDate);
                                                    const diffMinutes = Math.round((end - start) / (60 * 1000));
                                                    const requiredMinutes = test.duration_minutes + 5;

                                                    if (diffMinutes < requiredMinutes) {
                                                        return (
                                                            <p className="text-red-600 text-xs">
                                                                ⚠️ Test window too short. Need at least {requiredMinutes} minutes for a {test.duration_minutes}-minute test.
                                                            </p>
                                                        );
                                                    } else {
                                                        return (
                                                            <p className="text-green-600 text-xs">
                                                                ✅ Test window: {diffMinutes} minutes (requires {requiredMinutes} minutes)
                                                            </p>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Proctoring Settings */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-purple-600" />
                                            Enable Proctoring
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setProctoringSettings(prev => ({
                                                ...prev,
                                                isProctored: !prev.isProctored
                                            }))}
                                            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${proctoringSettings.isProctored ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proctoringSettings.isProctored ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {proctoringSettings.isProctored && (
                                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Proctoring Settings</h4>
                                            {[
                                                { key: 'fullscreen_required', label: 'Fullscreen Required' },
                                                { key: 'tab_switching_detection', label: 'Tab Switching Detection' },
                                                { key: 'copy_paste_prevention', label: 'Copy/Paste Prevention' }
                                            ].map((setting) => (
                                                <div key={setting.key} className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-700">{setting.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProctoringSettings(prev => ({
                                                            ...prev,
                                                            proctoringSettings: {
                                                                ...prev.proctoringSettings,
                                                                [setting.key]: !prev.proctoringSettings[setting.key]
                                                            }
                                                        }))}
                                                        className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${proctoringSettings.proctoringSettings[setting.key] ? 'bg-green-500' : 'bg-gray-300'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proctoringSettings.proctoringSettings[setting.key] ? 'translate-x-4' : 'translate-x-0'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {/* Mobile Filters Toggle */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className="cursor-pointer w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-200"
                            >
                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    Applicant Filters ({filteredApplicants.length} results)
                                </span>
                                {isFiltersOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Left Sidebar - Filters */}
                        <div className={`lg:col-span-1 space-y-4 sm:space-y-6 ${isFiltersOpen ? 'block' : 'hidden lg:block'}`}>
                            {/* Filters Panel */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                        Filters
                                    </h3>
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Clear All
                                    </button>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    {/* Search */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                            Search
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search applicants..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Application Status */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                            Application Status
                                        </label>
                                        <select
                                            value={filters.applicationStatus}
                                            onChange={(e) => handleFilterChange('applicationStatus', e.target.value)}
                                            className="w-full cursor-pointer px-3 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="shortlisted">Shortlisted</option>
                                            <option value="test_scheduled">Test Scheduled</option>
                                        </select>
                                    </div>

                                    {/* Already Assigned Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                            Assignment Status
                                        </label>
                                        <select
                                            value={filters.alreadyAssigned}
                                            onChange={(e) => handleFilterChange('alreadyAssigned', e.target.value)}
                                            className="w-full cursor-pointer px-3 py-2 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                        >
                                            <option value="all">All Applicants</option>
                                            <option value="not_assigned">Not Assigned to This Test</option>
                                            <option value="assigned">Already Assigned to This Test</option>
                                        </select>
                                    </div>

                                    {/* Job Titles */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                            Job Titles
                                        </label>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {uniqueJobTitles.map((title) => (
                                                <label key={title} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.jobTitles.includes(title)}
                                                        onChange={() => handleFilterChange('jobTitles', title)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                    />
                                                    <span className="text-gray-700 truncate">{title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Departments */}
                                    {uniqueDepartments.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                                Departments
                                            </label>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {uniqueDepartments.map((dept) => (
                                                    <label key={dept} className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.departments.includes(dept)}
                                                            onChange={() => handleFilterChange('departments', dept)}
                                                            className="w-4 h-4 text-blue-600 cursor-pointer rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-gray-700">{dept}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Score Range */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                            Resume Score: {filters.minScore}% - {filters.maxScore}%
                                        </label>
                                        <div className="space-y-2 px-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={filters.minScore}
                                                onChange={(e) => handleFilterChange('minScore', parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={filters.maxScore}
                                                onChange={(e) => handleFilterChange('maxScore', parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Experience Levels */}
                                    {uniqueExperienceLevels.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                                                Experience Level
                                            </label>
                                            <div className="space-y-1">
                                                {uniqueExperienceLevels.map((level) => (
                                                    <label key={level} className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.experienceLevels.includes(level)}
                                                            onChange={() => handleFilterChange('experienceLevels', level)}
                                                            className="w-4 h-4 cursor-pointer text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-gray-700">{level}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content - Applicants List */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                {/* Applicants Header */}
                                <div className="p-4 sm:p-6 border-b border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                                Applicants ({filteredApplicants.length})
                                            </h2>
                                            <p className="text-gray-600 text-sm sm:text-base mt-1">
                                                Select applicants to assign the test
                                            </p>
                                        </div>
                                        {applicants.length > 0 && (
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="flex items-center cursor-pointer gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    {selectedApplicants.size === filteredApplicants.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {/* Applicants List */}
                                <div className="max-h-[50vh] sm:max-h-[500px] overflow-y-auto">
                                    {filteredApplicants.length === 0 ? (
                                        <div className="text-center py-8 sm:py-12">
                                            <UserCheck className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Applicants Found</h3>
                                            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-sm mx-auto px-4">
                                                {applicants.length === 0
                                                    ? 'No applicants available for assignment.'
                                                    : 'No applicants match your current filters.'
                                                }
                                            </p>
                                            {applicants.length === 0 ? (
                                                <button
                                                    onClick={() => router.push('/organization/jobs')}
                                                    className="px-4 py-2 cursor-pointer bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
                                                >
                                                    View Jobs
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={clearAllFilters}
                                                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {filteredApplicants.map((applicant) => {
                                                const statusInfo = getStatusInfo(
                                                    applicant.status,
                                                    applicant.already_assigned_to_this_test,
                                                    applicant.other_test_assignments_count
                                                );

                                                return (
                                                    <div
                                                        key={applicant.application_id}
                                                        className={`p-4 sm:p-6 transition-all duration-200 ${selectedApplicants.has(applicant.application_id)
                                                            ? 'bg-blue-50 border-l-4 border-blue-500'
                                                            : 'hover:bg-gray-50'
                                                            } ${applicant.already_assigned_to_this_test ? 'opacity-75' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-3 sm:gap-4">
                                                            <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 mt-0.5 sm:mt-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedApplicants.has(applicant.application_id)}
                                                                    onChange={() => {
                                                                        setSelectedApplicants(prev => {
                                                                            const newSet = new Set(prev);
                                                                            if (newSet.has(applicant.application_id)) {
                                                                                newSet.delete(applicant.application_id);
                                                                            } else {
                                                                                newSet.add(applicant.application_id);
                                                                            }
                                                                            return newSet;
                                                                        });
                                                                    }}
                                                                    className="w-4 h-4 cursor-pointer text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2 sm:gap-0">
                                                                    <div className="min-w-0">
                                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                                                            <span className="truncate">{applicant.applicant_name}</span>
                                                                            {applicant.already_assigned_to_this_test && (
                                                                                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                            )}
                                                                        </h3>
                                                                        <p className="text-gray-600 text-sm truncate">{applicant.applicant_email}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(applicant.resume_score)}`}>
                                                                            Score: {applicant.resume_score || 0}%
                                                                        </span>
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                                                            {statusInfo.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                                        <span className="font-medium text-xs sm:text-sm">Job:</span>
                                                                        <span className="truncate text-xs sm:text-sm">{applicant.job_title}</span>
                                                                    </div>
                                                                    {applicant.department && (
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <Building className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                                            <span className="font-medium text-xs sm:text-sm">Department:</span>
                                                                            <span className="text-xs sm:text-sm">{applicant.department}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                                        <span className="font-medium text-xs sm:text-sm">Applied:</span>
                                                                        <span className="text-xs sm:text-sm">{formatDate(applicant.applied_at)}</span>
                                                                    </div>
                                                                </div>
                                                                {applicant.skills && (
                                                                    <div className="mt-2 sm:mt-3">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {parseSkills(applicant.skills).slice(0, 5).map((skill, index) => (
                                                                                <span
                                                                                    key={index}
                                                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                                                >
                                                                                    {skill}
                                                                                </span>
                                                                            ))}
                                                                            {parseSkills(applicant.skills).length > 5 && (
                                                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                                                    +{parseSkills(applicant.skills).length - 5} more
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {applicant.already_assigned_to_this_test && (
                                                                    <div className="mt-2 flex items-center gap-1 text-blue-600 text-xs">
                                                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                                        <span>Reassigning will update due date and proctoring settings</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                {filteredApplicants.length > 0 && (
                                    <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                            <div className="text-sm text-gray-600">
                                                <span>{selectedApplicants.size} of {filteredApplicants.length} applicants selected</span>
                                                {selectedApplicants.size > 0 && (
                                                    <div className="text-blue-600 mt-1 text-xs sm:text-sm">
                                                        {Array.from(selectedApplicants).filter(id =>
                                                            applicants.find(app => app.application_id === id)?.already_assigned_to_this_test
                                                        ).length > 0 && (
                                                                <span>Includes reassignments</span>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <button
                                                    onClick={() => router.push(`/organization/tests/${testId}`)}
                                                    className="cursor-pointer px-4 sm:px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm sm:text-base"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleAssignTest}
                                                    disabled={assignLoading || selectedApplicants.size === 0 || !testStartDate || !testEndDate}
                                                    className="cursor-pointer flex items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                                >
                                                    {assignLoading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                                                            Assigning...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            Assign to {selectedApplicants.size} Applicant(s)
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}