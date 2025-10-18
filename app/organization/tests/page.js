// app/organization/tests/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
    Plus, Search, Filter, Calendar, Users, FileText,
    Zap, Clock, Star, MoreVertical, Edit, Trash2,
    Eye, Copy, Play, AlertTriangle, CheckCircle
} from 'lucide-react';
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
    const [deactivateLoading, setDeactivateLoading] = useState(null);
    const [reactivateLoading, setReactivateLoading] = useState(null);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        type: '', // 'deactivate' or 'reactivate'
        testId: null,
        testTitle: '',
        action: null
    });

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

    // Fetch tests
    const fetchTests = async () => {
        if (!user?.orgId) return;

        setIsLoading(true);
        try {
            const result = await getOrganizationTests(user.orgId);
            if (result.success) {
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

    useEffect(() => {
        if (user) {
            fetchTests();
        }
    }, [user]);

    // Filter tests based on search and status
    useEffect(() => {
        let filtered = tests;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(test =>
                test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                test.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(test => test.is_active === (statusFilter === 'active'));
        }

        setFilteredTests(filtered);
    }, [searchTerm, statusFilter, tests]);

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
            fetchTests(); // Refresh the list
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

    // Get status badge color
    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Get proctoring badge color
    const getProctoringColor = (isProctored) => {
        return isProctored
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-gray-100 text-gray-800 border-gray-200';
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                        Test Library
                                    </h1>
                                    <p className="text-gray-600 text-lg">
                                        Manage and organize your assessment tests
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/organization/create-test')}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create New Test
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{tests.length}</div>
                                    <div className="text-sm text-gray-600">Total Tests</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <Play className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {tests.filter(t => t.is_active).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Active Tests</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Zap className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {tests.filter(t => t.is_proctored).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Proctored Tests</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <Users className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {tests.reduce((sum, test) => sum + (test.assignment_count || 0), 0)}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Assignments</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search tests by title or description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tests List */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <span className="ml-3 text-gray-600">Loading tests...</span>
                            </div>
                        ) : filteredTests.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {tests.length === 0 ? 'No Tests Created' : 'No Tests Found'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {tests.length === 0
                                        ? 'Get started by creating your first assessment test.'
                                        : 'Try adjusting your search or filter criteria.'
                                    }
                                </p>
                                {tests.length === 0 && (
                                    <button
                                        onClick={() => router.push('/organization/create-test')}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                    >
                                        Create Your First Test
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredTests.map((test) => (
                                    <div key={test.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                            {/* Test Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4 mb-3">
                                                    <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                                                        <FileText className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                {test.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(test.is_active)}`}>
                                                                    {test.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                                {test.is_proctored && (
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getProctoringColor(test.is_proctored)}`}>
                                                                        Proctored
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {test.description && (
                                                            <p className="text-gray-600 mb-3">
                                                                {test.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                <span>{test.question_count || 0} questions</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{test.duration_minutes} mins</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Star className="w-4 h-4" />
                                                                <span>{test.passing_marks}% passing</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4" />
                                                                <span>{test.assignment_count || 0} assignments</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>Created {formatDate(test.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => router.push(`/organization/tests/${test.id}`)}
                                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="View Test Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>

                                                {test.is_active ? (
                                                    <>
                                                        <button
                                                            onClick={() => router.push(`/organization/create-test?edit=${test.id}`)}
                                                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Test"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => openConfirmationModal(
                                                                'deactivate',
                                                                test.id,
                                                                test.title,
                                                                () => setTestInactive(test.id, { orgId: user.orgId, userId: user.id })
                                                            )}
                                                            disabled={deactivateLoading === test.id}
                                                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Deactivate Test"
                                                        >
                                                            {deactivateLoading === test.id ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                            Deactivate
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => openConfirmationModal(
                                                            'reactivate',
                                                            test.id,
                                                            test.title,
                                                            () => reactivateTest(test.id, { orgId: user.orgId, userId: user.id })
                                                        )}
                                                        disabled={reactivateLoading === test.id}
                                                        className="flex items-center gap-2 px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Reactivate Test"
                                                    >
                                                        {reactivateLoading === test.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                        ) : (
                                                            <Play className="w-4 h-4" />
                                                        )}
                                                        Reactivate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Results Count */}
                    {!isLoading && filteredTests.length > 0 && (
                        <div className="mt-4 text-sm text-gray-600">
                            Showing {filteredTests.length} of {tests.length} tests
                        </div>
                    )}
                </div>
            </div>
            <Footer />

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${
                                modalData.type === 'deactivate' 
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
                                disabled={deactivateLoading === modalData.testId || reactivateLoading === modalData.testId}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalConfirm}
                                disabled={deactivateLoading === modalData.testId || reactivateLoading === modalData.testId}
                                className={`px-6 py-2 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    modalData.type === 'deactivate'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {(deactivateLoading === modalData.testId || reactivateLoading === modalData.testId) ? (
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