'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getJobDetails } from '@/actions/jobs/getJobDetails';
import { updateJobStatus } from '@/actions/jobs/updateJobStatus';
import { Users, ArrowLeft, Eye, FileText, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getRecruiters } from '@/actions/jobs/getRecruiters';
import { updateJobRecruiters } from '@/actions/jobs/updateJobRecruiters';

export default function OrganizationJobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.jobId;

    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorizedRecruiter, setIsAuthorizedRecruiter] = useState(false);
    const [isJobOwner, setIsJobOwner] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [recruiters, setRecruiters] = useState([]);
    const [lockedRecruiters, setLockedRecruiters] = useState([]);
    const [isUpdatingRecruiters, setIsUpdatingRecruiters] = useState(false);

    // Modal states
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/signin');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setUser(decoded);
            fetchJobDetails(jobId, decoded);
        } catch (error) {
            console.error('Error decoding token:', error);
            router.push('/signin');
        }
    }, [jobId, router]);

    const getAuthData = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const decoded = jwtDecode(token);
            return {
                userId: decoded.id,
                orgId: decoded.orgId,
                userRole: decoded.role
            };
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
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


                // Check if user is authorized to view applications
                const isRecruiter = result.job.assigned_recruiters?.includes(parseInt(userData.id));
                const isOwner = result.job.posted_by === userData.id;
                const isOrgMember = result.job.org_id === userData.orgId;

                setIsAuthorizedRecruiter(isRecruiter);
                setIsJobOwner(isOwner);

                if (!isOrgMember) {
                    // Redirect to public job page if not from same organization
                    router.push(`/jobs/${jobId}`);
                    return;
                }

                // For now, use dummy applications data
                setApplications([
                    {
                        id: 1,
                        candidate_name: 'John Doe',
                        candidate_email: 'john.doe@email.com',
                        applied_at: new Date().toISOString(),
                        status: 'pending',
                        resume_url: '/resumes/john-doe.pdf',
                        cover_letter: 'I am very interested in this position...'
                    },
                    {
                        id: 2,
                        candidate_name: 'Jane Smith',
                        candidate_email: 'jane.smith@email.com',
                        applied_at: new Date().toISOString(),
                        status: 'approved',
                        resume_url: '/resumes/jane-smith.pdf',
                        cover_letter: 'My experience aligns perfectly...'
                    },
                    {
                        id: 3,
                        candidate_name: 'Mike Johnson',
                        candidate_email: 'mike.johnson@email.com',
                        applied_at: new Date().toISOString(),
                        status: 'rejected',
                        resume_url: '/resumes/mike-johnson.pdf',
                        cover_letter: 'I believe I would be a great fit...'
                    }
                ]);
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

    // Check if a recruiter is locked
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

    const handleViewApplication = (applicationId) => {
        // Navigate to application details page or show modal
        console.log('View application:', applicationId);
        // For now, we'll show an alert with application details
        const application = applications.find(app => app.id === applicationId);
        if (application) {
            alert(`Application Details:\n\nName: ${application.candidate_name}\nEmail: ${application.candidate_email}\nStatus: ${application.status}\nCover Letter: ${application.cover_letter}`);
        }
    };

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
            <div className="min-h-screen bg-slate-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                                        <p className="text-slate-600 mt-2">{job.department} • {job.location}</p>
                                        <div className="flex gap-2 mt-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${job.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                job.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {job.status}
                                            </span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                {job.job_type}
                                            </span>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                                {job.work_mode}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/jobs/${jobId}`)}
                                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-indigo-700 hover:text-white cursor-pointer"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Public
                                        </button>
                                        <button
                                            onClick={() => router.push('/organization/jobs')}
                                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-indigo-700 hover:text-white cursor-pointer "
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back to Jobs
                                        </button>
                                    </div>
                                </div>

                                {/* Management Info */}
                                {canManageJob && (
                                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-indigo-800 font-medium">
                                                    {isJobOwner && 'You created this job. '}
                                                    {isAuthorizedRecruiter && !isJobOwner && 'You are assigned as recruiter'}
                                                    {user?.role === 'OrgAdmin' && 'You have admin access'}
                                                </p>
                                                <p className="text-xs text-indigo-600 mt-1">
                                                    {isJobClosed
                                                        ? 'This job is closed and no longer accepting new applications'
                                                        : 'You can manage applications and update job status'
                                                    }
                                                </p>
                                            </div>
                                            {!isJobClosed && (
                                                <div className="flex gap-2">
                                                    {job.status !== 'Draft' && (
                                                        <button
                                                            onClick={() => openStatusModal('Draft')}
                                                            disabled={updatingStatus}
                                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white cursor-pointer rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Move to Draft
                                                        </button>
                                                    )}
                                                    {job.status !== 'Closed' && (
                                                        <button
                                                            onClick={() => openStatusModal('Closed')}
                                                            disabled={updatingStatus}
                                                            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Close Job
                                                        </button>
                                                    )}
                                                    {job.status !== 'Active' && (
                                                        <button
                                                            onClick={() => openStatusModal('Active')}
                                                            disabled={updatingStatus}
                                                            className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Activate Job
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    {canManageJob && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                                        <p className="text-sm text-slate-600">Total Applications</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Users className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {applications.filter(app => app.status === 'approved').length}
                                        </p>
                                        <p className="text-sm text-slate-600">Approved</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <Users className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {applications.filter(app => app.status === 'pending').length}
                                        </p>
                                        <p className="text-sm text-slate-600">Pending</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <Users className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {applications.filter(app => app.status === 'rejected').length}
                                        </p>
                                        <p className="text-sm text-slate-600">Rejected</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
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
                                            onClick={() => setActiveTab('applications')}
                                            className={`py-4 px-6 cursor-pointer border-b-2 font-medium text-sm ${activeTab === 'applications'
                                                ? 'border-indigo-600 text-indigo-600'
                                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            Applications ({applications.length})
                                        </button>
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
                            {activeTab === 'applications' && canManageJob && (
                                <ApplicationsTab
                                    applications={applications}
                                    onViewApplication={handleViewApplication}
                                    isJobClosed={isJobClosed}
                                />
                            )}
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
                                className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
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

// Applications Tab Component (unchanged)
function ApplicationsTab({ applications, onViewApplication, isJobClosed }) {
    const handleApplicationAction = (applicationId, action) => {
        console.log(`${action} application:`, applicationId);
        // Add application action logic here
    };

    if (applications.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-600">No applications received yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {isJobClosed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> This job is closed and no longer accepting new applications, but you can still manage existing applications.
                    </p>
                </div>
            )}

            {applications.map((application) => (
                <div key={application.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{application.candidate_name}</h4>
                            <p className="text-slate-600 text-sm">{application.candidate_email}</p>
                            <p className="text-slate-500 text-sm mt-1">Applied on: {new Date(application.applied_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.status === 'approved' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {application.status}
                        </span>
                    </div>

                    {/* Application actions */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => onViewApplication(application.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                            <FileText className="w-4 h-4" />
                            View Application
                        </button>
                        <button
                            onClick={() => handleApplicationAction(application.id, 'approve')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                            Reject
                        </button>
                    </div>
                </div>
            ))}
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