'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, DollarSign, User, Loader2, ChevronRight, Filter, Building2, Calendar, ArrowUpDown, Check } from 'lucide-react';
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

    // Roles authorized to manage jobs
    const isManager = user && ['OrgAdmin', 'Senior Manager', 'HR Recruiter'].includes(user.role);

    useEffect(() => {
        const fetchJobsData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push('/signin');
                return;
            }

            try {
                const decoded = jwtDecode(token);
                if (!decoded.orgId) {
                    setError("Access Denied: You must belong to an organization to view internal jobs.");
                    setIsLoading(false);
                    return;
                }

                setUser(decoded);

                // Prepare auth data for server action
                const authData = {
                    orgId: decoded.orgId,
                    userId: decoded.id,
                    userRole: decoded.role
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

    // Close dropdowns when clicking outside - FIXED VERSION
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside both dropdown containers
            const isOutsideSort = !event.target.closest('.sort-dropdown');
            const isOutsideFilter = !event.target.closest('.filter-dropdown');

            if (isOutsideSort && isOutsideFilter) {
                setShowSortDropdown(false);
                setShowFilterDropdown(false);
            }
        };

        // Use setTimeout to ensure this runs after the click event
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

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

    if (error) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center p-8">
                    <div className="text-center bg-red-50 border border-red-200 p-8 rounded-xl shadow-lg">
                        <h1 className="text-2xl font-bold text-red-700 mb-4">Error Accessing Jobs</h1>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-3xl shadow-xl border border-indigo-300/20 p-6 sm:p-8 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-2">
                                    <Building2 className='w-7 h-7' />
                                    {user?.orgName || 'Company'} Open Jobs
                                </h1>
                                <p className="text-indigo-100 mt-1">
                                    View available positions across the organization.
                                </p>
                            </div>

                            {/* Create Job Button (Visible only to authorized roles) */}
                            {isManager && (
                                <Link
                                    href="/create-job"
                                    className="flex items-center cursor-pointer gap-2 bg-white hover:bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all border border-white/20"
                                >
                                    <Briefcase className="w-5 h-5" />
                                    Post New Job
                                </Link>
                            )}
                        </div>
                    </div>

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
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
                                        href="/create-job"
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
                                        href={`/organization/job/${job.id}`}
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