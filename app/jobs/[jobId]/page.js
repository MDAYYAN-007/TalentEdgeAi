'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Briefcase,
    MapPin,
    DollarSign,
    Calendar,
    Building2,
    Users,
    Clock,
    ArrowLeft,
    Share2,
    Bookmark,
    CheckCircle,
    ChevronRight,
    X
} from 'lucide-react';
import Link from 'next/link';
import { getPublicJobDetails } from '@/actions/jobs/getPublicJobDetails';

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.jobId;

    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isApplying, setIsApplying] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [shareMessage, setShareMessage] = useState('');

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                const result = await getPublicJobDetails(jobId);

                if (result.success && result.job) {
                    setJob(result.job);
                } else {
                    setError(result.message || "Job not found.");
                }
            } catch (err) {
                console.warn("Error loading job details:", err);
                setError("An error occurred while fetching job details.");
            } finally {
                setIsLoading(false);
            }
        };

        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: job?.title,
                    text: `Check out this job opportunity: ${job?.title} at ${job?.company_name}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            setShareMessage('Link copied to clipboard!');
            setTimeout(() => setShareMessage(''), 3000);
        }
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mx-auto mb-6 flex items-center justify-center animate-pulse">
                            <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Loading Job Details
                        </h3>
                        <p className="text-slate-600">
                            Getting the job information ready...
                        </p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !job) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="text-center bg-red-50 border border-red-200 p-8 rounded-2xl shadow-lg max-w-md">
                        <h1 className="text-2xl font-bold text-red-700 mb-4">Job Not Found</h1>
                        <p className="text-red-600 mb-6">{error || "The job you're looking for doesn't exist."}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => router.push('/jobs')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium cursor-pointer active:scale-95"
                            >
                                Browse Jobs
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium cursor-pointer active:scale-95"
                            >
                                Go Back
                            </button>
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Link
                                href="/jobs"
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
                                        <Briefcase className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        Job Details
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {job.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">{job.company_name || 'Company'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">{job.job_type} • {job.work_mode}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 shadow-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="font-semibold capitalize text-sm">{job.status}</span>
                                </div>
                                {(job.min_salary || job.max_salary) && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="font-semibold text-sm">
                                            {job.currency} {Number(job.min_salary).toLocaleString()}
                                            {job.max_salary && job.min_salary && ' - '}
                                            {job.max_salary && Number(job.max_salary).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                            <Link
                                href={`/jobs/${jobId}/apply`}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Briefcase className="w-4 h-4" />
                                Apply Now
                            </Link>

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>

                            {shareMessage && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg border border-green-200">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">{shareMessage}</span>
                                </div>
                            )}

                            {job.department && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                    <span className="text-sm">Department: {job.department}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">


                    {/* Job Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6 md:space-y-8">
                            {/* Job Description */}
                            {job.job_description && (
                                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-1 h-8 bg-blue-600 rounded"></div>
                                        Job Description
                                    </h2>
                                    <div className="prose prose-slate max-w-none">
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {job.job_description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Responsibilities */}
                            {job.responsibilities && job.responsibilities.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-1 h-8 bg-blue-600 rounded"></div>
                                        Key Responsibilities
                                    </h2>
                                    <ul className="space-y-3 md:space-y-4">
                                        {job.responsibilities.map((responsibility, index) => (
                                            <li key={index} className="flex items-start gap-3 text-slate-700 hover:text-slate-900 transition-colors duration-200">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                                                <span className="text-sm md:text-base leading-relaxed">{responsibility}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Qualifications */}
                            {job.qualifications && job.qualifications.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-1 h-8 bg-green-600 rounded"></div>
                                        Qualifications
                                    </h2>
                                    <ul className="space-y-3 md:space-y-4">
                                        {job.qualifications.map((qualification, index) => (
                                            <li key={index} className="flex items-start gap-3 text-slate-700 hover:text-slate-900 transition-colors duration-200">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2.5 flex-shrink-0" />
                                                <span className="text-sm md:text-base leading-relaxed">{qualification}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6 md:space-y-8">
                            {/* Required Skills */}
                            {job.required_skills && job.required_skills.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300 ">
                                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                        Required Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-xs md:text-sm font-medium hover:bg-blue-200 transition-colors duration-200 cursor-default"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Company Info */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    About Company
                                </h3>
                                <div className="space-y-3 text-slate-700 text-sm md:text-base">
                                    <p className="leading-relaxed">We are a leading company in our industry, committed to excellence and innovation.</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>Active job postings available</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Apply CTA */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                <h3 className="text-lg md:text-xl font-bold text-blue-900 mb-3">Ready to Apply?</h3>
                                <p className="text-blue-700 text-sm md:text-base mb-4 leading-relaxed">
                                    Don't miss this opportunity! Apply now and take the next step in your career.
                                </p>
                                <Link
                                    href={`/jobs/${jobId}/apply`}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 cursor-pointer active:scale-95 shadow-md hover:shadow-lg"
                                >
                                    Start Application
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}