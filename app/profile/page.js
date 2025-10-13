'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const decoded = jwtDecode(token);
                console.log('Decoded JWT:', decoded);
                setUser(decoded);

                const res = await fetch(`/api/profile?userId=${decoded.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();

                if (data.success && data.profile) {
                    const profile = data.profile;
                    console.log("Fetched Profile:", profile);

                    // Parse and set profile data
                    setProfileData({
                        name: decoded.fullName || 'Unknown User',
                        email: decoded.email,
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="mt-4 text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="mt-4 text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 py-12 px-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    {user.isProfileComplete && profileData ? (
                        /* Profile Already Completed */
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                                <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"></div>
                                <div className="px-6 sm:px-8 pb-8">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
                                        <div className="w-32 h-32 rounded-2xl bg-white shadow-xl flex items-center justify-center text-5xl font-bold text-indigo-600 border-4 border-white">
                                            {profileData.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{profileData.name}</h1>
                                            <p className="text-slate-600 mt-1 flex items-center gap-2">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                                                    {user.role}
                                                </span>
                                            </p>
                                        </div>
                                        <Link
                                            href={'profile/edit'}
                                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Profile
                                        </Link>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
                                        <a href={`mailto:${profileData.email}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {profileData.email}
                                        </a>
                                        <a href={`tel:${profileData.phone}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {profileData.phone}
                                        </a>
                                        {profileData.linkedinUrl && (
                                            <a href={profileData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                                </svg>
                                                LinkedIn
                                            </a>
                                        )}
                                        {profileData.portfolioUrl && (
                                            <a href={profileData.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                                Portfolio
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Skills
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {profileData.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Projects Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Projects
                                </h2>
                                {profileData.projects.length === 0 ? (
                                    <p className="text-slate-600">No projects added yet.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {profileData.projects.map((project, index) => (
                                            <div key={index} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-200">
                                                <h3 className="text-xl font-semibold text-slate-900">{project.title}</h3>
                                                <p className="text-slate-700 mt-2">{project.description}</p>
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
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Experience Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Experience
                                </h2>
                                {profileData.experiences.length === 0 ? (
                                    <p className="text-slate-600">No experiences added yet.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {profileData.experiences.map((exp, index) => (
                                            <div key={index} className="border-l-4 border-indigo-600 pl-6 py-2">
                                                <h3 className="text-xl font-semibold text-slate-900">{exp.jobTitle}</h3>
                                                <p className="text-indigo-600 font-medium mt-1">{exp.company}</p>
                                                <p className="text-sm text-slate-500 mt-1">{exp.duration}</p>
                                                <p className="text-slate-700 mt-3">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Education Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Education
                                </h2>
                                {profileData.education.length === 0 ? (
                                    <p className="text-slate-600">No education added yet.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {profileData.education.map((edu, index) => (
                                            <div key={index} className="border-l-4 border-purple-600 pl-6 py-2">
                                                <h3 className="text-xl font-semibold text-slate-900">{edu.degree}</h3>
                                                <p className="text-purple-600 font-medium mt-1">{edu.institution}</p>
                                                <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                                    <span>{edu.year}</span>
                                                    <span>•</span>
                                                    <span>{edu.grade}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        /* Profile Not Completed */
                        <div className="max-w-2xl mx-auto">
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
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Complete Profile Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}