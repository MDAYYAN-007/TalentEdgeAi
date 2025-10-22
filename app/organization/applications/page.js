'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import {
    Search, Calendar, MapPin,
    Building, User, Star, Eye,
    X, Loader2,
    ArrowLeft
} from 'lucide-react';
import { getRecruiterApplications } from '@/actions/applications/getRecruiterApplications';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RecruiterApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        jobId: 'all',
        search: '',
        sortBy: 'applied_at',
        sortOrder: 'desc'
    });

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
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);

                if (currentUser.role && !['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    switch (currentUser.role) {
                        case 'User':
                            router.push('/jobs');
                            return;
                        case 'Employee':
                            // router.push('/employee/dashboard');
                            return;
                        default:
                            router.push('/dashboard');
                            return;
                    }
                }

            } catch (error) {
                console.error('Error getting current user:', error);
                setIsLoading(false);
            }
        };

        fetchUserAndCheckAuth();
    }, [router]);

    const fetchApplications = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await getRecruiterApplications(authData);

            if (result.success) {
                setApplications(result.applications || []);
            } else {
                console.error('Failed to fetch applications:', result.message);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchApplications();
        }
    }, [user, fetchApplications]);

    const getUniqueJobs = () => {
        const jobMap = new Map();

        applications.forEach(app => {
            if (!jobMap.has(app.job_id)) {
                jobMap.set(app.job_id, {
                    value: app.job_id,
                    label: app.job_title
                });
            }
        });

        return [
            { value: 'all', label: 'All Jobs' },
            ...Array.from(jobMap.values())
        ];
    };

    const uniqueJobs = getUniqueJobs();

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

        // Apply job filter
        if (filters.jobId !== 'all') {
            filtered = filtered.filter(app => app.job_id === parseInt(filters.jobId));
        }

        // Apply search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(app =>
                app.applicant_name?.toLowerCase().includes(searchTerm) ||
                app.job_title?.toLowerCase().includes(searchTerm) ||
                app.department?.toLowerCase().includes(searchTerm) ||
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
            jobId: 'all',
            search: '',
            sortBy: 'applied_at',
            sortOrder: 'desc'
        });
    };

    const hasActiveFilters = filters.status !== 'all' || filters.jobId !== 'all' || filters.search;

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">Loading your applications...</p>
                </div>
            </div>
        );
    }

    // Add this check for unauthenticated users
    if (!user) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
                        <p className="text-gray-600 mb-6">You need to be signed in to view applications.</p>
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

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-gray-200 shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Dashboard
                            </Link>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-4xl font-extrabold text-gray-900">Application Tracker 🚀</h1>
                                <p className="text-gray-500 mt-1">
                                    Manage and review job applications assigned to your team
                                </p>
                            </div>
                            {/* The stats block is kept clean */}
                            <div className="mt-4 sm:mt-0 flex items-center gap-4">
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
                    {/* Filters Section - Modern Dropdown UI (Responsive) */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Search Bar: W-full on all mobile/tablet sizes */}
                            <div className="flex-1 w-full lg:max-w-lg">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search applicants, jobs, departments..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Dropdown Controls: REVISED for Mobile - uses flex and flex-1 for better horizontal wrapping */}
                            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">

                                {/* Status Filter */}
                                <div className="relative group flex-1 min-w-[130px] sm:flex-none sm:w-44"> {/* 👈 NEW MOBILE LAYOUT: flex-1 ensures it takes half the width */}
                                    <button
                                        className="px-4 py-3 w-full border border-gray-300 rounded-lg flex justify-between items-center text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {statusOptions.find((s) => s.value === filters.status)?.label || 'All Status'}
                                        <span className="ml-2 text-gray-400 group-hover:text-indigo-500">
                                            ▼
                                        </span>
                                    </button>
                                    {/* Dropdown Menu: Uses fixed width on large screen, takes full width on small screens relative to its new parent size */}
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

                                {/* Job Filter */}
                                <div className="relative group flex-1 min-w-[130px] sm:flex-none sm:w-44"> {/* 👈 NEW MOBILE LAYOUT: flex-1 ensures it takes half the width */}
                                    <button
                                        className="px-4 py-3 w-full border border-gray-300 rounded-lg flex justify-between items-center text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {uniqueJobs.find((j) => j.value.toString() === filters.jobId.toString())?.label || 'All Jobs'}
                                        <span className="ml-2 text-gray-400 group-hover:text-indigo-500">
                                            ▼
                                        </span>
                                    </button>
                                    {/* Dropdown Menu: Uses fixed width on large screen, takes full width on small screens relative to its new parent size */}
                                    <div className="absolute hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-lg w-full sm:w-44 z-10 max-h-56 overflow-y-auto">
                                        {uniqueJobs.map((job) => (
                                            <button
                                                key={job.value}
                                                onClick={() => handleFilterChange('jobId', job.value)}
                                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${filters.jobId === job.value ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
                                                    }`}
                                            >
                                                {job.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort Filter */}
                                <div className="relative group flex-1 min-w-[130px] sm:flex-none sm:w-44"> {/* 👈 NEW MOBILE LAYOUT: flex-1 ensures it takes half the width */}
                                    <button
                                        className="px-4 py-3 w-full border border-gray-300 rounded-lg flex justify-between items-center text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {sortOptions.find((s) => s.value === `${filters.sortBy}-${filters.sortOrder}`)?.label || 'Sort By'}
                                        <span className="ml-2 text-gray-400 group-hover:text-indigo-500">
                                            ▼
                                        </span>
                                    </button>
                                    {/* Dropdown Menu: Used w-48 previously, now w-full sm:w-48 */}
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
                                        // W-full on mobile, auto on sm and up
                                        className="px-4 py-3 w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors font-medium"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Filters Display (No changes needed) */}
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
                                {filters.jobId !== 'all' && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        Job: {uniqueJobs.find((j) => j.value.toString() === filters.jobId.toString())?.label}
                                        <button onClick={() => handleFilterChange('jobId', 'all')}>
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
                                        : 'No applications have been assigned to you yet.'
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
                                {/* Desktop Table View (Enhanced UI/UX) */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Applicant & Position
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Department
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
                                            {filteredApplications.map((application) => (
                                                <tr key={`app-${application.id}`} className="hover:bg-indigo-50/50 transition duration-150 ease-in-out">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                                    <User className="w-5 h-5 text-indigo-600" />
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-base font-semibold text-gray-900 truncate">
                                                                        {application.applicant_name}
                                                                    </p>
                                                                    {application.resume_score >= 80 && (
                                                                        <Star className="w-4 h-4 text-amber-500 fill-current" title="Top Candidate" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-indigo-600 font-medium">
                                                                    {application.job_title}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                                    <span>{application.location}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{application.department}</div>
                                                        <div className="text-xs text-gray-500">{application.experience_level}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 font-medium">
                                                            {formatDate(application.applied_at)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Updated: {formatDate(application.updated_at)}
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <Link
                                                            href={`/organization/applications/${application.id}`}
                                                            className="inline-flex items-center gap-1 px-3 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-indigo-200"
                                                            title="View Application Details"
                                                        >
                                                            View <Eye className="w-4 h-4" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View (Enhanced UI/UX) */}
                                <div className="lg:hidden space-y-5 p-4 sm:p-6">
                                    {filteredApplications.map((application) => (
                                        <div key={`app-mobile-${application.id}`} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">

                                            {/* Top Row: Applicant Name & Status */}
                                            <div className="flex sm:items-center sm:justify-between flex-col gap-2 sm:flex-row border-b pb-3 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900 text-base">{application.applicant_name}</p>
                                                            {application.resume_score >= 80 && (
                                                                <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">{application.applicant_email}</p>
                                                    </div>
                                                </div>
                                                {/* In both desktop and mobile views, this line handles status display: */}
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)} capitalize`}>
                                                    {application.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Middle Section: Job Details & Score */}
                                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Eye className="w-4 h-4 text-indigo-500" />
                                                    <span className="font-medium text-indigo-700">{application.job_title}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span>{application.department}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span>{application.location}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    {application.resume_score > 0 ? (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getScoreColor(application.resume_score)}`}>
                                                            Score: {application.resume_score}%
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                            No Score
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Row: Dates and Action */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Applied: {formatDate(application.applied_at)}</span>
                                                </div>
                                                <Link
                                                    href={`/organization/applications/${application.id}`}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-semibold p-1 transition-colors"
                                                >
                                                    View Details <Eye className="w-4 h-4" />
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