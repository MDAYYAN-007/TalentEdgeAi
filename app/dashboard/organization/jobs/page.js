'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, DollarSign, User, Loader2, ChevronRight, Filter, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [user, setUser] = useState(null); // State to hold decoded user info (including role & orgId)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Roles authorized to manage jobs
    const isManager = user && ['OrgAdmin', 'Senior Manager', 'HR Recruiter'].includes(user.role);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchJobs = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push('/signin');
                return;
            }

            try {
                const decoded = jwtDecode(token);
                // Check if user is linked to an organization (required for this page)
                if (!decoded.orgId) {
                    setError("Access Denied: You must belong to an organization to view internal jobs.");
                    setIsLoading(false);
                    return;
                }

                setUser(decoded);

                // --- MODIFICATION: Send necessary data via headers ---
                const res = await fetch(`/api/organization-jobs`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'X-Org-ID': decoded.orgId, // Pass Org ID
                        'X-User-ID': decoded.id,   // Pass User ID
                        'X-User-Role': decoded.role, // Pass Role
                    },
                });
                // -----------------------------------------------------

                const data = await res.json();

                if (data.success && data.jobs) {
                    setJobs(data.jobs);
                } else {
                    setError(data.message || "Failed to fetch job listings.");
                }
            } catch (err) {
                console.error("Error loading jobs:", err);
                setError("An error occurred while fetching data. Check server logs.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [router]);

    // --- Render Logic ---

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
                    <p className="text-xl text-indigo-600 ml-3">Loading company job listings...</p>
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
                                    href="/create-jobs"
                                    className="flex items-center cursor-pointer gap-2 bg-white hover:bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all border border-white/20"
                                >
                                    <Briefcase className="w-5 h-5" />
                                    Post New Job
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Filter and Role Information */}
                    <div className="flex justify-between items-center mb-6 p-4 bg-white/70 rounded-xl shadow-md border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            Your Role: <span className="font-bold text-indigo-700">{user?.role}</span>
                        </p>

                        {/* Placeholder for future filtering feature */}
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Filter className="w-4 h-4" />
                            {isManager ? 'HR/Senior HR: Use job details page for assignment filters.' : 'Filter by Department/Location coming soon.'}
                        </div>
                    </div>


                    {/* Jobs List */}
                    <div className="space-y-4">
                        {jobs.length === 0 ? (
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-12 text-center">
                                <p className="text-xl font-semibold text-slate-900 mb-2">No active jobs found</p>
                                <p className="text-slate-600">The hiring pipeline may currently be quiet.</p>
                                {isManager && (
                                    <Link
                                        href="/create-job"
                                        className="mt-6 cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                                    >
                                        Post Your First Job
                                    </Link>
                                )}
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <div key={job.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all flex justify-between items-center gap-4">

                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold text-slate-900 truncate">
                                            {job.title}
                                            {job.department && <span className='text-base font-normal text-slate-600 ml-2'>({job.department})</span>}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">

                                            {/* Job Type & Mode */}
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-xs font-medium">{job.job_type} ({job.work_mode})</span>

                                            {/* Location */}
                                            {job.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                                    {job.location}
                                                </span>
                                            )}

                                            {/* Salary */}
                                            {(job.min_salary || job.max_salary) && (
                                                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                    <DollarSign className="w-4 h-4" />
                                                    {job.currency} {Number(job.min_salary).toLocaleString()}
                                                    {job.max_salary && job.min_salary && ' - '}
                                                    {job.max_salary && Number(job.max_salary).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status and Creator */}
                                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                                            <span className={`px-3 py-1 rounded-lg font-medium ${job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {job.status}
                                            </span>
                                            <span className="italic">Posted by: {job.posted_by_name || 'Admin'}</span>
                                        </div>

                                    </div>

                                    {/* Action Button: View Details */}
                                    <Link
                                        href={`/jobs/${job.id}`}
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
