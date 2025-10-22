'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import { useRouter } from 'next/navigation';
import { Briefcase, ArrowLeft, ChevronDown, MapPin, DollarSign, User, Loader2, ChevronRight, Filter, Building2, Calendar, ArrowUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { getJobs } from '@/actions/organization/getJobs';

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sorting and filtering states
    const [sortBy, setSortBy] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const isManager = user && ['OrgAdmin', 'SeniorHR', 'HR'].includes(user.role);

    useEffect(() => {
        const fetchJobsData = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    // User is not authenticated - we'll handle this in the UI
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                if (!currentUser.orgId) {
                    setError("Access Denied: You must belong to an organization to view internal jobs.");
                    setUser(currentUser);
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);

                // Check if user is authorized to view jobs
                if (!['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    setError("You are not authorized to view organization jobs.");
                    setIsLoading(false);
                    return;
                }

                // Prepare auth data for server action
                const authData = {
                    orgId: currentUser.orgId,
                    userId: currentUser.id,
                    userRole: currentUser.role
                };

                // Use the server action instead of API route
                const result = await getJobs(authData);

                if (result.success && result.jobs) {
                    const sortedJobs = result.jobs.sort((a, b) => {
                        const dateA = new Date(a.created_at || a.posted_date || a.updated_at);
                        const dateB = new Date(b.created_at || b.posted_date || b.updated_at);
                        return dateB - dateA;
                    });
                    setJobs(sortedJobs);
                    setFilteredJobs(sortedJobs);
                } else {
                    setError(result.message || "Failed to fetch job listings.");
                }
            } catch (err) {
                console.error("Error loading jobs:", err);
                setError("An error occurred while fetching data. Check server logs.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobsData();
    }, []);

    useEffect(() => {
        let result = [...jobs];

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(job => job.status === statusFilter);
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.posted_date || a.updated_at);
                    const dateB = new Date(b.created_at || b.posted_date || b.updated_at);
                    return dateB - dateA;
                });
                break;
            case 'oldest':
                result.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.posted_date || a.updated_at);
                    const dateB = new Date(b.created_at || b.posted_date || b.updated_at);
                    return dateA - dateB;
                });
                break;
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'department':
                result.sort((a, b) => (a.department || '').localeCompare(b.department || ''));
                break;
        }

        setFilteredJobs(result);
    }, [jobs, sortBy, statusFilter]);

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isOutsideSort = !event.target.closest('.sort-dropdown');
            const isOutsideFilter = !event.target.closest('.filter-dropdown');

            if (isOutsideSort && isOutsideFilter) {
                setShowSortDropdown(false);
                setShowFilterDropdown(false);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [router]);

    useEffect(() => {
        // Scroll to top immediately
        window.scrollTo(0, 0);

        // Additional scroll when loading finishes
        if (!isLoading) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    }, [isLoading]);

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'title', label: 'Title (A-Z)' },
        { value: 'department', label: 'Department' },
    ];

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'Active', label: 'Active' },
        { value: 'Draft', label: 'Draft' },
        { value: 'Closed', label: 'Closed' },
    ];

    const handleSortClick = (e) => {
        e.stopPropagation();
        setShowSortDropdown(!showSortDropdown);
        setShowFilterDropdown(false);
    };

    const handleFilterClick = (e) => {
        e.stopPropagation();
        setShowFilterDropdown(!showFilterDropdown);
        setShowSortDropdown(false);
    };

    const handleSortOptionClick = (value) => {
        setSortBy(value);
        setShowSortDropdown(false);
    };

    const handleFilterOptionClick = (value) => {
        setStatusFilter(value);
        setShowFilterDropdown(false);
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
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Authentication Required
                                </h1>
                                <p className="text-slate-600">
                                    You need to be signed in to view job listings.
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
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Access Denied
                                </h1>
                                <p className="text-slate-600">
                                    Only <strong>HR</strong>, <strong>SeniorHR</strong>, and <strong>OrgAdmin</strong> can view organization jobs.
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
                            <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Loading Job Listings
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Fetching your organization's posted jobs...
                        </p>
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
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
    if (user && !isManager) {
        return <UnauthorizedComponent />;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
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
                                        <Building2 className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        Job Listings
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {user?.orgName || 'Company'} Open Positions
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="text-sm font-medium">{jobs.length} Total Jobs</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Multiple Locations</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <User className="w-4 h-4" />
                                        <span className="text-sm font-medium">Role: {user?.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 shadow-sm">
                                    <Check className="w-4 h-4" />
                                    <span className="font-semibold capitalize text-sm">{filteredJobs.length} Active Listings</span>
                                </div>
                                {isManager && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="font-semibold text-sm">Manager Access</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                            {isManager && (
                                <Link
                                    href="/organization/create-job"
                                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                >
                                    <Briefcase className="w-4 h-4" />
                                    Post New Job
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filter and Role Information */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-white/70 rounded-xl shadow-md border border-slate-200">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            <p className="text-sm font-medium text-slate-700">
                                Your Role: <span className="font-bold text-indigo-700">{user?.role}</span>
                            </p>
                        </div>

                        {/* Sorting and Filtering Controls */}
                        <div className="flex flex-wrap gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative sort-dropdown">
                                <button
                                    onClick={handleSortClick}
                                    className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <ArrowUpDown className="w-4 h-4" />
                                    Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
                                    <ChevronRight className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-90' : ''}`} />
                                </button>

                                {showSortDropdown && (
                                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleSortOptionClick(option.value)}
                                                className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${sortBy === option.value ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'
                                                    }`}
                                            >
                                                {option.label}
                                                {sortBy === option.value && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filter Dropdown */}
                            <div className="relative filter-dropdown">
                                <button
                                    onClick={handleFilterClick}
                                    className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <Filter className="w-4 h-4" />
                                    Filter: {statusOptions.find(opt => opt.value === statusFilter)?.label}
                                    <ChevronRight className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-90' : ''}`} />
                                </button>

                                {showFilterDropdown && (
                                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFilterOptionClick(option.value)}
                                                className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${statusFilter === option.value ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'
                                                    }`}
                                            >
                                                {option.label}
                                                {statusFilter === option.value && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Jobs Count */}
                    <div className="mb-4">
                        <p className="text-sm text-slate-600">
                            Showing {filteredJobs.length} of {jobs.length} jobs
                            {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
                        </p>
                    </div>

                    {/* Jobs List */}
                    <div className="space-y-4">
                        {filteredJobs.length === 0 ? (
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-12 text-center">
                                <p className="text-xl font-semibold text-slate-900 mb-2">
                                    {jobs.length === 0 ? 'No jobs found' : 'No jobs match your filters'}
                                </p>
                                <p className="text-slate-600 mb-4">
                                    {jobs.length === 0
                                        ? 'The hiring pipeline may currently be quiet.'
                                        : 'Try adjusting your filters to see more results.'
                                    }
                                </p>
                                {isManager && jobs.length === 0 && (
                                    <Link
                                        href="/organization/create-job"
                                        className="mt-6 cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                                    >
                                        Post Your First Job
                                    </Link>
                                )}
                                {jobs.length > 0 && (
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredJobs.map((job) => (
                                <div key={job.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all flex justify-between items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold text-slate-900 truncate">
                                            {job.title}
                                            {job.department && <span className='text-base font-normal text-slate-600 ml-2'>({job.department})</span>}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-xs font-medium">{job.job_type} ({job.work_mode})</span>
                                            {job.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                                    {job.location}
                                                </span>
                                            )}
                                            {(job.min_salary || job.max_salary) && (
                                                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                    <DollarSign className="w-4 h-4" />
                                                    {job.currency} {Number(job.min_salary).toLocaleString()}
                                                    {job.max_salary && job.min_salary && ' - '}
                                                    {job.max_salary && Number(job.max_salary).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                                            <span className={`px-3 py-1 rounded-lg font-medium ${job.status === 'Active' ? 'bg-green-100 text-green-700' : job.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {job.status}
                                            </span>
                                            <span className="italic">Posted by: {job.posted_by_name || 'Admin'}</span>
                                            {(job.created_at || job.posted_date) && (
                                                <span className="flex items-center gap-1 text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(job.created_at || job.posted_date)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/organization/jobs/${job.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-4 py-2 cursor-pointer bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                                    >
                                        View Details
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}