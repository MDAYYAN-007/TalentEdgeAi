'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { getProfile } from '@/actions/profile/getProfile';
import Link from 'next/link';
import { getCurrentUser } from '@/actions/auth/auth-utils';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const currentUser = await getCurrentUser();
                
                if (!currentUser) {
                    console.log('No authenticated user found');
                    setIsLoading(false);
                    return;
                }

                console.log('Authenticated User:', currentUser);
                setUser(currentUser);

                const data = await getProfile(currentUser.id);

                console.log("Profile Fetch Response:", data);

                if (data.success && data.profile) {
                    const profile = data.profile;
                    console.log("Fetched Profile:", profile);

                    // Parse and set profile data
                    setProfileData({
                        name: currentUser.name || 'Unknown User',
                        email: currentUser.email,
                        phone: profile.phone || '',
                        linkedinUrl: profile.linkedin_url || '',
                        portfolioUrl: profile.portfolio_url || '',
                        resumeUrl: profile.resume_url || '',
                        experiences: profile.experiences || [],
                        education: profile.education || [],
                        skills: profile.skills || [],
                        projects: profile.projects || []
                    });
                } else {
                    console.warn("No profile found for user.");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4">
                    <div className="text-center bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">

                        {/* Simplified, High-Contrast Spinner */}
                        <div className="inline-block relative">
                            {/* Outer Spinner (The main motion) */}
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-indigo-800"></div>

                            {/* Inner Dot (A subtle pulse for visual weight) */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse"></div>
                            </div>
                        </div>

                        <p className="mt-6 text-slate-800 font-bold text-xl">Loading your profile...</p>
                        <p className="mt-1 text-slate-600 text-sm">Fetching personalized data. Hang tight!</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4">
                    <div className="max-w-md w-full">
                        <div className="relative">
                            {/* Subtle background blur effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                            <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                                {/* Updated Icon: Key or Lock for Authentication */}
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-700 shadow-lg">
                                    {/* Using a standard 'Key' icon to signify access required */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2v5a2 2 0 01-2 2h-2m2-4h-2m0 0a1 1 0 00-1-1v-2a1 1 0 00-1 1v2a1 1 0 00-1 1h2a2 2 0 002-2V9a2 2 0 00-2-2m-2 4h4" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v-2m-6 4v-4m0 0H6a2 2 0 00-2 2v5a2 2 0 002 2h2m-2-4v4m4-4v4m0-4h4m-4 4h4" />
                                    </svg>
                                </div>

                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                        Access Denied
                                    </h1>
                                    <p className="text-slate-600">
                                        You need to be **signed in** to view your profile and personal data.
                                    </p>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <a
                                        href="/signin"
                                        className="block w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Login to Continue 🔒
                                    </a>
                                    <p className="text-sm text-slate-500">
                                        Don't have an account?{' '}
                                        <a href="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 underline underline-offset-2">
                                            Create an account
                                        </a>
                                    </p>
                                </div>
                            </div>
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 pb-12 ">

                {user.isProfileComplete && profileData ? (
                    <>
                        {/* Profile Header */}
                        <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden mb-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group cursor-pointer"
                                    >
                                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Dashboard
                                    </Link>
                                </div>

                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                                My Profile
                                            </span>
                                        </div>

                                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                            {profileData?.name || user?.name || 'My Profile'}
                                        </h1>

                                        <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm font-medium">{user?.email}</span>
                                            </div>
                                            {profileData?.skills && (
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">{profileData.skills.length} Skills</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="text-sm font-medium capitalize">{user?.role || 'User'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Link
                                            href="/profile/edit"
                                            className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Profile
                                        </Link>
                                        {user?.isProfileComplete ? (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-semibold text-sm">Profile Complete</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-700 shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <span className="font-semibold text-sm">Profile Incomplete</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Skills Section */}
                            {profileData.skills.length > 0 && (
                                <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                        Skills
                                    </h2>
                                    <div className="flex flex-wrap gap-3">
                                        {profileData.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 rounded-xl font-medium border border-indigo-100 hover:shadow-md transition-shadow"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Projects Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Projects
                                </h2>
                                {profileData.projects.length === 0 ? (
                                    <p className="text-slate-500 italic">No projects added yet.</p>
                                ) : (
                                    <div className="space-y-5">
                                        {profileData.projects.map((project, index) => (
                                            <div key={index} className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
                                                <h3 className="text-xl font-semibold text-slate-900">{project.title}</h3>
                                                <p className="text-slate-700 mt-2 leading-relaxed">{project.description}</p>
                                                {(project.githubUrl || project.liveUrl) && (
                                                    <div className="flex flex-wrap gap-3 mt-4">
                                                        {project.githubUrl && (
                                                            <a
                                                                href={project.githubUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                                                            >
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                                </svg>
                                                                GitHub
                                                            </a>
                                                        )}
                                                        {project.liveUrl && (
                                                            <a
                                                                href={project.liveUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                                Live Demo
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Experience Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Experience
                                </h2>
                                {profileData.experiences.length === 0 ? (
                                    <p className="text-slate-500 italic">No experiences added yet.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {profileData.experiences.map((exp, index) => (
                                            <div key={index} className="border-l-4 border-indigo-600 pl-6 py-2 hover:border-indigo-700 transition-colors">
                                                <h3 className="text-xl font-semibold text-slate-900">{exp.jobTitle}</h3>
                                                <p className="text-indigo-600 font-medium mt-1">{exp.company}</p>
                                                <p className="text-sm text-slate-500 mt-1">{exp.duration}</p>
                                                <p className="text-slate-700 mt-3 leading-relaxed">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Education Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Education
                                </h2>
                                {profileData.education.length === 0 ? (
                                    <p className="text-slate-500 italic">No education added yet.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {profileData.education.map((edu, index) => (
                                            <div key={index} className="border-l-4 border-purple-600 pl-6 py-2 hover:border-purple-700 transition-colors">
                                                <h3 className="text-xl font-semibold text-slate-900">{edu.degree}</h3>
                                                <p className="text-purple-600 font-medium mt-1">{edu.institution}</p>
                                                {(edu.year || edu.grade) && (
                                                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                                        {edu.year && <span>{edu.year}</span>}
                                                        {edu.year && edu.grade && <span>•</span>}
                                                        {edu.grade && <span>{edu.grade}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </>
                ) : (
                    /* Profile Not Completed */
                    <div className="max-w-2xl mx-auto pt-12">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                            <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                                    Welcome, {user.name}! 👋
                                </h1>
                                <p className="text-lg text-slate-600 max-w-md mx-auto">
                                    Your profile is incomplete. Complete your profile to unlock personalized job recommendations and better opportunities!
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                    <div className="p-4 bg-indigo-50 rounded-xl">
                                        <p className="text-2xl mb-2">🎯</p>
                                        <p className="text-sm font-semibold text-slate-900">Better Matches</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl">
                                        <p className="text-2xl mb-2">💼</p>
                                        <p className="text-sm font-semibold text-slate-900">More Opportunities</p>
                                    </div>
                                    <div className="p-4 bg-pink-50 rounded-xl">
                                        <p className="text-2xl mb-2">⭐</p>
                                        <p className="text-sm font-semibold text-slate-900">Stand Out</p>
                                    </div>
                                </div>

                                <Link
                                    href="/profile/edit"
                                    className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Complete Profile Now
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <Footer />
        </>
    );
}