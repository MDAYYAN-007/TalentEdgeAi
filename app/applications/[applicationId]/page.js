'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getApplicationDetails } from '@/actions/applications/getApplicationDetails';
import {
    ArrowLeft, Calendar, MapPin, Building, Clock, User,
    CheckCircle, XCircle, Clock4, AlertCircle, FileText,
    TrendingUp, Star, Zap, Target, Award, Briefcase,
    GraduationCap, BookOpen, Phone, Mail, Globe, Linkedin,
    Download, Share, Eye, Sparkles
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function ApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.applicationId;

    const [application, setApplication] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please sign in to view application details');
            router.push('/signin');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setUser(decoded);
            fetchApplicationDetails(applicationId, decoded.id);
        } catch (error) {
            console.error('Error decoding token:', error);
            router.push('/signin');
        }
    }, [applicationId, router]);

    const fetchApplicationDetails = async (appId, userId) => {
        try {
            const result = await getApplicationDetails(appId, userId);
            if (result.success) {
                console.log('Application:', result.application);
                setApplication(result.application);
            } else {
                toast.error('Failed to load application details');
                router.push('/applications');
            }
        } catch (error) {
            console.error('Error fetching application details:', error);
            toast.error('Error loading application details');
            router.push('/applications');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'hired':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'interview_scheduled':
                return <Clock4 className="w-5 h-5 text-purple-600" />;
            case 'test_scheduled':
                return <Zap className="w-5 h-5 text-blue-600" />;
            case 'shortlisted':
                return <Star className="w-5 h-5 text-indigo-600" />;
            case 'waiting_for_result':
                return <Clock className="w-5 h-5 text-orange-600" />;
            case 'submitted':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'hired':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'interview_scheduled':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'test_scheduled':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'shortlisted':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'waiting_for_result':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'submitted':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-700 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-red-700 bg-red-50 border-red-200';
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading application details...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!application) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
                        <p className="text-gray-600 mb-6">The application you're looking for doesn't exist or you don't have access to it.</p>
                        <Link
                            href="/applications"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Applications
                        </Link>
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
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Professional Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <Link
                                href="/applications"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium cursor-pointer group"
                            >
                                <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
                                Back to Applications
                            </Link>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Building className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold">{application.companyName}</span>
                                </div>

                                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                    {application.jobTitle}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{application.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row sm:flex-col gap-3">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(application.status)}`}>
                                    {getStatusIcon(application.status)}
                                    <span className="font-medium capitalize">{application.status}</span>
                                </div>
                                {application.resumeScore && (
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getScoreColor(application.resumeScore)}`}>
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="font-medium">{application.resumeScore}% Match</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Clean Navigation Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'overview'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Eye className="w-4 h-4" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('ai-analysis')}
                                className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'ai-analysis'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Target className="w-4 h-4" />
                                AI Analysis
                            </button>
                            <button
                                onClick={() => setActiveTab('application')}
                                className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'application'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Full Application
                            </button>
                        </div>
                    </div>

                    {/* Application Content */}
                    <div id="application-content" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Summary</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-gray-600" />
                                                <span className="font-semibold text-gray-900">Experience Level</span>
                                            </div>
                                            <p className="text-gray-700">{application.experienceLevel}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Briefcase className="w-4 h-4 text-gray-600" />
                                                <span className="font-semibold text-gray-900">Job Type</span>
                                            </div>
                                            <p className="text-gray-700">{application.jobType}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-4 h-4 text-gray-600" />
                                                <span className="font-semibold text-gray-900">Work Mode</span>
                                            </div>
                                            <p className="text-gray-700">{application.workMode}</p>
                                        </div>
                                    </div>

                                    {application.aiFeedback && (
                                        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                                AI Score Breakdown
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                                                        {application.resumeScore}%
                                                    </div>
                                                    <div className="text-sm text-gray-600">Overall Match Score</div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700">Objective Score</span>
                                                        <span className="font-semibold text-green-600">
                                                            {application.aiFeedback.objectiveScore}/30
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700">Subjective Score</span>
                                                        <span className="font-semibold text-blue-600">
                                                            {application.aiFeedback.subjectiveScore}/70
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI Analysis Tab */}
                        {activeTab === 'ai-analysis' && application.aiFeedback && (
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Resume Analysis</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                                        <div className="text-3xl font-bold text-gray-900 mb-2">{application.resumeScore}%</div>
                                        <div className="text-gray-600">Overall Match</div>
                                    </div>
                                    <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
                                        <div className="text-2xl font-bold text-green-600 mb-2">{application.aiFeedback.objectiveScore}/30</div>
                                        <div className="text-green-700">Objective Score</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
                                        <div className="text-2xl font-bold text-blue-600 mb-2">{application.aiFeedback.subjectiveScore}/70</div>
                                        <div className="text-blue-700">Subjective Score</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            Key Strengths
                                        </h3>
                                        <div className="space-y-3">
                                            {application?.aiFeedback?.explanationList?.map((explanation, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${explanation.toLowerCase().includes('exceed') ||
                                                        explanation.toLowerCase().includes('solid') ||
                                                        explanation.toLowerCase().includes('strong') ||
                                                        explanation.toLowerCase().includes('align')
                                                        ? 'bg-green-500' : 'bg-amber-500'
                                                        }`}></div>
                                                    <p className="text-gray-700 text-sm leading-relaxed">{explanation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-amber-600" />
                                            Improvement Suggestions
                                        </h3>
                                        <div className="space-y-3">
                                            {application?.aiImprovementSuggestions?.map((suggestion, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                    <span className="text-amber-600 font-medium mt-0.5 flex-shrink-0">{index + 1}.</span>
                                                    <p className="text-gray-700 text-sm leading-relaxed">{suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai-analysis' && !application.aiFeedback && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Target className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Analysis Available</h3>
                                <p className="text-gray-600">
                                    AI analysis was not performed for this application.
                                </p>
                            </div>
                        )}

                        {/* Full Application Tab */}
                        {activeTab === 'application' && (
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Application Details</h2>

                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Personal Information
                                    </h3>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                <label className="block text-sm font-medium text-blue-700 mb-1">Full Name</label>
                                                <p className="text-gray-900 font-medium">{application.applicationData.basic.name}</p>
                                            </div>
                                            <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                                                <p className="text-gray-900 font-medium">{application.applicationData.basic.email}</p>
                                            </div>
                                            <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                <label className="block text-sm font-medium text-blue-700 mb-1">Phone</label>
                                                <p className="text-gray-900 font-medium">{application.applicationData.basic.phone}</p>
                                            </div>
                                            {application.applicationData.basic.linkedinUrl && (
                                                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                    <label className="block text-sm font-medium text-blue-700 mb-1">LinkedIn</label>
                                                    <a href={application.applicationData.basic.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:text-blue-700">
                                                        View Profile
                                                    </a>
                                                </div>
                                            )}
                                            {application.applicationData.basic.portfolioUrl && (
                                                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                                                    <label className="block text-sm font-medium text-blue-700 mb-1">Portfolio</label>
                                                    <a href={application.applicationData.basic.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:text-indigo-700">
                                                        Visit Portfolio
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {application.applicationData.skills && application.applicationData.skills.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-amber-600" />
                                            Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {application.applicationData.skills.map((skill, index) => (
                                                <span key={index} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {application.applicationData.experiences && application.applicationData.experiences.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-green-600" />
                                            Work Experience
                                        </h3>
                                        <div className="space-y-4">
                                            {application.applicationData.experiences.map((exp, index) => (
                                                <div key={index} className="border-l-4 border-green-500 pl-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-r-xl hover:shadow-sm transition-all duration-200">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                                                        <h4 className="font-bold text-gray-900 text-lg">{exp.jobTitle}</h4>
                                                        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full font-medium border border-green-200">
                                                            {exp.duration}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 font-semibold mb-3 text-lg">{exp.company}</p>
                                                    {exp.description && (
                                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line bg-white/80 p-4 rounded-lg border border-green-100">
                                                            {exp.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {application.applicationData.education && application.applicationData.education.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-purple-600" />
                                            Education
                                        </h3>
                                        <div className="space-y-4">
                                            {application.applicationData.education.map((edu, index) => (
                                                <div key={index} className="border-l-4 border-purple-500 pl-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-r-xl hover:shadow-sm transition-all duration-200">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900 text-lg">{edu.degree}</h4>
                                                        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full font-medium border border-purple-200">
                                                            {edu.year}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 font-semibold mb-2 text-lg">{edu.institution}</p>
                                                    {edu.grade && (
                                                        <p className="text-gray-600 font-medium bg-white/80 px-3 py-2 rounded-lg border border-purple-100 inline-block">
                                                            Grade: {edu.grade}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {application.coverLetter && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-indigo-600" />
                                            Cover Letter
                                        </h3>
                                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                                                {application.coverLetter}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Link
                            href={`/jobs/${application.jobId}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer font-medium"
                        >
                            <Eye className="w-4 h-4" />
                            View Job Posting
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}