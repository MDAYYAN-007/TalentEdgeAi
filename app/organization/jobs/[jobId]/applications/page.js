'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import {
    ArrowLeft, Search, Calendar, MapPin,
    Building, User, Star, Eye, Filter,
    X, ChevronDown, Users, Briefcase,
    Loader2
} from 'lucide-react';
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

    // Filter States
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

    useEffect(() => {
        const fetchUserAndCheckAuth = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    setUser(null);
                    return;
                }

                setUser(currentUser);

                // Check if user is authorized to view applications
                if (!['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    toast.error('You are not authorized to view applications. Redirecting...');
                    setTimeout(() => router.push('/dashboard'), 3000);
                    return;
                }

            } catch (error) {
                console.error('Error getting current user:', error);
                // User is not authenticated - we'll handle this in the UI
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndCheckAuth();
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
                console.log('Fetched applications:', appsResult.applications);
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

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-700">Loading your applications...</p>
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
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                    <div className="max-w-md w-full">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                            <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                        Authentication Required
                                    </h1>
                                    <p className="text-slate-600">
                                        You need to be signed in to create tests.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => router.push('/signin')}
                                        className="cursor-pointer w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => router.push('/')}
                                        className="cursor-pointer w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
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
                {/* Header - Matching Previous Style */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/organization/jobs"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Jobs
                            </Link>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                        <Building className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        {job.department || 'Job Applications'}
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {job.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="text-sm font-medium">{job.job_type} • {job.work_mode}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-medium">{job.experience_level} Level</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 shadow-sm">
                                    <Users className="w-4 h-4" />
                                    <span className="font-semibold text-sm">{applications.length} Applications</span>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                                    <Eye className="w-4 h-4" />
                                    <span className="font-semibold text-sm">{filteredApplications.length} Showing</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredApplications.map((application) => (
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
                                                        <div className="flex items-center justify-center">
                                                            <Link
                                                                href={`/organization/applications/${application.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View */}
                                <div className="lg:hidden space-y-4 p-4 max-w-[400px]:p-2">
                                    {filteredApplications.map((application) => (
                                        <div key={application.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-gray-900 truncate">{application.applicant_name}</h3>
                                                            {application.resume_score >= 80 && (
                                                                <Star className="w-4 h-4 text-amber-500 fill-current flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 truncate">{application.applicant_email}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)} capitalize flex-shrink-0 ml-2`}>
                                                    {application.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{formatDate(application.applied_at)}</span>
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

                                            {/* Phone number if available */}
                                            {application.applicant_phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span className="truncate">{application.applicant_phone}</span>
                                                </div>
                                            )}

                                            {/* Action */}
                                            <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                                                <Link
                                                    href={`/organization/applications/${application.id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium w-full justify-center"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
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