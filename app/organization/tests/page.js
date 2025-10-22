'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import {
    Plus, Search, Filter, Calendar, Users, FileText,
    Zap, Clock, Star, ArrowLeft, Edit, Trash2,
    Eye, Copy, Play, AlertTriangle, CheckCircle, UserCheck, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrganizationTests } from '@/actions/tests/getOrganizationTests';
import { setTestInactive } from '@/actions/tests/setTestInactive';
import { reactivateTest } from '@/actions/tests/setTestActive';

export default function TestsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [accessFilter, setAccessFilter] = useState(false);
    const [deactivateLoading, setDeactivateLoading] = useState(null);
    const [reactivateLoading, setReactivateLoading] = useState(null);
    const [expandedTest, setExpandedTest] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        type: '',
        testId: null,
        testTitle: '',
        action: null
    });

    useEffect(() => {
        const fetchUserAndData = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // Check authorization
                if (!['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    setUser(currentUser);
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);
                await fetchTests(currentUser);
            } catch (error) {
                console.error('Error fetching user:', error);
                setUser(null);
                setIsLoading(false);
            }
        };

        fetchUserAndData();
    }, []);

    const fetchTests = async (currentUser = user) => {
        const userToUse = currentUser || user;
        if (!userToUse?.orgId || !userToUse?.id) return;

        setIsLoading(true);
        try {
            const result = await getOrganizationTests(userToUse.orgId, userToUse.id);
            if (result.success) {
                console.log('Result tests: ', result.tests)
                setTests(result.tests);
                const activeTests = result.tests.filter(test => test.is_active);
                setStatusFilter('active');
                setFilteredTests(activeTests);
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

    const hasEditAccess = (test) => {
        if (!user) return false;
        if (test.created_by === user.id) return true;
        if (user.role === 'OrgAdmin') return true;
        if (test.allowed_users && Array.isArray(test.allowed_users)) {
            return test.allowed_users.includes(user.id);
        }
        return false;
    };

    useEffect(() => {
        let filtered = tests;

        if (searchTerm) {
            filtered = filtered.filter(test =>
                test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                test.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(test => test.is_active === (statusFilter === 'active'));
        }

        if (accessFilter) {
            filtered = filtered.filter(test => hasEditAccess(test));
        }

        setFilteredTests(filtered);
    }, [searchTerm, statusFilter, accessFilter, tests, user]);

    const openConfirmationModal = (type, testId, testTitle, action) => {
        setModalData({
            type,
            testId,
            testTitle,
            action
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalData({
            type: '',
            testId: null,
            testTitle: '',
            action: null
        });
    };

    const handleModalConfirm = async () => {
        if (!modalData.action) return;

        if (modalData.type === 'deactivate') {
            setDeactivateLoading(modalData.testId);
        } else {
            setReactivateLoading(modalData.testId);
        }

        try {
            await modalData.action();
            toast.success(
                modalData.type === 'deactivate'
                    ? 'Test deactivated successfully'
                    : 'Test reactivated successfully'
            );
            fetchTests();
        } catch (error) {
            console.error(`Error ${modalData.type}ing test:`, error);
            toast.error(`Error ${modalData.type}ing test`);
        } finally {
            if (modalData.type === 'deactivate') {
                setDeactivateLoading(null);
            } else {
                setReactivateLoading(null);
            }
            closeModal();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getProctoringColor = (isProctored) => {
        return isProctored
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getAccessInfo = (test) => {
        const hasAccess = hasEditAccess(test);
        return {
            color: hasAccess ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-gray-100 text-gray-800 border-gray-200',
            text: hasAccess ? 'Can Edit' : 'View Only',
            isCreator: test.created_by === user?.id
        };
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
                                    You need to be signed in to view tests.
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

    const UnauthorizedComponent = () => (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="max-w-md w-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                                <AlertTriangle className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Access Denied
                                </h1>
                                <p className="text-slate-600">
                                    Only <strong>HR</strong>, <strong>SeniorHR</strong>, and <strong>OrgAdmin</strong> can view tests.
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
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Loading Tests
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Fetching your organization's tests...
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

    // Check if user is unauthorized
    if (user && !['HR', 'SeniorHR', 'OrgAdmin'].includes(user.role)) {
        return <UnauthorizedComponent />;
    }

    return (
        <>
            <Navbar />
            <Toaster />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-4">

                {/* Header - Consistent with Other Pages */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Dashboard
                            </Link>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                        <FileText className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        Test Library
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    Assessment Tests
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-medium">{tests.length} Total Tests</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Play className="w-4 h-4" />
                                        <span className="text-sm font-medium">{tests.filter(t => t.is_active).length} Active</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <UserCheck className="w-4 h-4" />
                                        <span className="text-sm font-medium">{tests.filter(t => hasEditAccess(t)).length} Can Edit</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/organization/create-test')}
                                    className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create New Test
                                </button>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 shadow-sm">
                                    <Users className="w-4 h-4" />
                                    <span className="font-semibold text-sm">
                                        {tests.reduce((sum, test) => sum + (test.assignment_count || 0), 0)} Assignments
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-white rounded-2xl p-3 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="p-2 md:p-3 bg-blue-100 rounded-xl flex-shrink-0">
                                    <FileText className="w-4 md:w-6 h-4 md:h-6 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg md:text-2xl font-bold text-gray-900">{tests.length}</div>
                                    <div className="text-xs md:text-sm text-gray-600 truncate">Total Tests</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-3 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="p-2 md:p-3 bg-green-100 rounded-xl flex-shrink-0">
                                    <Play className="w-4 md:w-6 h-4 md:h-6 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg md:text-2xl font-bold text-gray-900">
                                        {tests.filter(t => t.is_active).length}
                                    </div>
                                    <div className="text-xs md:text-sm text-gray-600 truncate">Active Tests</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-3 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="p-2 md:p-3 bg-purple-100 rounded-xl flex-shrink-0">
                                    <UserCheck className="w-4 md:w-6 h-4 md:h-6 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg md:text-2xl font-bold text-gray-900">
                                        {tests.filter(t => hasEditAccess(t)).length}
                                    </div>
                                    <div className="text-xs md:text-sm text-gray-600 truncate">Can Edit</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-3 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="p-2 md:p-3 bg-orange-100 rounded-xl flex-shrink-0">
                                    <Users className="w-4 md:w-6 h-4 md:h-6 text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg md:text-2xl font-bold text-gray-900">
                                        {tests.reduce((sum, test) => sum + (test.assignment_count || 0), 0)}
                                    </div>
                                    <div className="text-xs md:text-sm text-gray-600 truncate">Assignments</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 mb-6 md:mb-8">
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="w-full">
                                <div className="relative">
                                    <Search className="w-4 md:w-5 h-4 md:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search tests..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base transition-all"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base transition-all hover:border-gray-400"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                {/* Access Filter Checkbox */}
                                <label className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer transition-all active:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={accessFilter}
                                        onChange={(e) => setAccessFilter(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <UserCheck className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                    <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
                                        My Access
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Tests List */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <span className="ml-3 text-sm md:text-base text-gray-600">Loading tests...</span>
                            </div>
                        ) : filteredTests.length === 0 ? (
                            <div className="text-center py-8 md:py-12 px-4">
                                <FileText className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                                    {tests.length === 0 ? 'No Tests Created' : 'No Tests Found'}
                                </h3>
                                <p className="text-sm md:text-base text-gray-600 mb-6">
                                    {tests.length === 0
                                        ? 'Get started by creating your first assessment test.'
                                        : accessFilter
                                            ? 'No tests found that you have edit access to.'
                                            : 'Try adjusting your search or filter criteria.'
                                    }
                                </p>
                                {tests.length === 0 && (
                                    <button
                                        onClick={() => router.push('/organization/create-test')}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all text-sm md:text-base"
                                    >
                                        Create Your First Test
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredTests.map((test) => {
                                    const accessInfo = getAccessInfo(test);
                                    const userHasEditAccess = hasEditAccess(test);
                                    const isExpanded = expandedTest === test.id;

                                    return (
                                        <div key={test.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                                            {/* Desktop Layout */}
                                            <div className="hidden md:flex md:items-start md:justify-between md:gap-4">
                                                {/* Test Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-3 md:gap-4 mb-3">
                                                        <div className="p-2 md:p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                                                            <FileText className="w-5 md:w-6 h-5 md:h-6 text-indigo-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                                                                    {test.title}
                                                                </h3>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(test.is_active)}`}>
                                                                        {test.is_active ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                    {test.is_proctored && (
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getProctoringColor(test.is_proctored)}`}>
                                                                            Proctored
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${accessInfo.color}`}>
                                                                        {accessInfo.isCreator ? 'Owner' : accessInfo.text}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {test.description && (
                                                                <p className="text-gray-600 mb-3 text-sm line-clamp-2">
                                                                    {test.description}
                                                                </p>
                                                            )}

                                                            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-600">
                                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                                                    <span>{test.question_count || 0} Q</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                                    <span>{test.duration_minutes}m</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                                    <Star className="w-4 h-4 flex-shrink-0" />
                                                                    <span>{test.passing_marks}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                                    <Users className="w-4 h-4 flex-shrink-0" />
                                                                    <span>{test.assignment_count || 0}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                                    <span>{formatDate(test.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions - Desktop */}
                                                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => router.push(`/organization/tests/${test.id}`)}
                                                        className="cursor-pointer flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all text-xs md:text-sm font-medium group"
                                                        title="View Test Details"
                                                    >
                                                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        <span className="hidden md:inline">View</span>
                                                    </button>

                                                    {userHasEditAccess && (
                                                        <>


                                                            {test.is_active ? (
                                                                <button
                                                                    onClick={() => openConfirmationModal(
                                                                        'deactivate',
                                                                        test.id,
                                                                        test.title,
                                                                        () => setTestInactive(test.id, { orgId: user.orgId, userId: user.id })
                                                                    )}
                                                                    disabled={deactivateLoading === test.id}
                                                                    className="cursor-pointer flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                    title="Deactivate Test"
                                                                >
                                                                    {deactivateLoading === test.id ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                                    ) : (
                                                                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                                    )}
                                                                    <span className="hidden md:inline">Deactivate</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => openConfirmationModal(
                                                                        'reactivate',
                                                                        test.id,
                                                                        test.title,
                                                                        () => reactivateTest(test.id, { orgId: user.orgId, userId: user.id })
                                                                    )}
                                                                    disabled={reactivateLoading === test.id}
                                                                    className="cursor-pointer flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 rounded-lg transition-all text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                    title="Reactivate Test"
                                                                >
                                                                    {reactivateLoading === test.id ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                                    ) : (
                                                                        <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                                    )}
                                                                    <span className="hidden md:inline">Reactivate</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mobile Layout */}
                                            <div className="md:hidden">
                                                {/* Header with expand button */}
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <div className="p-2 bg-indigo-100 rounded-xl flex-shrink-0">
                                                            <FileText className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                                                                {test.title}
                                                            </h3>
                                                            <div className="flex items-center gap-1 flex-wrap mt-1">
                                                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(test.is_active)}`}>
                                                                    {test.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                                {test.is_proctored && (
                                                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold border ${getProctoringColor(test.is_proctored)}`}>
                                                                        Proctored
                                                                    </span>
                                                                )}
                                                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold border ${accessInfo.color}`}>
                                                                    {accessInfo.isCreator ? 'Owner' : accessInfo.text}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                                                        className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all flex-shrink-0"
                                                    >
                                                        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Expandable Details */}
                                                {isExpanded && (
                                                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                                                        {test.description && (
                                                            <p className="text-sm text-gray-600">
                                                                {test.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-col min-[450px]:grid min-[450px]:grid-cols-2 gap-2 text-xs text-gray-600">
                                                            <div className="flex items-center gap-1.5">
                                                                <FileText className="w-4 h-4 flex-shrink-0" />
                                                                <span>{test.question_count || 0} Questions</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4 flex-shrink-0" />
                                                                <span>{test.duration_minutes}m</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Star className="w-4 h-4 flex-shrink-0" />
                                                                <span>{test.passing_marks}% Pass</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="w-4 h-4 flex-shrink-0" />
                                                                <span>{test.assignment_count || 0} Assign</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 sm:col-span-2">
                                                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                                                <span>Created {formatDate(test.created_at)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Mobile Actions */}
                                                        <div className="flex flex-wrap gap-2 pt-3">
                                                            <button
                                                                onClick={() => router.push(`/organization/tests/${test.id}`)}
                                                                className="cursor-pointer flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all text-xs font-medium group"
                                                                title="View Test Details"
                                                            >
                                                                <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                                <span>View</span>
                                                            </button>

                                                            {userHasEditAccess && (
                                                                <>
                                                                    {test.is_active ? (
                                                                        <button
                                                                            onClick={() => openConfirmationModal(
                                                                                'deactivate',
                                                                                test.id,
                                                                                test.title,
                                                                                () => setTestInactive(test.id, { orgId: user.orgId, userId: user.id })
                                                                            )}
                                                                            disabled={deactivateLoading === test.id}
                                                                            className="cursor-pointer flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                            title="Deactivate Test"
                                                                        >
                                                                            {deactivateLoading === test.id ? (
                                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                                            ) : (
                                                                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                                            )}
                                                                            <span>Deactivate</span>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => openConfirmationModal(
                                                                                'reactivate',
                                                                                test.id,
                                                                                test.title,
                                                                                () => reactivateTest(test.id, { orgId: user.orgId, userId: user.id })
                                                                            )}
                                                                            disabled={reactivateLoading === test.id}
                                                                            className="cursor-pointer flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 rounded-lg transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                            title="Reactivate Test"
                                                                        >
                                                                            {reactivateLoading === test.id ? (
                                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                                            ) : (
                                                                                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                                            )}
                                                                            <span>Reactivate</span>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Results Count */}
                    {!isLoading && filteredTests.length > 0 && (
                        <div className="mt-4 text-xs md:text-sm text-gray-600">
                            Showing {filteredTests.length} of {tests.length} tests
                            {accessFilter && ` (only tests you can edit)`}
                        </div>
                    )}
                </div>
            </div>
            <Footer />

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-4 md:p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${modalData.type === 'deactivate'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                                }`}>
                                {modalData.type === 'deactivate' ? (
                                    <AlertTriangle className="w-5 md:w-6 h-5 md:h-6" />
                                ) : (
                                    <CheckCircle className="w-5 md:w-6 h-5 md:h-6" />
                                )}
                            </div>
                            <h3 className="text-base md:text-xl font-bold text-gray-900">
                                {modalData.type === 'deactivate' ? 'Deactivate Test' : 'Reactivate Test'}
                            </h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm md:text-base text-gray-600 mb-4">
                                {modalData.type === 'deactivate'
                                    ? `Are you sure you want to deactivate "${modalData.testTitle}"?`
                                    : `Are you sure you want to reactivate "${modalData.testTitle}"?`
                                }
                            </p>
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                                <p className="text-xs md:text-sm text-gray-600">
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
                                disabled={deactivateLoading === modalData.testId || reactivateLoading === modalData.testId}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200 font-medium rounded-lg transition-all disabled:opacity-50 text-sm md:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalConfirm}
                                disabled={deactivateLoading === modalData.testId || reactivateLoading === modalData.testId}
                                className={`px-6 py-2 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base ${modalData.type === 'deactivate'
                                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                                    }`}
                            >
                                {(deactivateLoading === modalData.testId || reactivateLoading === modalData.testId) ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>{modalData.type === 'deactivate' ? 'Deactivating...' : 'Reactivating...'}</span>
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