'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { parseResume } from '@/actions/resume/parseResume';
import { UploadCloud, Loader2 } from 'lucide-react';
import { getJobDetails } from '@/actions/jobs/getJobDetails';
import { getProfile } from '@/actions/profile/getProfile';
import { submitApplication } from '@/actions/applications/submitApplication';
import { saveProfile } from '@/actions/profile/saveProfile';
import { checkApplication } from '@/actions/applications/checkApplication';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, CheckCircle, AlertCircle, Building2, MapPin, Clock, DollarSign, LogIn, Edit3, Save, X, Star, Zap, Plus, Trash2, Phone, Linkedin, Globe, GraduationCap, Briefcase, BookOpen, User, Github, Target, FileText, Search, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { scoreResume } from '@/actions/applications/scoreResume';
import { getCurrentUser } from '@/actions/auth/auth-utils';

export default function ApplyJobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.jobId;

    const [user, setUser] = useState(null);
    const [job, setJob] = useState(null);
    const [profile, setProfile] = useState(null);
    const [applicationData, setApplicationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [resumeScore, setResumeScore] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [tempApplicationData, setTempApplicationData] = useState(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [existingApplication, setExistingApplication] = useState(null);
    const [isScoring, setIsScoring] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [forceProfileComplete, setForceProfileComplete] = useState(false); // New state to force profile completion
    const [isUploading, setIsUploading] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [applicationId, setApplicationId] = useState(null);

    useEffect(() => {
        const fetchUserAndJob = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                // Check if currentUser exists before accessing its properties
                if (!currentUser) {
                    console.log('No user found - user not signed in');
                    fetchJobOnly(jobId);
                    return;
                }

                if (!currentUser.isProfileComplete) {
                    console.log('Current User:', currentUser);
                    setIsProfileComplete(false);
                    setForceProfileComplete(true);
                } else {
                    setIsProfileComplete(true);
                }

                fetchJobAndProfile(jobId, currentUser);
            } catch (error) {
                console.error('Error decoding token:', error);
                // If there's an error, user is not signed in
                fetchJobOnly(jobId);
            }
        };

        fetchUserAndJob();
    }, [jobId, router]);

    const fetchJobOnly = async (jobId) => {
        try {
            const jobResult = await getJobDetails(jobId);
            if (jobResult.success && jobResult.job) {
                setJob(jobResult.job);
            } else {
                toast.error('Job not found');
            }
        } catch (error) {
            console.error('Error fetching job:', error);
            toast.error('Error loading job details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJobAndProfile = async (jobId, decoded) => {
        try {
            const jobResult = await getJobDetails(jobId);
            const profileResult = await getProfile(decoded.id);
            const applicationResult = await checkApplication(jobId, decoded.id);

            if (jobResult.success && jobResult.job) {
                setJob(jobResult.job);
            } else {
                toast.error('Job not found');
                return;
            }

            if (profileResult.success && profileResult.profile) {
                const newData = { ...profileResult.profile, name: decoded.name, email: decoded.email };
                setProfile(newData);
                setApplicationData(newData);
                setTempApplicationData(newData);
                setIsProfileComplete(true);
                setForceProfileComplete(false);
            } else {
                setIsProfileComplete(false);
                setForceProfileComplete(true);
                setTempApplicationData({
                    name: decoded.name,
                    email: decoded.email,
                    phone: '',
                    linkedin_url: '',
                    portfolio_url: '',
                    experiences: [],
                    education: [],
                    skills: [],
                    projects: []
                });
            }

            if (applicationResult.success) {
                console.log('Application Check Result:', applicationResult);
                setHasApplied(applicationResult?.hasApplied);
                setApplicationId(applicationResult?.application?.id || null);
                setExistingApplication(applicationResult.application || null);

                if (applicationResult.hasApplied) {
                    toast.success('You have already applied to this job!');
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading application data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoading && forceProfileComplete) {
            setIsEditModalOpen(true);
        }
    }, [isLoading, forceProfileComplete]);

    const handleFieldChange = (field, value) => {
        setTempApplicationData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleArrayFieldChange = (section, index, field, value) => {
        setTempApplicationData(prev => ({
            ...prev,
            [section]: prev[section].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addNestedItem = (section, newItem) => {
        setTempApplicationData(prev => ({
            ...prev,
            [section]: [...(prev[section] || []), newItem]
        }));
    };

    const removeNestedItem = (section, index) => {
        setTempApplicationData(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);

        if (tempApplicationData?.name?.trim() === null) {
            toast.error("Full Name is required.");
            setActiveTab("basic");
            setIsSavingProfile(false);
            return;
        }

        if (!tempApplicationData?.phone?.trim()) {
            toast.error("Phone number is required.");
            setActiveTab("basic");
            setIsSavingProfile(false);
            return;
        }

        const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
        if (!phoneRegex.test(tempApplicationData?.phone.trim())) {
            toast.error("Please enter a valid phone number.");
            setActiveTab("basic");
            setIsSavingProfile(false);
            return;
        }

        if (!tempApplicationData?.skills?.length) {
            toast.error("Please add at least one skill.");
            setActiveTab("skills");
            setIsSavingProfile(false);
            return;
        }

        if (tempApplicationData?.experiences?.length > 0) {
            for (const exp of tempApplicationData?.experiences) {
                if (!exp?.jobTitle || !exp?.company || !exp?.duration) {
                    toast.error("Please fill all required fields in Experience.");
                    setActiveTab("experience");
                    setIsSavingProfile(false);
                    return;
                }
            }
        }

        if (tempApplicationData?.education?.length > 0) {
            for (const edu of tempApplicationData?.education) {
                if (!edu?.degree || !edu?.institution) {
                    toast.error("Please fill all required fields in Education.");
                    setActiveTab("education");
                    setIsSavingProfile(false);
                    return;
                }
            }
        }

        if (tempApplicationData?.projects?.length > 0) {
            for (const proj of tempApplicationData?.projects) {
                if (!proj?.title || !proj?.description) {
                    toast.error("Please fill all required fields in Projects.");
                    setActiveTab("projects");
                    setIsSavingProfile(false);
                    return;
                }
            }
        }

        try {
            const result = await saveProfile({
                userId: user.id,
                email: user.email,
                name: tempApplicationData.name || user.name,
                role: user.role,
                phone: tempApplicationData.phone || '',
                linkedinUrl: tempApplicationData.linkedin_url || '',
                portfolioUrl: tempApplicationData.portfolio_url || '',
                experiences: tempApplicationData.experiences || [],
                education: tempApplicationData.education || [],
                skills: tempApplicationData.skills || [],
                projects: tempApplicationData.projects || []
            });

            if (result.success) {
                localStorage.setItem('token', result.token);
                setResumeScore(null);
                setProfile(tempApplicationData);
                setApplicationData(tempApplicationData);
                setIsProfileComplete(true);
                setForceProfileComplete(false);
                toast.success('Profile created successfully!');
                setIsEditModalOpen(false);

                // Update user state with new token data
                const decoded = jwtDecode(result.token);
                setUser(decoded);
            } else {
                toast.error('Failed to create profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Error creating profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUseForApplication = () => {
        if (tempApplicationData?.name?.trim() === null) {
            toast.error("Full Name is required.");
            setActiveTab("basic");
            setIsSavingProfile(false);
            return;
        }

        if (!tempApplicationData?.phone?.trim()) {
            toast.error("Phone number is required.");
            setActiveTab("basic");
            setIsSavingProfile(false);
            return;
        }

        const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
        if (!phoneRegex.test(tempApplicationData?.phone.trim())) {
            toast.error("Please enter a valid phone number.");
            setActiveTab("basic");
            setIsSavingProfile(false);
            return;
        }

        if (!tempApplicationData?.skills?.length) {
            toast.error("Please add at least one skill.");
            setActiveTab("skills");
            setIsSavingProfile(false);
            return;
        }

        if (tempApplicationData?.experiences?.length > 0) {
            for (const exp of tempApplicationData?.experiences) {
                if (!exp?.jobTitle || !exp?.company || !exp?.duration) {
                    toast.error("Please fill all required fields in Experience.");
                    setActiveTab("experience");
                    setIsSavingProfile(false);
                    return;
                }
            }
        }

        if (tempApplicationData?.education?.length > 0) {
            for (const edu of tempApplicationData?.education) {
                if (!edu?.degree || !edu?.institution) {
                    toast.error("Please fill all required fields in Education.");
                    setActiveTab("education");
                    setIsSavingProfile(false);
                    return;
                }
            }
        }

        if (tempApplicationData?.projects?.length > 0) {
            for (const proj of tempApplicationData?.projects) {
                if (!proj?.title || !proj?.description) {
                    toast.error("Please fill all required fields in Projects.");
                    setActiveTab("projects");
                    setIsSavingProfile(false);
                    return;
                }
            }
        }

        setApplicationData(tempApplicationData);
        toast.success('Profile data updated for this application!');
        setResumeScore(null);
        setIsEditModalOpen(false);
    };

    const handleCancelEdit = () => {
        if (isProfileComplete) {
            setTempApplicationData(applicationData);
            setIsEditModalOpen(false);
        }
    };

    const getScoreMessage = (score) => {
        if (score >= 90) return 'Excellent match! 🎯';
        if (score >= 80) return 'Strong match! 👍';
        if (score >= 70) return 'Good match! ✅';
        if (score >= 60) return 'Moderate match 📊';
        if (score >= 50) return 'Basic match 📈';
        return 'Needs improvement 📝';
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return toast.error("No file selected.");

        setResumeFile(file);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const data = await parseResume(formData);

            console.log("Resume Parse Response:", data);

            if (data.success) {
                const parsed = data.parsedData;

                // Auto-fill the temporary application data from parsed resume
                setTempApplicationData(prev => ({
                    ...prev,
                    name: parsed.name || prev.name,
                    phone: parsed.phone || prev.phone,
                    linkedin_url: parsed.linkedinUrl || prev.linkedin_url,
                    portfolio_url: parsed.portfolioUrl || prev.portfolio_url,
                    skills: parsed.skills || prev.skills,
                    education: (parsed.education || []).map(edu => ({
                        degree: edu.degree || '',
                        institution: edu.institution || '',
                        year: edu.year || '',
                        grade: edu.grade || '',
                    })) || prev.education,
                    experiences: (parsed.experience || []).map(exp => ({
                        jobTitle: exp.jobTitle || '',
                        company: exp.company || '',
                        duration: exp.duration || '',
                        description: exp.description || '',
                    })) || prev.experiences,
                    projects: (parsed.projects || []).map(p => ({
                        title: p.title || '',
                        description: p.description || '',
                        githubUrl: p.githubUrl || '',
                        liveUrl: p.liveUrl || '',
                    })) || prev.projects,
                }));

                setActiveTab("basic");
                toast.success("Resume parsed successfully! Review and edit the auto-filled data.");
            } else {
                console.log("Raw Affinda Response:", data.raw);
                toast.error(data.message || "Failed to parse resume. Please fill manually.");
            }
        } catch (err) {
            console.error("Resume parsing error:", err);
            toast.error("Error uploading resume");
        } finally {
            setIsUploading(false);
        }
    };

    const generateAIScore = async () => {
        if (!job || !applicationData) {
            toast.error('Job or application data is missing.');
            return null;
        }

        setIsScoring(true);
        setResumeScore(null);
        setAiFeedback(null);

        try {
            const payload = {
                jobDetails: {
                    title: job.title,
                    description: job.job_description,
                    department: job.department,
                    requiredSkills: job.required_skills,
                    qualifications: job.qualifications,
                    responsibilities: job.responsibilities,
                    experienceLevel: job.experience_level,
                    salaryRange: job.min_salary && job.max_salary ? `${job.min_salary} - ${job.max_salary} ${job.currency}` : 'Not specified',
                },
                applicantProfile: {
                    name: applicationData.name,
                    email: user.email,
                    phone: applicationData.phone,
                    linkedinUrl: applicationData.linkedin_url,
                    portfolioUrl: applicationData.portfolio_url,
                    experiences: applicationData.experiences,
                    education: applicationData.education,
                    skills: applicationData.skills,
                    projects: applicationData.projects
                },
                coverLetter: coverLetter,
            };

            const result = await scoreResume(payload);

            if (result.success && typeof result.score === 'number') {
                console.log('AI Score Result:', result);
                const roundedScore = Math.round(result.score);
                console.log(roundedScore);
                setResumeScore(roundedScore);
                setAiFeedback(result);

                toast.success(`Score Calculated: ${roundedScore}%! ${result.message}`);

                return {
                    score: roundedScore,
                    feedback: result
                };
            } else {
                toast.error(result.message || 'Failed to generate AI score.');
                setResumeScore(null);
                setAiFeedback(null);
                return null;
            }

        } catch (error) {
            console.error('Error generating AI score:', error);
            toast.error('An unexpected error occurred during scoring.');
            setResumeScore(null);
            setAiFeedback(null);
            return null;
        } finally {
            setIsScoring(false);
        }
    };

    const handleSubmitApplication = async () => {
        if (!coverLetter.trim()) {
            toast.error('Please add a cover letter');
            return;
        }

        setIsSubmitting(true);
        try {
            let finalScore = resumeScore;
            let finalFeedback = aiFeedback;

            if (finalScore === null || !finalFeedback) {
                const scoringResult = await generateAIScore();
                if (scoringResult === null) {
                    setIsSubmitting(false);
                    return;
                }
                finalScore = scoringResult.score;
                finalFeedback = scoringResult.feedback;
            }

            const result = await submitApplication({
                jobId: parseInt(jobId),
                applicantId: user.id,
                applicationData: {
                    basic: {
                        name: applicationData.name,
                        email: user.email,
                        phone: applicationData.phone,
                        linkedinUrl: applicationData.linkedin_url,
                        portfolioUrl: applicationData.portfolio_url
                    },
                    experiences: applicationData.experiences,
                    education: applicationData.education,
                    skills: applicationData.skills,
                    projects: applicationData.projects
                },
                coverLetter,
                resumeScore: finalScore,
                aiFeedback: finalFeedback
            });

            if (result.success) {
                setHasApplied(true);
                setExistingApplication(result.application);
                setApplicationId(result.applicationId);
                toast.success('Application submitted successfully! 🎉');
            } else {
                toast.error(result.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            toast.error('Error submitting application');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabData = [
        { key: 'upload', label: 'Upload Resume', Icon: UploadCloud },
        { key: 'basic', label: 'Basic Info', Icon: User },
        { key: 'skills', label: 'Skills', Icon: Zap },
        { key: 'education', label: 'Education', Icon: GraduationCap },
        { key: 'experience', label: 'Experience', Icon: Briefcase },
        { key: 'projects', label: 'Projects', Icon: BookOpen },
    ];

    if (isLoading) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="flex flex-col min-h-screen">
                    <div className="flex-grow flex items-center justify-center p-4">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-slate-600 font-medium">Loading application...</p>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!job) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="flex items-center justify-center p-4 my-8">
                    <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Job Not Found</h2>
                        <p className="text-slate-600 mb-2">The job you are looking for does not exist.</p>
                        <p className="text-slate-600 mb-2">It might have been removed or the link is incorrect.</p>
                        <p className="text-slate-600 mb-6">Try browsing other jobs.</p>

                        <button
                            onClick={() => router.push('/jobs')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 cursor-pointer font-medium active:scale-95"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Toaster />
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-8 md:pb-12">

                    <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden mb-6">
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


                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto px-4">
                        {/* Sign In Required Section */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-12 text-center">
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LogIn className="w-10 h-10 text-amber-600" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Sign In Required</h2>
                            <p className="text-slate-600 mb-6 text-lg">
                                You need to be signed in to apply for this position.
                            </p>
                            <p className="text-slate-500 mb-8">
                                Create an account or sign in to submit your application for <span className="font-semibold text-slate-900">{job.title}</span> at <span className="font-semibold text-slate-900">{job.company_name}</span>.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/signin"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 cursor-pointer active:scale-95"
                                >
                                    <LogIn className="w-5 h-5" />
                                    Sign In to Apply
                                </Link>
                                <Link
                                    href="/signup"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer active:scale-95"
                                >
                                    Create Account
                                </Link>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <p className="text-sm text-slate-500">
                                    Don't have an account? <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign up here</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (hasApplied) {
        return (
            <>
                <Toaster />
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 md:py-12">
                    <div className="max-w-4xl mx-auto px-4">
                        {/* Header */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 md:gap-6">
                                <div className="flex-1 min-w-0">
                                    <button
                                        onClick={() => router.back()}
                                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all duration-200 font-medium cursor-pointer mb-4 group"
                                    >
                                        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                                        Back to Job
                                    </button>
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 break-words">Already Applied</h1>
                                    <p className="text-slate-600 mt-2">You have already submitted an application for this position</p>
                                </div>
                                <div className="px-4 py-3 bg-green-100 text-green-800 rounded-lg whitespace-nowrap flex-shrink-0">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Submitted</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Application Details */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
                                <p className="text-slate-600 mb-8 text-sm md:text-base">
                                    Your application for <span className="font-semibold text-slate-900">{job.title}</span> at <span className="font-semibold text-slate-900">{job.company_name}</span> has been successfully submitted.
                                </p>

                                <div className="space-y-3">
                                    <Link
                                        href={`/applications/${applicationId}`}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 cursor-pointer active:scale-95 w-full"
                                    >
                                        <FileText className="w-5 h-5" />
                                        View Your Applications
                                    </Link>

                                    <Link
                                        href="/jobs"
                                        className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer active:scale-95 w-full"
                                    >
                                        <Search className="w-5 h-5" />
                                        Browse Other Jobs
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
                <Footer />
            </>
        );
    }

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-8 md:pb-12">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group cursor-pointer"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Job
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                        <Briefcase className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        Job Application
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {job.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
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
                                    {job.experience_level && (
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm font-medium">{job.experience_level}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Job Info */}
                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                    {job.department && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Department:</span>
                                            <span>{job.department}</span>
                                        </div>
                                    )}
                                    {(job.min_salary || job.max_salary) && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Salary:</span>
                                            <span>
                                                {job.currency} {Number(job.min_salary).toLocaleString()}
                                                {job.max_salary && job.min_salary && ' - '}
                                                {job.max_salary && Number(job.max_salary).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {job.status && (
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Status:</span>
                                            <span className="capitalize">{job.status}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resume Score & Application Status */}
                            <div className="flex flex-col gap-4">
                                {/* Resume Score */}
                                <div className="text-center">
                                    <div className={`px-4 md:px-6 py-3 md:py-4 rounded-xl border-2 ${resumeScore >= 80 ? 'border-green-200 bg-green-50 text-green-700' :
                                        resumeScore >= 60 ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                            'border-blue-200 bg-blue-50 text-blue-700'
                                        } shadow-sm`}>
                                        <p className="text-xs md:text-sm font-semibold">Resume Match Score</p>
                                        <p className="text-2xl md:text-3xl font-bold">
                                            {resumeScore !== null ? `${resumeScore}%` : '--'}
                                        </p>
                                        {resumeScore !== null && (
                                            <p className="text-xs mt-1 opacity-75">
                                                {getScoreMessage(resumeScore)}
                                            </p>
                                        )}
                                    </div>
                                    {!resumeScore && (
                                        <button
                                            onClick={generateAIScore}
                                            disabled={isScoring}
                                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {isScoring ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    AI Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4" />
                                                    Get AI Score
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Left Column - Application Form */}
                        <div className="lg:col-span-2 space-y-6 md:space-y-8">
                            {/* Profile Review Section */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                                        Your Profile
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setTempApplicationData(applicationData);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 font-medium cursor-pointer active:scale-95 bg-indigo-50/50"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edit Profile
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Contact Information */}
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                            Contact Information
                                        </h3>
                                        <p className="text-slate-600 text-sm md:text-base mb-1">{applicationData?.name}</p>
                                        <p className="text-slate-600 text-sm md:text-base mb-1">{applicationData?.phone}</p>
                                        <p className="text-slate-600 text-sm md:text-base">{user?.email}</p>
                                    </div>

                                    {/* Skills */}
                                    {applicationData?.skills?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-blue-600" />
                                                Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {applicationData?.skills?.map((skill, index) => (
                                                    <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs md:text-sm font-medium hover:bg-blue-200 transition-colors duration-200">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {applicationData?.experiences?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-blue-600" />
                                                Experience
                                            </h3>
                                            <div className="space-y-3">
                                                {applicationData?.experiences?.map((exp, index) => (
                                                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                                        <p className="font-medium text-slate-900 text-sm md:text-base">{exp.jobTitle} at {exp.company}</p>
                                                        <p className="text-xs md:text-sm text-slate-600">{exp.duration}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cover Letter Section */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                                    Cover Letter
                                </h2>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
                                    rows={6}
                                    className="w-full border-2 border-slate-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none text-sm md:text-base"
                                />
                                <p className="text-xs md:text-sm text-slate-500 mt-2">
                                    {coverLetter.length}/1000 characters
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Job Summary & Actions */}
                        <div className="space-y-6 md:space-y-8">
                            {/* Job Summary */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
                                    <Briefcase className="w-5 h-5 text-indigo-600" />
                                    Job Summary
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium mb-1">Location</p>
                                        <p className="font-medium text-slate-900 text-sm md:text-base">{job.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium mb-1">Job Type</p>
                                        <p className="font-medium text-slate-900 text-sm md:text-base">{job.job_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium mb-1">Work Mode</p>
                                        <p className="font-medium text-slate-900 text-sm md:text-base">{job.work_mode}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium mb-1">Experience Level</p>
                                        <p className="font-medium text-slate-900 text-sm md:text-base">{job.experience_level}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                                    <Zap className="w-5 h-5 text-purple-600" />
                                    Required Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.required_skills?.map((skill, index) => (
                                        <span key={index} className="px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-200 transition-colors duration-200">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Application */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-md border border-indigo-200 p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                                <button
                                    onClick={handleSubmitApplication}
                                    disabled={isSubmitting || !coverLetter.trim() || !isProfileComplete}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer active:scale-95 text-sm md:text-base shadow-lg hover:shadow-xl"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Submit Application
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-slate-600 mt-3 text-center">
                                    By submitting, you agree to share your profile with {job.company_name}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal - Modified for forced profile completion */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
                        {/* Modal Header - Modified for forced completion */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                                    {forceProfileComplete ? 'Complete Your Profile to Apply' : 'Customize Your Application'}
                                </h2>
                                {forceProfileComplete && (
                                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                                        Required
                                    </span>
                                )}
                            </div>
                            {/* Only show close button if profile is already complete */}
                            {!forceProfileComplete && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-2 hover:bg-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
                                >
                                    <X className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
                                </button>
                            )}
                        </div>

                        {/* Modal Content - Same as before */}
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            {/* Sidebar Navigation */}
                            <div className="w-full md:w-1/4 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
                                <div className="overflow-x-auto md:overflow-x-visible p-2 md:p-4">
                                    <nav className="flex md:flex-col gap-2">
                                        {tabData.map(({ key, label, Icon }) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveTab(key)}
                                                className={`w-full flex items-center justify-center md:justify-start cursor-pointer gap-2 px-3 md:px-4 py-2 md:py-3 text-left rounded-lg transition-all duration-200 whitespace-nowrap md:whitespace-normal text-sm md:text-base font-medium ${activeTab === key
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'text-slate-700 hover:bg-slate-200'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                                                <span className="hidden sm:block">{label}</span>
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>

                            {/* Form Content - Same as before */}
                            <div className="flex-1 p-4 md:p-6 overflow-y-auto">

                                {/* Upload Resume Tab */}
                                {activeTab === 'upload' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <UploadCloud className="w-5 h-5 text-indigo-600" />
                                            Upload Resume (AI Auto-Fill)
                                        </h3>

                                        <div className="bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center">
                                            <p className="text-xs text-indigo-500 font-semibold uppercase mb-1">Quick Start</p>
                                            <h4 className="text-lg font-semibold text-slate-900 mb-2">Upload Your Resume</h4>
                                            <p className="text-sm text-slate-600 mb-4">
                                                Upload your resume (PDF, DOC, DOCX) and we'll automatically fill your profile information.
                                            </p>

                                            <input
                                                type="file"
                                                id="resume-upload"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleResumeUpload}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="resume-upload"
                                                className={`inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium transition-all cursor-pointer ${isUploading ? 'opacity-70 cursor-wait' : 'hover:bg-indigo-700'
                                                    }`}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="animate-spin h-4 w-4" />
                                                        Parsing Resume...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-4 h-4" />
                                                        Select Resume File
                                                    </>
                                                )}
                                            </label>

                                            {resumeFile && (
                                                <p className="mt-3 text-sm font-medium text-slate-900">
                                                    File selected: <span className="text-green-700">{resumeFile.name}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="p-3 bg-slate-100 rounded-lg text-slate-700 text-sm">
                                            <p className="font-semibold">Tip:</p>
                                            <p>After uploading, review all tabs to verify the auto-filled information.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Basic Info Tab */}
                                {activeTab === 'basic' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <h3 className="text-lg md:text-xl font-bold text-slate-900">Basic Information</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={tempApplicationData?.name || user?.name || ''}
                                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                                    className="w-full border-2 border-slate-200 rounded-lg px-3 md:px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={user?.email}
                                                    disabled
                                                    className="w-full border-2 border-slate-200 rounded-lg px-3 md:px-4 py-2 bg-slate-100 cursor-not-allowed text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input type="tel" name="phone" value={tempApplicationData?.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} placeholder="+1 (555) 123-4567" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                </div>
                                            </div>
                                            {/* LinkedIn */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn Profile</label>
                                                <div className="relative">
                                                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input type="url" name="linkedinUrl" value={tempApplicationData?.linkedinUrl} onChange={(e) => handleFieldChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/username" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                </div>
                                            </div>
                                            {/* Portfolio */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Portfolio / Website</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input type="url" name="portfolioUrl" value={tempApplicationData?.portfolioUrl} onChange={(e) => handleFieldChange('portfolio_url', e.target.value)} placeholder="https://yourportfolio.com" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Skills Tab */}
                                {activeTab === 'skills' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className='flex justify-between items-center'>
                                            <h3 className="text-lg md:text-xl font-bold text-slate-900">Skills</h3>
                                            {tempApplicationData?.skills?.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFieldChange('skills', [])}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium cursor-pointer text-sm border border-red-200 hover:border-red-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add a skill and press Enter"
                                                    className="flex-1 border-2 border-slate-200 rounded-lg px-3 md:px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const skill = e.target.value.trim();
                                                            if (skill && !tempApplicationData?.skills?.includes(skill)) {
                                                                handleFieldChange('skills', [...(tempApplicationData?.skills || []), skill]);
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {tempApplicationData?.skills?.map((skill, index) => (
                                                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs md:text-sm font-medium hover:bg-indigo-200 transition-colors">
                                                        {skill}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newSkills = tempApplicationData?.skills.filter((_, i) => i !== index);
                                                                handleFieldChange('skills', newSkills);
                                                            }}
                                                            className="text-indigo-500 hover:text-indigo-800 cursor-pointer"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                {(tempApplicationData?.skills?.length === 0 || !tempApplicationData?.skills) && (
                                                    <p className="text-sm text-slate-500 italic">No skills added yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Education Tab */}
                                {activeTab === 'education' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-lg md:text-xl font-bold text-slate-900">Education</h3>
                                            <button
                                                type="button"
                                                onClick={() => addNestedItem('education', { degree: '', institution: '', year: '', grade: '' })}
                                                className="inline-flex items-center gap-1 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium cursor-pointer text-xs md:text-sm active:scale-95"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span className="hidden sm:inline">Add</span>
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {tempApplicationData?.education?.map((edu, index) => (
                                                <div key={index} className="border-2 border-slate-200 rounded-lg p-4 space-y-3 relative hover:border-slate-300 transition-colors">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNestedItem('education', index)}
                                                        className="absolute top-3 right-3 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Degree"
                                                            value={edu.degree}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'degree', e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Institution"
                                                            value={edu.institution}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'institution', e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Year"
                                                            value={edu.year}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'year', e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Grade"
                                                            value={edu.grade}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'grade', e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(tempApplicationData?.education?.length === 0 || !tempApplicationData?.education) && (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                                                    <p className="text-base italic">Click 'Add Degree' to list your academic qualifications.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Experience Tab */}
                                {activeTab === 'experience' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-lg md:text-xl font-bold text-slate-900">Experience</h3>
                                            <button
                                                type="button"
                                                onClick={() => addNestedItem('experiences', { jobTitle: '', company: '', duration: '', description: '' })}
                                                className="inline-flex items-center gap-1 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium cursor-pointer text-xs md:text-sm active:scale-95"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span className="hidden sm:inline">Add</span>
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {tempApplicationData?.experiences?.map((exp, index) => (
                                                <div key={index} className="border-2 border-slate-200 rounded-lg p-4 space-y-3 relative hover:border-slate-300 transition-colors">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNestedItem('experiences', index)}
                                                        className="absolute top-3 right-3 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Job Title"
                                                            value={exp.jobTitle}
                                                            onChange={(e) => handleArrayFieldChange('experiences', index, 'jobTitle', e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Company"
                                                            value={exp.company}
                                                            onChange={(e) => handleArrayFieldChange('experiences', index, 'company', e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Duration"
                                                            value={exp.duration}
                                                            onChange={(e) => handleArrayFieldChange('experiences', index, 'duration', e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm sm:col-span-2"
                                                        />
                                                        <textarea
                                                            placeholder="Description"
                                                            value={exp.description}
                                                            onChange={(e) => handleArrayFieldChange('experiences', index, 'description', e.target.value)}
                                                            rows={3}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm sm:col-span-2 resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(tempApplicationData?.experiences?.length === 0 || !tempApplicationData?.experiences) && (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                                                    <p className="text-base italic">Click 'Add Job' to list your professional experience.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Projects Tab */}
                                {activeTab === 'projects' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-lg md:text-xl font-bold text-slate-900">Projects</h3>
                                            <button
                                                type="button"
                                                onClick={() => addNestedItem('projects', { title: '', description: '', githubUrl: '', liveUrl: '' })}
                                                className="inline-flex items-center gap-1 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium cursor-pointer text-xs md:text-sm active:scale-95"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span className="hidden sm:inline">Add</span>
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {tempApplicationData?.projects?.map((project, index) => (
                                                <div key={index} className="border-2 border-slate-200 rounded-lg p-4 space-y-3 relative hover:border-slate-300 transition-colors">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNestedItem('projects', index)}
                                                        className="absolute top-3 right-3 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        placeholder="Project Title"
                                                        value={project.title}
                                                        onChange={(e) => handleArrayFieldChange('projects', index, 'title', e.target.value)}
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                    />
                                                    <textarea
                                                        placeholder="Description"
                                                        value={project.description}
                                                        onChange={(e) => handleArrayFieldChange('projects', index, 'description', e.target.value)}
                                                        rows={3}
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm resize-none"
                                                    />
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="relative">
                                                            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <input
                                                                type="url"
                                                                placeholder="GitHub URL"
                                                                value={project.githubUrl}
                                                                onChange={(e) => handleArrayFieldChange('projects', index, 'githubUrl', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 pl-9 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <input
                                                                type="url"
                                                                placeholder="Live URL"
                                                                value={project.liveUrl}
                                                                onChange={(e) => handleArrayFieldChange('projects', index, 'liveUrl', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 pl-9 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {tempApplicationData?.projects?.length === 0 && (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                                                    <p className="text-base italic">Click 'Add Project' to showcase your work.</p>
                                                </div>
                                            )}
                                            {!tempApplicationData?.projects && (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                                                    <p className="text-base italic">Click 'Add Project' to showcase your work.</p>
                                                </div>
                                            )
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer - Modified for forced completion */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 md:p-6 border-t border-slate-200 bg-slate-50">
                            {!forceProfileComplete ? (
                                <>
                                    <p className="text-xs md:text-sm text-slate-600">
                                        <strong>Tip:</strong> Use "Upload Resume" tab for quick auto-fill, then customize for this job
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 md:px-6 py-2 md:py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-medium cursor-pointer text-sm active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSavingProfile}
                                            className="flex items-center justify-center cursor-pointer gap-2 px-4 md:px-6 py-2 md:py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm active:scale-95"
                                        >
                                            {isSavingProfile ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Save to Profile</span>
                                                    <span className="sm:hidden">Save</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleUseForApplication}
                                            className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium cursor-pointer text-sm active:scale-95"
                                        >
                                            <Target className="w-4 h-4" />
                                            <span className="hidden sm:inline">Apply with These</span>
                                            <span className="sm:hidden">Apply</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <AlertCircle className="w-5 h-5" />
                                        <p className="text-sm font-medium">Complete your profile to continue with your application</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => router.push('/jobs')}
                                            className="px-4 md:px-6 py-2 md:py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-medium cursor-pointer text-sm active:scale-95"
                                        >
                                            Browse Other Jobs
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSavingProfile}
                                            className="flex items-center justify-center cursor-pointer gap-2 px-4 md:px-6 py-2 md:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm active:scale-95"
                                        >
                                            {isSavingProfile ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Creating Profile...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Save Profile & Continue
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}