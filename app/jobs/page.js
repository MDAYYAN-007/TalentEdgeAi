'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Calendar, Building2, Search, Filter, Clock, Home, ChevronRight, X, Check, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { getPublicJobs } from '@/actions/jobs/getPublicJobs';

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [jobTypeFilter, setJobTypeFilter] = useState('');
    const [workModeFilter, setWorkModeFilter] = useState('');
    const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
    const [showWorkModeDropdown, setShowWorkModeDropdown] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const result = await getPublicJobs();

                if (result.success && result.jobs) {
                    const sortedJobs = result.jobs.sort((a, b) => {
                        const dateA = new Date(a.created_at);
                        const dateB = new Date(b.created_at);
                        return dateB - dateA;
                    });
                    setJobs(sortedJobs);
                    setFilteredJobs(sortedJobs);
                } else {
                    setError(result.message || "Failed to fetch job listings.");
                }
            } catch (err) {
                console.error("Error loading jobs:", err);
                setError("An error occurred while fetching data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, []);

    useEffect(() => {
        let result = [...jobs];

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(job =>
                job.title.toLowerCase().includes(searchLower) ||
                job.department?.toLowerCase().includes(searchLower) ||
                job.company_name?.toLowerCase().includes(searchLower) ||
                job.required_skills?.some(skill => skill.toLowerCase().includes(searchLower))
            );
        }

        if (jobTypeFilter) {
            result = result.filter(job =>
                job.job_type?.toLowerCase() === jobTypeFilter.toLowerCase()
            );
        }

        if (workModeFilter) {
            result = result.filter(job =>
                job.work_mode?.toLowerCase() === workModeFilter.toLowerCase()
            );
        }

        setFilteredJobs(result);
    }, [jobs, searchTerm, jobTypeFilter, workModeFilter]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isOutsideJobType = !event.target.closest('.filter-dropdown');

            if (isOutsideJobType) {
                setShowJobTypeDropdown(false);
                setShowWorkModeDropdown(false);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

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

    const jobTypes = [...new Set(jobs.map(job => job.job_type).filter(Boolean))].sort();
    const workModes = [...new Set(jobs.map(job => job.work_mode).filter(Boolean))].sort();

    const clearFilters = () => {
        setSearchTerm('');
        setJobTypeFilter('');
        setWorkModeFilter('');
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mx-auto shadow-lg animate-pulse flex items-center justify-center">
                                <Briefcase className="w-8 h-8 text-white animate-bounce" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center justify-center">
                                Discovering Opportunities
                                <span className="ml-1">
                                    <span className="animate-pulse">.</span>
                                    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                                    <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                                </span>
                            </h2>
                            <p className="text-slate-600">
                                Gathering the latest positions for you
                            </p>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            <div className="bg-white/80 rounded-2xl p-4 shadow-lg border border-white/20 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                            <div className="bg-white/80 rounded-2xl p-4 shadow-lg border border-white/20 animate-pulse" style={{ animationDelay: '0.2s' }}>
                                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                            </div>
                        </div>
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
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="text-center bg-red-50 border border-red-200 p-8 rounded-xl shadow-lg max-w-md">
                        <h1 className="text-2xl font-bold text-red-700 mb-4">Error Loading Jobs</h1>
                        <p className="text-red-600 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium cursor-pointer active:scale-95"
                        >
                            Try Again
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">

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
                                        <Briefcase className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        Career Opportunities
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    Explore Exciting Career Opportunities
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="text-sm font-medium">{jobs.length} Total Jobs</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Multiple Companies</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Various Locations</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 shadow-sm">
                                    <Check className="w-4 h-4" />
                                    <span className="font-semibold text-sm">{filteredJobs.length} Active Listings</span>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                                    <User className="w-4 h-4" />
                                    <span className="font-semibold text-sm">Public Access</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                            <p className="text-gray-600 text-sm">
                                Discover your next career move from our curated list of opportunities
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    {/* Search and Filter Section */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-6 transition-all duration-300 hover:shadow-xl hover:border-slate-300/50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search jobs, skills, companies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-text bg-white shadow-sm hover:border-slate-400 focus:shadow-md"
                                />
                            </div>

                            {/* Filter Controls */}
                            <div className="flex flex-wrap gap-3">
                                {/* Job Type Dropdown */}
                                <div className="relative filter-dropdown">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowJobTypeDropdown(!showJobTypeDropdown);
                                            setShowWorkModeDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <Clock className="w-4 h-4" />
                                        {jobTypeFilter || 'All Job Types'}
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showJobTypeDropdown ? 'rotate-90' : ''}`} />
                                    </button>

                                    {showJobTypeDropdown && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button
                                                onClick={() => {
                                                    setJobTypeFilter('');
                                                    setShowJobTypeDropdown(false);
                                                }}
                                                className={`flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${!jobTypeFilter ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                                            >
                                                All Job Types
                                                {!jobTypeFilter && <Check className="w-4 h-4" />}
                                            </button>
                                            {jobTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setJobTypeFilter(type);
                                                        setShowJobTypeDropdown(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${jobTypeFilter === type ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                                                >
                                                    {type}
                                                    {jobTypeFilter === type && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Work Mode Dropdown */}
                                <div className="relative filter-dropdown">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowWorkModeDropdown(!showWorkModeDropdown);
                                            setShowJobTypeDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <Home className="w-4 h-4" />
                                        {workModeFilter || 'All Work Modes'}
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showWorkModeDropdown ? 'rotate-90' : ''}`} />
                                    </button>

                                    {showWorkModeDropdown && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button
                                                onClick={() => {
                                                    setWorkModeFilter('');
                                                    setShowWorkModeDropdown(false);
                                                }}
                                                className={`flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${!workModeFilter ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                                            >
                                                All Work Modes
                                                {!workModeFilter && <Check className="w-4 h-4" />}
                                            </button>
                                            {workModes.map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => {
                                                        setWorkModeFilter(mode);
                                                        setShowWorkModeDropdown(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${workModeFilter === mode ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                                                >
                                                    {mode}
                                                    {workModeFilter === mode && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Results Count and Clear Filters */}
                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <span className="text-slate-600 text-sm font-medium">
                                Showing <span className="text-blue-600 font-semibold">{filteredJobs.length}</span> of <span className="text-blue-600 font-semibold">{jobs.length}</span> jobs
                            </span>
                            {(searchTerm || jobTypeFilter || workModeFilter) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(jobTypeFilter || workModeFilter) && (
                        <div className="mb-6 flex flex-wrap gap-2 animate-in fade-in duration-200">
                            {jobTypeFilter && (
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                                    <span>Job Type: {jobTypeFilter}</span>
                                    <button
                                        onClick={() => setJobTypeFilter('')}
                                        className="hover:text-blue-900 cursor-pointer transition-all duration-200 p-0.5 hover:bg-blue-200 rounded-full hover:scale-110 active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            {workModeFilter && (
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                                    <span>Work Mode: {workModeFilter}</span>
                                    <button
                                        onClick={() => setWorkModeFilter('')}
                                        className="hover:text-green-900 cursor-pointer transition-all duration-200 p-0.5 hover:bg-green-200 rounded-full hover:scale-110 active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Jobs List */}
                    <div className="space-y-4 md:space-y-6">
                        {filteredJobs.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-12 text-center fade-in duration-300">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Filter className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
                                <p className="text-slate-600 mb-6">
                                    {jobs.length === 0
                                        ? 'No job opportunities available at the moment.'
                                        : 'Try adjusting your search criteria to see more results.'
                                    }
                                </p>
                                {(searchTerm || jobTypeFilter || workModeFilter) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium cursor-pointer active:scale-95 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredJobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 md:p-6 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform cursor-default"

                                >

                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                                <div className="min-w-0 flex-1">
                                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors duration-200 truncate cursor-pointer">
                                                        {job.title}
                                                    </h2>
                                                    {job.department && (
                                                        <p className="text-slate-600 text-sm mt-1 truncate">
                                                            {job.department}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs md:text-sm font-medium whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default">
                                                        {job.job_type}
                                                    </span>
                                                    <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs md:text-sm font-medium whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default">
                                                        {job.work_mode}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm text-slate-600 mb-4">
                                                {/* Company */}
                                                <div className="flex items-center gap-2 min-w-0 hover:text-slate-900 transition-colors duration-200">
                                                    <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                    <span className="font-medium truncate">{job.company_name || 'Company'}</span>
                                                </div>

                                                {/* Location */}
                                                {job.location && (
                                                    <div className="flex items-center gap-2 min-w-0 hover:text-slate-900 transition-colors duration-200">
                                                        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                        <span className="truncate">{job.location}</span>
                                                    </div>
                                                )}

                                                {/* Salary */}
                                                {(job.min_salary || job.max_salary) && (
                                                    <div className="flex items-center gap-2 min-w-0 hover:text-emerald-700 transition-colors duration-200">
                                                        <DollarSign className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        <span className="font-semibold text-emerald-600 truncate">
                                                            {job.currency} {Number(job.min_salary).toLocaleString()}
                                                            {job.max_salary && job.min_salary && ' - '}
                                                            {job.max_salary && Number(job.max_salary).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Posted Date */}
                                                <div className="flex items-center gap-2 min-w-0 hover:text-slate-900 transition-colors duration-200">
                                                    <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                    <span className="truncate">{formatDate(job.created_at)}</span>
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            {job.required_skills && job.required_skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {job.required_skills.slice(0, 4).map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium transition-all duration-200 hover:bg-blue-200 cursor-default shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {job.required_skills.length > 4 && (
                                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium transition-all duration-200 hover:bg-slate-200 cursor-default shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
                                                            +{job.required_skills.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex-shrink-0 w-full sm:w-auto">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                className="inline-flex items-center justify-center sm:justify-start gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto cursor-pointer active:scale-95 group"
                                            >
                                                View Details
                                                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Load More */}
                    {filteredJobs.length > 0 && filteredJobs.length < jobs.length && (
                        <div className="text-center mt-12">
                            <button className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                                Load More Jobs
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}