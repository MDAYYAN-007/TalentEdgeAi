'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getUserApplications } from '@/actions/applications/getUserApplications';
import {
    Search, Filter, Calendar, MapPin, Building, Clock,
    CheckCircle, XCircle, Clock4, AlertCircle, Eye,
    FileText, TrendingUp, User, Briefcase, Star, Download,Video
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function ApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please sign in to view your applications');
            router.push('/signin');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setUser(decoded);
            fetchApplications(decoded.id);
        } catch (error) {
            console.error('Error decoding token:', error);
            router.push('/signin');
        }
    }, [router]);

    const fetchApplications = async (userId) => {
        try {
            const result = await getUserApplications(userId);
            if (result.success) {
                setApplications(result.applications);
                console.log('Fetched applications:', result.applications);
            } else {
                toast.error('Failed to load applications');
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Error loading applications');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter and sort applications - FIXED PROPERTY NAMES
    const filteredApplications = applications
        .filter(app => {
            const matchesSearch = app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.appliedAt) - new Date(a.appliedAt);
                case 'oldest':
                    return new Date(a.appliedAt) - new Date(b.appliedAt);
                case 'score-high':
                    return (b.resumeScore || 0) - (a.resumeScore || 0);
                case 'score-low':
                    return (a.resumeScore || 0) - (b.resumeScore || 0);
                default:
                    return 0;
            }
        });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'hired':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'interview_scheduled':
                return <Video className="w-4 h-4 text-purple-500" />;
            case 'test_scheduled':
                return <Zap className="w-4 h-4 text-blue-500" />;
            case 'shortlisted':
                return <Star className="w-4 h-4 text-indigo-500" />;
            case 'waiting_for_result':
                return <Clock className="w-4 h-4 text-orange-500" />;
            case 'submitted':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'hired':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'interview_scheduled':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'test_scheduled':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'shortlisted':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'waiting_for_result':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'submitted':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const stats = {
        total: applications.length,
        submitted: applications.filter(app => app.status === 'submitted').length,
        shortlisted: applications.filter(app => app.status === 'shortlisted').length,
        test_scheduled: applications.filter(app => app.status === 'test_scheduled').length,
        interview_scheduled: applications.filter(app => app.status === 'interview_scheduled').length,
        waiting_for_result: applications.filter(app => app.status === 'waiting_for_result').length,
        hired: applications.filter(app => app.status === 'hired').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        averageScore: applications.length > 0
            ? Math.round(applications.reduce((sum, app) => sum + (app.resumeScore || 0), 0) / applications.length)
            : 0
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Loading your applications...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                                    My Applications
                                </h1>
                                <p className="text-slate-600">
                                    Track and manage all your job applications in one place
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/jobs"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 cursor-pointer active:scale-95"
                                >
                                    <Briefcase className="w-5 h-5" />
                                    Find More Jobs
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-8">
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 text-center">
                            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                            <div className="text-sm text-slate-600">Total</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-yellow-200 p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
                            <div className="text-sm text-slate-600">Submitted</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-indigo-200 p-4 text-center">
                            <div className="text-2xl font-bold text-indigo-600">{stats.shortlisted}</div>
                            <div className="text-sm text-slate-600">Shortlisted</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.test_scheduled}</div>
                            <div className="text-sm text-slate-600">Test Scheduled</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-purple-200 p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{stats.interview_scheduled}</div>
                            <div className="text-sm text-slate-600">Interview</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-orange-200 p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{stats.waiting_for_result}</div>
                            <div className="text-sm text-slate-600">Waiting Result</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-green-200 p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
                            <div className="text-sm text-slate-600">Hired</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-red-200 p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                            <div className="text-sm text-slate-600">Rejected</div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by job title or company..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                >
                                    <option value="all">All Status</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="test_scheduled">Test Scheduled</option>
                                    <option value="interview_scheduled">Interview Scheduled</option>
                                    <option value="waiting_for_result">Waiting for Result</option>
                                    <option value="hired">Hired</option>
                                    <option value="rejected">Rejected</option>
                                </select>

                                {/* Sort By - keep as is */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="score-high">Score: High to Low</option>
                                    <option value="score-low">Score: Low to High</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Applications List */}
                    <div className="space-y-6">
                        {filteredApplications.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                    {applications.length === 0 ? 'No Applications Yet' : 'No Applications Found'}
                                </h3>
                                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                    {applications.length === 0
                                        ? "You haven't applied to any jobs yet. Start your job search and apply to positions that match your skills."
                                        : "No applications match your current filters. Try adjusting your search criteria."
                                    }
                                </p>
                                {applications.length === 0 && (
                                    <Link
                                        href="/jobs"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 cursor-pointer active:scale-95"
                                    >
                                        <Briefcase className="w-5 h-5" />
                                        Browse Jobs
                                    </Link>
                                )}
                            </div>
                        ) : (
                            filteredApplications.map((application) => (
                                <div
                                    key={application.id}
                                    className="bg-white rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 p-6"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                        {/* Company Logo/Icon */}
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                <Building className="w-8 h-8 text-white" />
                                            </div>
                                        </div>

                                        {/* Application Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                        {application.jobTitle}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-slate-600 mb-3">
                                                        <div className="flex items-center gap-1">
                                                            <Building className="w-4 h-4" />
                                                            <span className="font-medium">{application.companyName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{application.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status and Score */}
                                                <div className="flex flex-col sm:items-end gap-2">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(application.status)}`}>
                                                        {getStatusIcon(application.status)}
                                                        <span className="text-sm font-medium capitalize">{application.status}</span>
                                                    </div>
                                                    {application.resumeScore && (
                                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${getScoreColor(application.resumeScore)}`}>
                                                            <TrendingUp className="w-4 h-4" />
                                                            <span className="text-sm font-medium">{application.resumeScore}% Match</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Job Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Briefcase className="w-4 h-4" />
                                                    <span className="text-sm">{application.jobType}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <User className="w-4 h-4" />
                                                    <span className="text-sm">{application.experienceLevel}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 lg:w-48">
                                            <Link
                                                href={`/jobs/${application.jobId}`}
                                                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Job
                                            </Link>
                                            <Link
                                                href={`/applications/${application.id}`}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 cursor-pointer text-sm font-medium"
                                            >
                                                <FileText className="w-4 h-4" />
                                                View Application
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Applications Count */}
                    {filteredApplications.length > 0 && (
                        <div className="mt-8 text-center text-slate-600">
                            Showing {filteredApplications.length} of {applications.length} applications
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}