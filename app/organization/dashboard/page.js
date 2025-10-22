'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import { getOrganizationDashboardData } from '@/actions/dashboard/getOrganizationDashboardData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    Building2, Users, Briefcase, FileText, Calendar,
    ArrowRight, Plus, Eye, BarChart3, Settings,
    Loader2, CheckCircle, XCircle, Clock, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function OrganizationDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    router.push('/signin');
                    return;
                }

                // Check if user has organization access
                if (!['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    toast.error('Access denied. Organization dashboard is for HR team members only.');
                    router.push('/dashboard');
                    return;
                }

                if (!currentUser.orgId) {
                    toast.error('You need to be part of an organization to access this dashboard.');
                    router.push('/dashboard');
                    return;
                }

                setUser(currentUser);

                // Fetch organization dashboard data
                const data = await getOrganizationDashboardData(currentUser.orgId);

                if (data.success) {
                    setDashboardData(data.data);
                } else {
                    toast.error('Failed to load organization data');
                }
            } catch (error) {
                console.error('Error loading organization dashboard:', error);
                toast.error('Error loading organization dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    // Format date function
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-yellow-100 text-yellow-800',
            shortlisted: 'bg-blue-100 text-blue-800',
            'test_scheduled': 'bg-purple-100 text-purple-800',
            'interview_scheduled': 'bg-indigo-100 text-indigo-800',
            rejected: 'bg-red-100 text-red-800',
            hired: 'bg-green-100 text-green-800',
            Active: 'bg-green-100 text-green-800',
            Draft: 'bg-yellow-100 text-yellow-800',
            Closed: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                        <p className="text-slate-600">Loading organization dashboard...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                {/* Header Section */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                        <Building2 className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        Organization Dashboard
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {user.orgName || 'Organization'} Management
                                </h1>

                                <p className="text-lg text-gray-600 mb-4">
                                    Welcome back, {user.name}! Manage your hiring pipeline and team.
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">{user.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {dashboardData?.stats?.team_members || 0} Team Members
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {dashboardData?.stats?.active_jobs || 0} Active Jobs
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="font-semibold text-sm">Management View</span>
                                </div>
                                {user.role === 'OrgAdmin' && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-200 bg-purple-50 text-purple-700 shadow-sm">
                                        <Settings className="w-4 h-4" />
                                        <span className="font-semibold text-sm">Admin Access</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                            <Link
                                href="/organization/jobs"
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Briefcase className="w-4 h-4" />
                                Manage Jobs
                            </Link>
                            <Link
                                href="/organization/applications"
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <FileText className="w-4 h-4" />
                                View Applications
                            </Link>
                            {user.role === 'OrgAdmin' && (
                                <Link
                                    href="/organization/create-job"
                                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Job
                                </Link>
                            )}
                            <Link
                                href="/organization/tests"
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <FileText className="w-4 h-4" />
                                Manage Tests
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Jobs Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Briefcase className="w-6 h-6 text-blue-600" />
                                </div>
                                <Link href="/organization/jobs" className="text-blue-600 hover:text-blue-700">
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                {dashboardData?.stats?.total_jobs || 0}
                            </h3>
                            <p className="text-slate-600">Total Jobs</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs text-green-600 font-medium">
                                    {dashboardData?.stats?.active_jobs || 0} Active
                                </span>
                                <span className="text-xs text-yellow-600 font-medium">
                                    {dashboardData?.stats?.draft_jobs || 0} Draft
                                </span>
                            </div>
                        </div>

                        {/* Applications Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <Link href="/organization/applications" className="text-green-600 hover:text-green-700">
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                {dashboardData?.stats?.total_applications || 0}
                            </h3>
                            <p className="text-slate-600">Total Applications</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs text-blue-600 font-medium">
                                    {dashboardData?.stats?.shortlisted_applications || 0} Shortlisted
                                </span>
                            </div>
                        </div>

                        {/* Team Members Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                {user.role === 'OrgAdmin' && (
                                    <Link href="#" className="text-purple-600 hover:text-purple-700">
                                        <UserPlus className="w-5 h-5" />
                                    </Link>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                {dashboardData?.stats?.team_members || 0}
                            </h3>
                            <p className="text-slate-600">Team Members</p>
                            <p className="text-xs text-slate-500 mt-1">HR & Recruiters</p>
                        </div>

                        {/* Hiring Pipeline Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <BarChart3 className="w-6 h-6 text-orange-600" />
                                </div>
                                <div className="text-orange-600">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                {dashboardData?.stats?.hired_applications || 0}
                            </h3>
                            <p className="text-slate-600">Successful Hires</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs text-green-600 font-medium">
                                    {dashboardData?.stats?.interview_scheduled || 0} Interviews
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Applications Section */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    Recent Applications
                                </h2>
                                <Link
                                    href="/organization/applications"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                >
                                    View All <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {dashboardData?.recentApplications?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.recentApplications.slice(0, 5).map((app) => (
                                        <div key={app.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {app.applicant_name || 'Applicant'}
                                                </h3>
                                                <p className="text-sm text-slate-600 truncate">
                                                    {app.job_title} • {app.department}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                                                        {app.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {formatDate(app.applied_at)}
                                                    </span>
                                                    {app.resume_score && (
                                                        <span className="text-xs font-medium text-blue-600">
                                                            Score: {app.resume_score}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/organization/applications/${app.id}`}
                                                className="text-indigo-600 hover:text-indigo-700"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p>No applications yet</p>
                                    <p className="text-sm">Applications will appear here when candidates apply</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Jobs Section */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    Recent Job Postings
                                </h2>
                                <Link
                                    href="/organization/jobs"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                >
                                    View All <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {dashboardData?.recentJobs?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.recentJobs.slice(0, 5).map((job) => (
                                        <div key={job.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {job.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 truncate">
                                                    {job.department} • {job.job_type}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                                                        {job.status}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {formatDate(job.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 capitalize">
                                                    {job.work_mode}
                                                </span>
                                                <Link
                                                    href={`/organization/jobs/${job.id}`}
                                                    className="text-indigo-600 hover:text-indigo-700"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p>No jobs posted yet</p>
                                    <Link
                                        href="/organization/create-job"
                                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                    >
                                        Create your first job posting
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Management Links */}
                    <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">
                            Quick Management
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link
                                href="/organization/jobs"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <Briefcase className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Jobs</span>
                                <span className="text-xs text-slate-500">Manage postings</span>
                            </Link>
                            <Link
                                href="/organization/applications"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-green-300 hover:shadow-md transition-all group"
                            >
                                <FileText className="w-6 h-6 text-slate-600 group-hover:text-green-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Applications</span>
                                <span className="text-xs text-slate-500">Review candidates</span>
                            </Link>
                            <Link
                                href="/organization/tests"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                                <FileText className="w-6 h-6 text-slate-600 group-hover:text-orange-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Tests</span>
                                <span className="text-xs text-slate-500">Manage assessments</span>
                            </Link>
                            <Link
                                href="/organization/create-job"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group"
                            >
                                <Plus className="w-6 h-6 text-slate-600 group-hover:text-purple-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Create Job</span>
                                <span className="text-xs text-slate-500">New posting</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}