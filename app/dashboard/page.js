'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import { getUserDashboardData } from '@/actions/dashboard/getUserDashboardData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    Briefcase, Users, FileText, Calendar, User, Settings,
    Building2, ArrowRight, Clock, CheckCircle, XCircle,
    Loader2, Star, MapPin, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function DashboardPage() {
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

                setUser(currentUser);

                // Fetch dashboard data based on user role
                const data = await getUserDashboardData(currentUser.id, currentUser.role);

                if (data.success) {
                    setDashboardData(data.data);
                } else {
                    toast.error('Failed to load dashboard data');
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
                toast.error('Error loading dashboard');
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

    // Format time for interviews
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                        <p className="text-slate-600">Loading your dashboard...</p>
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
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                    Welcome back, {user.name || 'User'}! 👋
                                </h1>
                                <p className="text-lg text-gray-600 mb-4">
                                    {user.role === 'User' && 'Track your job applications and interviews in one place.'}
                                    {user.role === 'HR' && 'Manage your recruitment pipeline and candidate applications.'}
                                    {user.role === 'SeniorHR' && 'Oversee recruitment strategy and team management.'}
                                    {user.role === 'OrgAdmin' && 'Manage your organization and hiring processes.'}
                                </p>

                                {/* Role-specific message for HR/SeniorHR/OrgAdmin */}
                                {['HR', 'SeniorHR', 'OrgAdmin'].includes(user.role) && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-blue-800 font-medium">
                                                    Organization Management Access
                                                </p>
                                                <p className="text-blue-700 text-sm">
                                                    Access advanced organization features and team management tools.
                                                </p>
                                                <Link
                                                    href="/organization/dashboard"
                                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm mt-2 transition-colors"
                                                >
                                                    View Organization Dashboard <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm">
                                    <User className="w-4 h-4" />
                                    <span className="font-semibold capitalize text-sm">{user.role}</span>
                                </div>
                                {user.orgName && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-200 bg-purple-50 text-purple-700 shadow-sm">
                                        <Building2 className="w-4 h-4" />
                                        <span className="font-semibold text-sm">{user.orgName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Quick Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Applications Card */}
                        <Link href="/applications" className="cursor-pointer group">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group-hover:-translate-y-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                    {dashboardData?.stats?.totalApplications || 0}
                                </h3>
                                <p className="text-slate-600">Applications</p>
                            </div>
                        </Link>

                        {/* Interviews Card */}
                        <Link href="/interviews" className="cursor-pointer group">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-200 group-hover:-translate-y-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <Calendar className="w-6 h-6 text-green-600" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                    {dashboardData?.upcomingInterviews?.length || 0}
                                </h3>
                                <p className="text-slate-600">Upcoming Interviews</p>
                            </div>
                        </Link>

                        {/* Jobs Card */}
                        <Link href="/jobs" className="cursor-pointer group">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-200 group-hover:-translate-y-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <Briefcase className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                    {dashboardData?.recommendedJobs?.length || 0}
                                </h3>
                                <p className="text-slate-600">Available Jobs</p>
                            </div>
                        </Link>

                        {/* Tests Card */}
                        <Link href="/tests" className="cursor-pointer group">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all duration-200 group-hover:-translate-y-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-orange-100 rounded-xl">
                                        <FileText className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                    {dashboardData?.stats?.totalTests || 0}
                                </h3>
                                <p className="text-slate-600">Tests</p>
                            </div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Applications Section */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Recent Applications
                                </h2>
                                <Link
                                    href="/applications"
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
                                                    {app.job_title}
                                                </h3>
                                                <p className="text-sm text-slate-600 truncate">
                                                    {app.company_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${app.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                            app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                                                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {formatDate(app.applied_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            {app.status === 'shortlisted' && (
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p>No applications yet</p>
                                    <Link
                                        href="/jobs"
                                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                    >
                                        Browse jobs to get started
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Upcoming Interviews Section */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                    Upcoming Interviews
                                </h2>
                                <Link
                                    href="/interviews"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                >
                                    View All <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {dashboardData?.upcomingInterviews?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.upcomingInterviews.slice(0, 5).map((interview) => (
                                        <div key={interview.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {interview.job_title}
                                                </h3>
                                                <p className="text-sm text-slate-600 truncate">
                                                    {interview.company_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span className="text-xs text-slate-500">
                                                        {formatDate(interview.scheduled_at)} at {formatTime(interview.scheduled_at)}
                                                    </span>
                                                    <span className="text-xs text-slate-500 capitalize">
                                                        • {interview.interview_type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                    interview.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {interview.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p>No upcoming interviews</p>
                                    <p className="text-sm">Interviews will appear here when scheduled</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recommended Jobs Section */}
                    <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-purple-600" />
                                Recommended Jobs
                            </h2>
                            <Link
                                href="/jobs"
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                                Browse All Jobs <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {dashboardData?.recommendedJobs?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dashboardData.recommendedJobs.slice(0, 6).map((job) => (
                                    <Link
                                        key={job.id}
                                        href={`/jobs/${job.id}`}
                                        className="cursor-pointer group"
                                    >
                                        <div className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-slate-600 text-sm mt-1">
                                                        {job.company_name}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 mt-1" />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{job.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Briefcase className="w-4 h-4" />
                                                    <span>{job.job_type} • {job.work_mode}</span>
                                                </div>
                                                {(job.min_salary || job.max_salary) && (
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                                                        <DollarSign className="w-4 h-4" />
                                                        <span>
                                                            {job.min_salary && `${job.currency} ${Number(job.min_salary).toLocaleString()}`}
                                                            {job.max_salary && job.min_salary && ' - '}
                                                            {job.max_salary && Number(job.max_salary).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p>No jobs available at the moment</p>
                                <p className="text-sm">Check back later for new opportunities</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link
                                href="/profile"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <User className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Profile</span>
                            </Link>
                            <Link
                                href="/applications"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <FileText className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Applications</span>
                            </Link>
                            <Link
                                href="/interviews"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <Calendar className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Interviews</span>
                            </Link>
                            <Link
                                href="/tests"
                                className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <FileText className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 mb-2" />
                                <span className="text-sm font-medium text-slate-700">Tests</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}