'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Building2, Briefcase, MapPin, Users, Check, FileText, XCircle, Eye, Loader2 } from 'lucide-react';
import { getJobDetails } from '@/actions/jobs/getJobDetails';
import { updateJobStatus } from '@/actions/jobs/updateJobStatus';
import { getRecruiters } from '@/actions/jobs/getRecruiters';
import { updateJobRecruiters } from '@/actions/jobs/updateJobRecruiters';
import { getJobApplicationStats } from '@/actions/applications/getJobApplicationStats';

export default function OrganizationJobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.jobId;
    const [job, setJob] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorizedRecruiter, setIsAuthorizedRecruiter] = useState(false);
    const [isJobOwner, setIsJobOwner] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [recruiters, setRecruiters] = useState([]);
    const [lockedRecruiters, setLockedRecruiters] = useState([]);
    const [isUpdatingRecruiters, setIsUpdatingRecruiters] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [applicationStats, setApplicationStats] = useState({
        total: 0,
        shortlisted: 0,
        test_assigned: 0,
        interview_scheduled: 0,
        waiting_for_result: 0,
        accepted: 0,
        rejected: 0
    });

    useEffect(() => {
        const fetchUserAndCheckAuth = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);

                // Check if user is authorized to view job details
                if (!['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    toast.error('You are not authorized to view job details.');
                    setIsLoading(false);
                    return;
                }

                fetchJobDetails(jobId, currentUser);

            } catch (error) {
                console.error('Error getting current user:', error);
                setUser(null);
                setIsLoading(false);
            }
        };

        fetchUserAndCheckAuth();
    }, [jobId, router]);

    const getAuthData = () => {
        if (!user) return null;

        return {
            userId: user.id,
            orgId: user.orgId,
            userRole: user.role
        };
    };

    const fetchJobDetails = async (jobId, userData) => {
        try {
            const result = await getJobDetails(jobId);

            if (result.success && result.job) {
                setJob(result.job);

                await fetchRecruitersForJob(
                    userData.orgId,
                    userData.id,
                    userData.role,
                    result.job
                );

                const isRecruiter = result.job.assigned_recruiters?.includes(parseInt(userData.id));
                const isOwner = result.job.posted_by === userData.id;
                const isOrgMember = result.job.org_id === userData.orgId;

                setIsAuthorizedRecruiter(isRecruiter);
                setIsJobOwner(isOwner);

                if (!isOrgMember) {
                    router.push(`/jobs/${jobId}`);
                    return;
                }

                if (isRecruiter || isOwner || userData.role === 'OrgAdmin') {
                    const stats = await fetchApplicationStats(jobId, userData);
                    setApplicationStats(stats);
                }

            } else {
                console.warn('Job not found');
                router.push('/organization/jobs');
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            router.push('/organization/jobs');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecruitersForJob = async (orgId, userId, userRole, jobData) => {
        try {
            const result = await getRecruiters(orgId, userId, userRole);
            if (result.success) {
                setRecruiters(result.recruiters);

                // Set locked recruiters (job creator + org admin)
                const locked = [jobData.posted_by];
                if (userRole === 'OrgAdmin' && userId !== jobData.posted_by) {
                    locked.push(userId);
                }
                setLockedRecruiters(locked.map(id => id.toString()));
            }
        } catch (error) {
            console.error('Error fetching recruiters:', error);
        }
    };

    const fetchApplicationStats = async (jobId, authData) => {
        try {
            const data = await getJobApplicationStats(jobId);
            console.log(data)
            return data;
        } catch (error) {
            console.error('Error fetching application stats:', error);
            return getDefaultStats();
        }
    };

    const getDefaultStats = () => ({
        total: 0,
        shortlisted: 0,
        test_assigned: 0,
        interview_scheduled: 0,
        waiting_for_result: 0,
        accepted: 0,
        rejected: 0
    });

    const openStatusModal = (newStatus) => {
        setPendingStatus(newStatus);
        setIsStatusModalOpen(true);
    };

    const closeStatusModal = () => {
        setIsStatusModalOpen(false);
        setPendingStatus(null);
    };

    const handleRecruiterSelect = (e) => {
        let selected;

        // Handle both the old multi-select and new individual selection
        if (e.target.selectedOptions) {
            // Old multi-select behavior
            selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
        } else {
            // New individual selection behavior (from Add/Remove buttons)
            selected = e.target.selectedOptions ?
                Array.from(e.target.selectedOptions, (opt) => opt.value) :
                e;
        }

        // Ensure locked recruiters are always included
        const finalSelected = [...new Set([...lockedRecruiters.map(id => parseInt(id)), ...selected.map(id => parseInt(id))])];

        setJob(prev => ({ ...prev, assigned_recruiters: finalSelected }));
    };

    const isRecruiterLocked = (recruiterId) => {
        return lockedRecruiters.includes(recruiterId.toString());
    };

    const handleUpdateStatus = async () => {
        if (!pendingStatus) return;

        setUpdatingStatus(true);
        try {
            const authData = getAuthData();
            if (!authData) {
                router.push('/signin');
                return;
            }

            const result = await updateJobStatus(jobId, pendingStatus, authData);
            if (result.success) {
                setJob(prev => ({ ...prev, status: pendingStatus }));
                toast.success(result.message);
                closeStatusModal();
            } else {
                toast.error(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error updating job status:', error);
            toast.error('An error occurred while updating job status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleUpdateRecruiters = async () => {
        setIsUpdatingRecruiters(true);
        try {
            const authData = getAuthData();
            if (!authData) {
                router.push('/signin');
                return;
            }

            const result = await updateJobRecruiters(jobId, job.assigned_recruiters, authData);
            if (result.success) {
                toast.success('Recruiters updated successfully!');
            } else {
                toast.error(result.message || 'Failed to update recruiters.');
            }
        } catch (error) {
            console.error('Error updating recruiters:', error);
            toast.error('An unexpected error occurred.');
        } finally {
            setIsUpdatingRecruiters(false);
        }
    };

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
                                    You need to be signed in to view job details.
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
                                    Only <strong>HR</strong>, <strong>SeniorHR</strong>, and <strong>OrgAdmin</strong> can view job details.
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
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return <UnauthenticatedComponent />;
    }

    if (user && !['HR', 'SeniorHR', 'OrgAdmin'].includes(user.role)) {
        return <UnauthorizedComponent />;
    }


    if (!job) {
        return (
            <>
                <Toaster />
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900">Job Not Found</h2>
                        <button
                            onClick={() => router.push('/organization/jobs')}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const canManageJob = isAuthorizedRecruiter || isJobOwner || user?.role === 'OrgAdmin';
    const isJobClosed = job.status === 'Closed';

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="min-h-screen bg-slate-50 ">

                {/* Header - Matching Application Details Style */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden mb-4">
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
                                        <Building2 className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        {job.department || 'Job Details'}
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
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${job.status === 'Active' ? 'border-green-200 bg-green-50 text-green-700' :
                                    job.status === 'Draft' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                        'border-red-200 bg-red-50 text-red-700'
                                    } shadow-sm`}>
                                    {job.status === 'Active' && <Check className="w-4 h-4" />}
                                    {job.status === 'Draft' && <FileText className="w-4 h-4" />}
                                    {job.status === 'Closed' && <XCircle className="w-4 h-4" />}
                                    <span className="font-semibold capitalize text-sm">{job.status}</span>
                                </div>
                                {canManageJob && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                                        <Users className="w-4 h-4" />
                                        <span className="font-semibold text-sm">
                                            {isJobOwner ? 'Job Owner' : isAuthorizedRecruiter ? 'Assigned Recruiter' : 'Admin Access'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 flex-col sm:flex-row">
                            <button
                                onClick={() => router.push(`/organization/jobs/${jobId}/applications`)}
                                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Eye className="w-4 h-4" />
                                View Applications ({applicationStats.total})
                            </button>

                            {/* Status Management Buttons */}
                            {canManageJob && !isJobClosed && (
                                <div className="flex flex-wrap gap-2 flex-col sm:flex-row">
                                    {job.status !== 'Draft' && (
                                        <button
                                            onClick={() => openStatusModal('Draft')}
                                            disabled={updatingStatus}
                                            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Move to Draft
                                        </button>
                                    )}
                                    {job.status !== 'Closed' && (
                                        <button
                                            onClick={() => openStatusModal('Closed')}
                                            disabled={updatingStatus}
                                            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Close Job
                                        </button>
                                    )}
                                    {job.status !== 'Active' && (
                                        <button
                                            onClick={() => openStatusModal('Active')}
                                            disabled={updatingStatus}
                                            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Check className="w-4 h-4" />
                                            Activate Job
                                        </button>
                                    )}
                                </div>
                            )}

                            {isJobClosed && canManageJob && (
                                <button
                                    onClick={() => openStatusModal('Active')}
                                    disabled={updatingStatus}
                                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check className="w-4 h-4" />
                                    Reopen Job
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4">
                    {/* Quick Stats */}
                    {canManageJob && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                            {/* Total Applications */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applicationStats.total}</p>
                                        <p className="text-sm text-slate-600">Total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Shortlisted */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applicationStats.shortlisted}</p>
                                        <p className="text-sm text-slate-600">Shortlisted</p>
                                    </div>
                                </div>
                            </div>

                            {/* Test Assigned */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Users className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applicationStats.test_assigned}</p>
                                        <p className="text-sm text-slate-600">Test Assigned</p>
                                    </div>
                                </div>
                            </div>

                            {/* Interview Scheduled */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Users className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applicationStats.interview_scheduled}</p>
                                        <p className="text-sm text-slate-600">Interview</p>
                                    </div>
                                </div>
                            </div>

                            {/* Waiting for Result */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <Users className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applicationStats.waiting_for_result}</p>
                                        <p className="text-sm text-slate-600">Waiting Result</p>
                                    </div>
                                </div>
                            </div>

                            {/* Accepted */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Users className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applicationStats.accepted}</p>
                                        <p className="text-sm text-slate-600">Accepted</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rejected */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <Users className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applicationStats.rejected}</p>
                                        <p className="text-sm text-slate-600">Rejected</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
                        <div className="border-b border-slate-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`py-4 px-6 cursor-pointer border-b-2 font-medium text-sm ${activeTab === 'details'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Job Details
                                </button>
                                {canManageJob && (
                                    <>
                                        <button
                                            onClick={() => setActiveTab('access')}
                                            className={`py-4 px-6 cursor-pointer border-b-2 font-medium text-sm ${activeTab === 'access'
                                                ? 'border-indigo-600 text-indigo-600'
                                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            Grant Access
                                        </button>
                                    </>
                                )}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'details' && <JobDetailsTab job={job} />}
                            {activeTab === 'access' && canManageJob && (
                                <GrantAccessTab
                                    job={job}
                                    recruiters={recruiters}
                                    lockedRecruiters={lockedRecruiters}
                                    isRecruiterLocked={isRecruiterLocked}
                                    onRecruiterSelect={handleRecruiterSelect}
                                    onUpdateRecruiters={handleUpdateRecruiters}
                                    isUpdating={isUpdatingRecruiters}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            {isStatusModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Update Job Status</h3>
                            <button
                                onClick={closeStatusModal}
                                disabled={updatingStatus}
                                className="cursor-pointer text-gray-400 hover:text-white w-8 h-8 rounded hover:bg-red-500 text-2xl disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <p className="text-lg font-medium text-gray-700 mb-2">
                                    Change job status to <span className="font-bold capitalize">{pendingStatus}</span>?
                                </p>
                                <p className="text-sm text-gray-600">
                                    {pendingStatus === 'Active' && 'This will make the job visible to candidates and start accepting applications.'}
                                    {pendingStatus === 'Draft' && 'This will hide the job from candidates and stop accepting applications.'}
                                    {pendingStatus === 'Closed' && 'This will close the job permanently. No new applications will be accepted.'}
                                </p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> This action cannot be undone automatically.
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                            <button
                                onClick={closeStatusModal}
                                disabled={updatingStatus}
                                className="px-4 py-2 cursor-pointer text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={updatingStatus}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg cursor-pointer hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                {updatingStatus ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Confirm Update'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />

            {/* Animations */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-in-out forwards;
                }
            `}</style>
        </>
    );
}

// Job Details Tab Component (unchanged)
function JobDetailsTab({ job }) {
    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Salary Range</h3>
                    <p className="text-slate-700">
                        {job.min_salary} - {job.max_salary} {job.currency}
                    </p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Experience Level</h3>
                    <p className="text-slate-700">{job.experience_level}</p>
                </div>
            </div>

            {/* Required Skills */}
            {job.required_skills && job.required_skills.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {job.required_skills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Qualifications */}
            {job.qualifications && job.qualifications.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Qualifications</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {job.qualifications.map((qual, index) => (
                            <li key={index}>{qual}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Responsibilities</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {job.responsibilities.map((resp, index) => (
                            <li key={index}>{resp}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Job Description */}
            {job.job_description && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Job Description</h3>
                    <p className="text-slate-700 whitespace-pre-wrap">{job.job_description}</p>
                </div>
            )}
        </div>
    );
}

// Grant Access Tab Component - Improved UI
function GrantAccessTab({
    job,
    recruiters,
    lockedRecruiters,
    isRecruiterLocked,
    onRecruiterSelect,
    onUpdateRecruiters,
    isUpdating
}) {
    // Separate recruiters into categories
    const { lockedRecruitersList, selectedRecruitersList, availableRecruitersList } = useMemo(() => {
        const assignedIds = job.assigned_recruiters || [];

        const lockedRecruitersList = recruiters.filter(recruiter =>
            isRecruiterLocked(recruiter.id)
        );

        const selectedRecruitersList = recruiters.filter(recruiter =>
            assignedIds.includes(recruiter.id) && !isRecruiterLocked(recruiter.id)
        );

        const availableRecruitersList = recruiters.filter(recruiter =>
            !assignedIds.includes(recruiter.id) && !isRecruiterLocked(recruiter.id)
        );

        return { lockedRecruitersList, selectedRecruitersList, availableRecruitersList };
    }, [recruiters, job.assigned_recruiters, isRecruiterLocked]);

    const handleAddRecruiter = (recruiterId) => {
        const currentAssigned = job.assigned_recruiters || [];
        const updatedAssigned = [...currentAssigned, recruiterId];
        onRecruiterSelect({ target: { selectedOptions: updatedAssigned.map(id => ({ value: id })) } });
    };

    const handleRemoveRecruiter = (recruiterId) => {
        const currentAssigned = job.assigned_recruiters || [];
        const updatedAssigned = currentAssigned.filter(id => id !== recruiterId);
        onRecruiterSelect({ target: { selectedOptions: updatedAssigned.map(id => ({ value: id })) } });
    };

    return (
        <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Recruiter Access Management</h4>
                <p className="text-blue-700 text-sm">
                    Manage which recruiters can access and manage this job posting.
                    <br />
                    <strong>Note:</strong> Job Creator and Organization Admin are automatically included and cannot be removed.
                </p>
            </div>

            {/* Required Recruiters Section */}
            {lockedRecruitersList.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Required Recruiters
                    </h3>
                    <p className="text-amber-700 text-sm mb-3">
                        These recruiters have automatic access and cannot be removed:
                    </p>
                    <div className="space-y-2">
                        {lockedRecruitersList.map(recruiter => (
                            <div key={recruiter.id} className="flex items-center justify-between bg-amber-100/50 p-3 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center border-2 border-amber-300">
                                        <Users className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-amber-900">{recruiter.name}</p>
                                        <p className="text-amber-700 text-sm">{recruiter.email}</p>
                                        <p className="text-amber-600 text-xs">{recruiter.role}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-xs font-medium">
                                    Required
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Current Recruiters Section */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Current Recruiters ({selectedRecruitersList.length})
                </h3>
                <p className="text-slate-600 text-sm mb-3">
                    These recruiters currently have access to manage this job:
                </p>

                {selectedRecruitersList.length > 0 ? (
                    <div className="space-y-2">
                        {selectedRecruitersList.map(recruiter => (
                            <div key={recruiter.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-300">
                                        <Users className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{recruiter.name}</p>
                                        <p className="text-slate-600 text-sm">{recruiter.email}</p>
                                        <p className="text-slate-500 text-xs">{recruiter.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveRecruiter(recruiter.id)}
                                    disabled={isUpdating}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-slate-500 text-sm">No additional recruiters assigned yet.</p>
                    </div>
                )}
            </div>

            {/* Available Recruiters Section */}
            {availableRecruitersList.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Available Recruiters ({availableRecruitersList.length})
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                        Grant access to additional recruiters from your organization:
                    </p>
                    <div className="space-y-2">
                        {availableRecruitersList.map(recruiter => (
                            <div key={recruiter.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-300">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{recruiter.name}</p>
                                        <p className="text-slate-600 text-sm">{recruiter.email}</p>
                                        <p className="text-slate-500 text-xs">{recruiter.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddRecruiter(recruiter.id)}
                                    disabled={isUpdating}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Available Recruiters Message */}
            {availableRecruitersList.length === 0 && selectedRecruitersList.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-slate-600 text-sm">
                        All available recruiters from your organization already have access to this job.
                    </p>
                </div>
            )}

            {/* Update Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                    onClick={onUpdateRecruiters}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium transition-all ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 shadow-sm hover:shadow-md'
                        }`}
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating Access...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Access Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-amber-100 rounded-lg">
                        <p className="text-amber-800 font-semibold">{lockedRecruitersList.length}</p>
                        <p className="text-amber-700">Required</p>
                    </div>
                    <div className="text-center p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-semibold">{selectedRecruitersList.length}</p>
                        <p className="text-green-700">Additional</p>
                    </div>
                    <div className="text-center p-3 bg-blue-100 rounded-lg">
                        <p className="text-blue-800 font-semibold">{availableRecruitersList.length}</p>
                        <p className="text-blue-700">Available</p>
                    </div>
                </div>
            </div>
        </div>
    );
}