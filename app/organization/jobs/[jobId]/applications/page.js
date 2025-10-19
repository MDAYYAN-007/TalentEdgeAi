// app/organization/jobs/[jobId]/applications/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
    ArrowLeft, Search, Calendar, MapPin,
    Building, User, Star, Eye, Filter,
    X, Send, CheckCircle, XCircle, Clock,
    Video, Zap, Mail, Phone, Download,
    ChevronDown, MoreVertical
} from 'lucide-react';
import { updateApplicationStatus } from '@/actions/applications/updateApplicationStatus';
import { getJobDetails } from '@/actions/jobs/getJobDetails';
import { getJobApplications } from '@/actions/applications/getJobAplications';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function JobApplicationsPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.jobId;

    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Filter States
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        sortBy: 'applied_at',
        sortOrder: 'desc'
    });

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [notes, setNotes] = useState('');

    // Status options
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'shortlisted', label: 'Shortlisted' },
        { value: 'test_scheduled', label: 'Test Scheduled' },
        { value: 'interview_scheduled', label: 'Interview Scheduled' },
        { value: 'waiting_for_result', label: 'Waiting for Result' },
        { value: 'hired', label: 'Hired' },
        { value: 'rejected', label: 'Rejected' }
    ];

    // Sort options
    const sortOptions = [
        { value: 'applied_at-desc', label: 'Newest First' },
        { value: 'applied_at-asc', label: 'Oldest First' },
        { value: 'resume_score-desc', label: 'Highest Score' },
        { value: 'resume_score-asc', label: 'Lowest Score' },
        { value: 'updated_at-desc', label: 'Recently Updated' },
    ];

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

    // Fetch job details and applications
    const fetchData = useCallback(async () => {
        if (!user?.orgId || !jobId) return;

        setIsLoading(true);
        try {
            // Fetch job details
            const jobResult = await getJobDetails(jobId);
            if (jobResult.success) {
                setJob(jobResult.job);
            } else {
                toast.error(jobResult.message || 'Failed to load job details');
                router.push('/organization/jobs');
                return;
            }

            // Fetch applications
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const appsResult = await getJobApplications(jobId, authData);
            if (appsResult.success) {
                setApplications(appsResult.applications || []);
            } else {
                toast.error(appsResult.message || 'Failed to load applications');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [user, jobId, router]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    // Apply filters and sorting
    useEffect(() => {
        if (applications.length === 0) {
            setFilteredApplications([]);
            return;
        }

        let filtered = [...applications];

        // Apply status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(app => app.status === filters.status);
        }

        // Apply search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(app =>
                app.applicant_name?.toLowerCase().includes(searchTerm) ||
                app.applicant_email?.toLowerCase().includes(searchTerm) ||
                app.department?.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (filters.sortBy) {
                case 'resume_score':
                    aValue = a.resume_score || 0;
                    bValue = b.resume_score || 0;
                    break;
                case 'updated_at':
                    aValue = new Date(a.updated_at).getTime();
                    bValue = new Date(b.updated_at).getTime();
                    break;
                default: // applied_at
                    aValue = new Date(a.applied_at).getTime();
                    bValue = new Date(b.applied_at).getTime();
            }

            if (filters.sortOrder === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        setFilteredApplications(filtered);
    }, [applications, filters]);

    // Status update handlers
    const openConfirmationModal = (application, action) => {
        setPendingAction({ application, ...action });

        // Set default notes based on action
        const defaultNotes = {
            shortlisted: `Candidate ${application.applicant_name} has been shortlisted for ${application.job_title} position. Strong match based on skills and experience.`,
            test_scheduled: `Technical assessment test assigned to ${application.applicant_name} for ${application.job_title} position.`,
            interview_scheduled: `Interview scheduled with ${application.applicant_name} for ${application.job_title} position.`,
            waiting_for_result: `Interview completed with ${application.applicant_name}. Waiting for final decision.`,
            hired: `Congratulations! ${application.applicant_name} has been hired for ${application.job_title} position.`,
            rejected: `Application from ${application.applicant_name} has been rejected for ${application.job_title} position.`
        };

        setNotes(defaultNotes[action.newStatus] || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPendingAction(null);
        setNotes('');
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateApplicationStatus(
                authData,
                pendingAction.application.id,
                pendingAction.newStatus,
                notes
            );

            if (result.success) {
                // Update local state
                setApplications(prev => prev.map(app =>
                    app.id === pendingAction.application.id
                        ? { ...app, status: pendingAction.newStatus }
                        : app
                ));

                toast.success(`Application ${pendingAction.newStatus.replace('_', ' ')}`);
                closeModal();
            } else {
                toast.error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error updating application status');
        } finally {
            setIsUpdating(false);
        }
    };

    // Get available actions for an application
    const getAvailableActions = (application) => {
        const currentStatus = application.status;

        switch (currentStatus) {
            case 'submitted':
                return [
                    {
                        id: 'shortlist',
                        label: 'Shortlist',
                        description: 'Move to shortlisted pool',
                        icon: Star,
                        color: 'text-indigo-600 hover:bg-indigo-50',
                        newStatus: 'shortlisted'
                    },
                    {
                        id: 'assign_test',
                        label: 'Assign Test',
                        description: 'Send assessment test',
                        icon: Zap,
                        color: 'text-blue-600 hover:bg-blue-50',
                        newStatus: 'test_scheduled'
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview',
                        icon: Video,
                        color: 'text-purple-600 hover:bg-purple-50',
                        newStatus: 'interview_scheduled'
                    },
                    {
                        id: 'reject',
                        label: 'Reject',
                        description: 'Reject application',
                        icon: XCircle,
                        color: 'text-red-600 hover:bg-red-50',
                        newStatus: 'rejected'
                    }
                ];

            case 'shortlisted':
                return [
                    {
                        id: 'assign_test',
                        label: 'Assign Test',
                        description: 'Send assessment test',
                        icon: Zap,
                        color: 'text-blue-600 hover:bg-blue-50',
                        newStatus: 'test_scheduled'
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview',
                        icon: Video,
                        color: 'text-purple-600 hover:bg-purple-50',
                        newStatus: 'interview_scheduled'
                    },
                    {
                        id: 'reject',
                        label: 'Reject',
                        description: 'Reject application',
                        icon: XCircle,
                        color: 'text-red-600 hover:bg-red-50',
                        newStatus: 'rejected'
                    }
                ];

            case 'test_scheduled':
                return [
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview',
                        icon: Video,
                        color: 'text-purple-600 hover:bg-purple-50',
                        newStatus: 'interview_scheduled'
                    },
                    {
                        id: 'reject',
                        label: 'Reject',
                        description: 'Reject application',
                        icon: XCircle,
                        color: 'text-red-600 hover:bg-red-50',
                        newStatus: 'rejected'
                    }
                ];

            case 'interview_scheduled':
                return [
                    {
                        id: 'waiting_result',
                        label: 'Waiting Result',
                        description: 'Interview completed',
                        icon: Clock,
                        color: 'text-orange-600 hover:bg-orange-50',
                        newStatus: 'waiting_for_result'
                    },
                    {
                        id: 'reject',
                        label: 'Reject',
                        description: 'Reject after interview',
                        icon: XCircle,
                        color: 'text-red-600 hover:bg-red-50',
                        newStatus: 'rejected'
                    }
                ];

            case 'waiting_for_result':
                return [
                    {
                        id: 'hire',
                        label: 'Hire',
                        description: 'Final decision - Hire',
                        icon: CheckCircle,
                        color: 'text-green-600 hover:bg-green-50',
                        newStatus: 'hired'
                    },
                    {
                        id: 'reject',
                        label: 'Reject',
                        description: 'Final decision - Reject',
                        icon: XCircle,
                        color: 'text-red-600 hover:bg-red-50',
                        newStatus: 'rejected'
                    }
                ];

            default:
                return [];
        }
    };

    // Helper functions
    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            shortlisted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            test_scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            interview_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
            waiting_for_result: 'bg-orange-100 text-orange-800 border-orange-200',
            hired: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSortChange = (value) => {
        const [sortBy, sortOrder] = value.split('-');
        setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            search: '',
            sortBy: 'applied_at',
            sortOrder: 'desc'
        });
    };

    const hasActiveFilters = filters.status !== 'all' || filters.search;

    // Loading state
    if (!user || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading applications...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
                    <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or you don't have access to it.</p>
                    <Link
                        href="/organization/jobs"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Jobs
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <Toaster position="top-right" />
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/organization/jobs"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Jobs
                            </Link>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Building className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{job.title}</h1>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="font-medium">{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="capitalize">{job.experience_level}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(job.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-center bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-200">
                                    <div className="text-2xl font-bold text-indigo-700">{applications.length}</div>
                                    <div className="text-sm text-indigo-600">Total Applications</div>
                                </div>
                                <div className="text-center bg-green-50 rounded-xl px-4 py-3 border border-green-200">
                                    <div className="text-2xl font-bold text-green-700">{filteredApplications.length}</div>
                                    <div className="text-sm text-green-600">Showing</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filters Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Search Bar */}
                            <div className="flex-1 w-full lg:max-w-lg">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search applicants..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Dropdown Controls */}
                            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                {/* Status Filter */}
                                <div className="relative group flex-1 min-w-[150px] sm:flex-none sm:w-44">
                                    <button className="px-4 py-3 w-full border border-gray-300 rounded-lg flex justify-between items-center text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500">
                                        {statusOptions.find((s) => s.value === filters.status)?.label || 'All Status'}
                                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                                    </button>
                                    <div className="absolute hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-lg w-full sm:w-44 z-10">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFilterChange('status', option.value)}
                                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${filters.status === option.value ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort Filter */}
                                <div className="relative group flex-1 min-w-[150px] sm:flex-none sm:w-44">
                                    <button className="px-4 py-3 w-full border border-gray-300 rounded-lg flex justify-between items-center text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500">
                                        {sortOptions.find((s) => s.value === `${filters.sortBy}-${filters.sortOrder}`)?.label || 'Sort By'}
                                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                                    </button>
                                    <div className="absolute hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-lg w-full sm:w-48 z-10">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleSortChange(option.value)}
                                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${`${filters.sortBy}-${filters.sortOrder}` === option.value
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'text-gray-700'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-3 w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors font-medium"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {hasActiveFilters && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {filters.status !== 'all' && (
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(filters.status)}`}>
                                        Status: {statusOptions.find((s) => s.value === filters.status)?.label}
                                        <button onClick={() => handleFilterChange('status', 'all')}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.search && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        Search: "{filters.search}"
                                        <button onClick={() => handleFilterChange('search', '')}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Applications List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {filteredApplications.length === 0 ? (
                            <div className="text-center py-16">
                                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
                                <p className="text-gray-600 mb-6">
                                    {hasActiveFilters
                                        ? 'Try adjusting your filters to see more results.'
                                        : 'No applications have been received for this job yet.'
                                    }
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Applicant
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Applied
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Score
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredApplications.map((application) => {
                                                const availableActions = getAvailableActions(application);
                                                return (
                                                    <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                                        <User className="w-5 h-5 text-indigo-600" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-base font-semibold text-gray-900">
                                                                            {application.applicant_name}
                                                                        </p>
                                                                        {application.resume_score >= 80 && (
                                                                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-500">{application.department}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{application.applicant_email}</div>
                                                            {application.applicant_phone && (
                                                                <div className="text-sm text-gray-500">{application.applicant_phone}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 font-medium">
                                                                {formatDate(application.applied_at)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {application.resume_score > 0 ? (
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getScoreColor(application.resume_score)}`}>
                                                                    {application.resume_score}%
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                    No Score
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)} capitalize`}>
                                                                {application.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Link
                                                                    href={`/organization/applications/${application.id}`}
                                                                    className="inline-flex items-center gap-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-medium text-sm"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    View
                                                                </Link>

                                                                {availableActions.length > 0 && (
                                                                    <div className="relative group">
                                                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </button>
                                                                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                                            {availableActions.map((action) => {
                                                                                const IconComponent = action.icon;
                                                                                return (
                                                                                    <button
                                                                                        key={action.id}
                                                                                        onClick={() => openConfirmationModal(application, action)}
                                                                                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${action.color} hover:bg-opacity-10 transition-colors`}
                                                                                    >
                                                                                        <IconComponent className="w-4 h-4" />
                                                                                        <span>{action.label}</span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View */}
                                <div className="lg:hidden space-y-4 p-4">
                                    {filteredApplications.map((application) => {
                                        const availableActions = getAvailableActions(application);
                                        return (
                                            <div key={application.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-gray-900">{application.applicant_name}</h3>
                                                                {application.resume_score >= 80 && (
                                                                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500">{application.applicant_email}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)} capitalize`}>
                                                        {application.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>{formatDate(application.applied_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {application.resume_score > 0 ? (
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(application.resume_score)}`}>
                                                                Score: {application.resume_score}%
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                No Score
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                    <Link
                                                        href={`/organization/applications/${application.id}`}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </Link>

                                                    {availableActions.length > 0 && (
                                                        <div className="flex gap-2">
                                                            {availableActions.slice(0, 2).map((action) => {
                                                                const IconComponent = action.icon;
                                                                return (
                                                                    <button
                                                                        key={action.id}
                                                                        onClick={() => openConfirmationModal(application, action)}
                                                                        className={`p-2 ${action.color} rounded-lg border transition-colors`}
                                                                        title={action.description}
                                                                    >
                                                                        <IconComponent className="w-4 h-4" />
                                                                    </button>
                                                                );
                                                            })}
                                                            {availableActions.length > 2 && (
                                                                <div className="relative group">
                                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border transition-colors">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                    <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                                        {availableActions.slice(2).map((action) => {
                                                                            const IconComponent = action.icon;
                                                                            return (
                                                                                <button
                                                                                    key={action.id}
                                                                                    onClick={() => openConfirmationModal(application, action)}
                                                                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${action.color} hover:bg-opacity-10 transition-colors`}
                                                                                >
                                                                                    <IconComponent className="w-4 h-4" />
                                                                                    <span>{action.label}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Confirmation Modal */}
            {isModalOpen && pendingAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Send className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Confirm Status Change</h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600 mb-4">
                                You are about to change the status for{' '}
                                <span className="font-semibold text-gray-900">{pendingAction.application.applicant_name}</span>{' '}
                                from{' '}
                                <span className={`font-semibold ${getStatusColor(pendingAction.application.status)} px-2 py-1 rounded`}>
                                    {pendingAction.application.status.replace('_', ' ')}
                                </span>{' '}
                                to{' '}
                                <span className={`font-semibold ${getStatusColor(pendingAction.newStatus)} px-2 py-1 rounded`}>
                                    {pendingAction.newStatus.replace('_', ' ')}
                                </span>
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about this status change..."
                                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    These notes will be saved in the status history.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeModal}
                                disabled={isUpdating}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={isUpdating}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Updating...
                                    </div>
                                ) : (
                                    'Confirm Change'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}