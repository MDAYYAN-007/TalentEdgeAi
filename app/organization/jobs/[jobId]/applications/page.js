'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
    Search, Calendar, MapPin,
    Building, User, Star, Eye,
    X, Loader2, ArrowLeft, FileText,
    CheckCircle, XCircle, Clock, Video, Zap
} from 'lucide-react';
import { getJobApplications } from '@/actions/applications/getJobApplications';
import { updateApplicationStatus } from '@/actions/applications/updateApplicationStatus';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast, { Toaster } from 'react-hot-toast';

export default function JobApplicationsPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.jobId;

    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [job, setJob] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        sortBy: 'applied_at',
        sortOrder: 'desc'
    });

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

    // JWT decoding and authentication
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

    // Fetch applications for this job
    const fetchJobApplications = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await getJobApplications(jobId, authData);

            if (result.success) {
                setApplications(result.applications || []);
                setJob(result.job || null);
            } else {
                console.error('Failed to fetch applications:', result.message);
                toast.error('Failed to load applications');
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Error loading applications');
        } finally {
            setIsLoading(false);
        }
    }, [user, jobId]);

    useEffect(() => {
        if (user) {
            fetchJobApplications();
        }
    }, [user, fetchJobApplications]);

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
                app.applicant_email?.toLowerCase().includes(searchTerm)
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

    // Status update function
    const handleStatusUpdate = async (applicationId, newStatus) => {
        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateApplicationStatus(authData, applicationId, newStatus);

            if (result.success) {
                // Update local state
                setApplications(prev => prev.map(app =>
                    app.id === applicationId ? { ...app, status: newStatus } : app
                ));
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
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

    // Handler functions
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

    // Get available status actions for an application
    const getAvailableStatusActions = (currentStatus) => {
        const baseActions = [
            { value: 'shortlisted', label: 'Shortlist', icon: Star, color: 'text-indigo-600 hover:bg-indigo-50' },
            { value: 'test_scheduled', label: 'Test', icon: Zap, color: 'text-blue-600 hover:bg-blue-50' },
            { value: 'interview_scheduled', label: 'Interview', icon: Video, color: 'text-purple-600 hover:bg-purple-50' },
            { value: 'waiting_for_result', label: 'Waiting', icon: Clock, color: 'text-orange-600 hover:bg-orange-50' },
            { value: 'hired', label: 'Hire', icon: CheckCircle, color: 'text-green-600 hover:bg-green-50' },
            { value: 'rejected', label: 'Reject', icon: XCircle, color: 'text-red-600 hover:bg-red-50' }
        ];

        // Filter out current status
        return baseActions.filter(action => action.value !== currentStatus);
    };

    // Loading state
    if (!user || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">Loading applications...</p>
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
                <header className="bg-white border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                <Link
                                    href={`/organization/jobs/${jobId}`}
                                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Job
                                </Link>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        {job?.title || 'Job'} Applications
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        Manage applications for this position
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 rounded-lg border border-indigo-200 px-4 py-2">
                                    <span className="text-sm text-indigo-500">Total:</span>
                                    <span className="ml-2 text-xl font-bold text-indigo-700">
                                        {applications.length}
                                    </span>
                                </div>
                                <div className="bg-green-50 rounded-lg border border-green-200 px-4 py-2">
                                    <span className="text-sm text-green-500">Showing:</span>
                                    <span className="ml-2 text-xl font-bold text-green-700">
                                        {filteredApplications.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filters Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Search Bar */}
                            <div className="flex-1 w-full lg:max-w-md">
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
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                {/* Status Filter */}
                                <div className="relative group flex-1 min-w-[150px] lg:flex-none">
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                        ▼
                                    </div>
                                </div>

                                {/* Sort Filter */}
                                <div className="relative group flex-1 min-w-[150px] lg:flex-none">
                                    <select
                                        value={`${filters.sortBy}-${filters.sortOrder}`}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                                    >
                                        {sortOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                        ▼
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-3 w-full lg:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors font-medium"
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
                                                    Applied
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Score
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Quick Actions
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    View
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredApplications.map((application) => {
                                                const availableActions = getAvailableStatusActions(application.status);
                                                return (
                                                    <tr key={application.id} className="hover:bg-gray-50 transition duration-150">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                                        <User className="w-5 h-5 text-indigo-600" />
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-base font-semibold text-gray-900">
                                                                            {application.applicant_name}
                                                                        </p>
                                                                        {application.resume_score >= 80 && (
                                                                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 truncate">
                                                                        {application.applicant_email}
                                                                    </p>
                                                                </div>
                                                            </div>
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
                                                            <div className="flex flex-wrap gap-1">
                                                                {availableActions.slice(0, 3).map((action) => {
                                                                    const IconComponent = action.icon;
                                                                    return (
                                                                        <button
                                                                            key={action.value}
                                                                            onClick={() => handleStatusUpdate(application.id, action.value)}
                                                                            disabled={isUpdating}
                                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                            title={action.label}
                                                                        >
                                                                            <IconComponent className="w-3 h-3" />
                                                                        </button>
                                                                    );
                                                                })}
                                                                {availableActions.length > 3 && (
                                                                    <div className="relative group">
                                                                        <button className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
                                                                            +{availableActions.length - 3}
                                                                        </button>
                                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-1 min-w-[120px]">
                                                                            {availableActions.slice(3).map((action) => {
                                                                                const IconComponent = action.icon;
                                                                                return (
                                                                                    <button
                                                                                        key={action.value}
                                                                                        onClick={() => handleStatusUpdate(application.id, action.value)}
                                                                                        disabled={isUpdating}
                                                                                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                                    >
                                                                                        <IconComponent className="w-3 h-3" />
                                                                                        {action.label}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <Link
                                                                href={`/organization/applications/${application.id}`}
                                                                className="inline-flex items-center gap-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-indigo-200"
                                                            >
                                                                View <Eye className="w-4 h-4" />
                                                            </Link>
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
                                        const availableActions = getAvailableStatusActions(application.status);
                                        return (
                                            <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                                {/* Top Section */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-gray-900">{application.applicant_name}</p>
                                                                {application.resume_score >= 80 && (
                                                                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600">{application.applicant_email}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)} capitalize`}>
                                                        {application.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {/* Middle Section */}
                                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>{formatDate(application.applied_at)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2">
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

                                                {/* Actions Section */}
                                                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                                    <div className="flex gap-1">
                                                        {availableActions.slice(0, 2).map((action) => {
                                                            const IconComponent = action.icon;
                                                            return (
                                                                <button
                                                                    key={action.value}
                                                                    onClick={() => handleStatusUpdate(application.id, action.value)}
                                                                    disabled={isUpdating}
                                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    title={action.label}
                                                                >
                                                                    <IconComponent className="w-3 h-3" />
                                                                </button>
                                                            );
                                                        })}
                                                        {availableActions.length > 2 && (
                                                            <div className="relative group">
                                                                <button className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
                                                                    +{availableActions.length - 2}
                                                                </button>
                                                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-1 min-w-[120px]">
                                                                    {availableActions.slice(2).map((action) => {
                                                                        const IconComponent = action.icon;
                                                                        return (
                                                                            <button
                                                                                key={action.value}
                                                                                onClick={() => handleStatusUpdate(application.id, action.value)}
                                                                                disabled={isUpdating}
                                                                                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                            >
                                                                                <IconComponent className="w-3 h-3" />
                                                                                {action.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Link
                                                        href={`/organization/applications/${application.id}`}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                    >
                                                        View <Eye className="w-4 h-4" />
                                                    </Link>
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
            <Footer />
        </>
    );
}