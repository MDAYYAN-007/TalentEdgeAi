'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setUser(decoded);

            // TODO: Fetch full profile data from API
            // For now, using mock data
            if (decoded.isProfileComplete) {
                setProfileData({
                    name: decoded.name,
                    email: decoded.email,
                    phone: '+1 (555) 123-4567',
                    linkedinUrl: 'https://linkedin.com/in/johndoe',
                    portfolioUrl: 'https://johndoe.dev',
                    experiences: [
                        {
                            jobTitle: 'ML Engineer',
                            company: 'TalentEdge',
                            duration: 'Jan 2022 - Present',
                            description: 'Building AI-powered recruitment solutions'
                        }
                    ],
                    education: [
                        {
                            degree: 'B.Tech in AI & ML',
                            institution: 'XYZ University',
                            year: '2021',
                            grade: '8.5 CGPA'
                        }
                    ],
                    skills: ['Python', 'React', 'Node.js', 'Machine Learning', 'TensorFlow'],
                    projects: [
                        {
                            title: 'AI Interview System',
                            description: 'Built an AI-powered interview platform',
                            githubUrl: 'https://github.com/user/project',
                            liveUrl: 'https://project.com'
                        }
                    ]
                });
            }
        }
    }, []);

    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        linkedinUrl: '',
        portfolioUrl: '',
        experiences: [{ jobTitle: '', company: '', duration: '', description: '' }],
        education: [{ degree: '', institution: '', year: '', grade: '' }],
        skills: [],
        projects: [{ title: '', description: '', githubUrl: '', liveUrl: '' }]
    });
    const [skillInput, setSkillInput] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Add Experience
    const addExperience = () => {
        setFormData({
            ...formData,
            experiences: [...formData.experiences, { jobTitle: '', company: '', duration: '', description: '' }]
        });
    };

    // Remove Experience
    const removeExperience = (index) => {
        const newExperiences = formData.experiences.filter((_, i) => i !== index);
        setFormData({ ...formData, experiences: newExperiences });
    };

    // Update Experience
    const updateExperience = (index, field, value) => {
        const newExperiences = [...formData.experiences];
        newExperiences[index][field] = value;
        setFormData({ ...formData, experiences: newExperiences });
    };

    // Add Education
    const addEducation = () => {
        setFormData({
            ...formData,
            education: [...formData.education, { degree: '', institution: '', year: '', grade: '' }]
        });
    };

    // Remove Education
    const removeEducation = (index) => {
        const newEducation = formData.education.filter((_, i) => i !== index);
        setFormData({ ...formData, education: newEducation });
    };

    // Update Education
    const updateEducation = (index, field, value) => {
        const newEducation = [...formData.education];
        newEducation[index][field] = value;
        setFormData({ ...formData, education: newEducation });
    };

    // Add Project
    const addProject = () => {
        setFormData({
            ...formData,
            projects: [...formData.projects, { title: '', description: '', githubUrl: '', liveUrl: '' }]
        });
    };

    // Remove Project
    const removeProject = (index) => {
        const newProjects = formData.projects.filter((_, i) => i !== index);
        setFormData({ ...formData, projects: newProjects });
    };

    // Update Project
    const updateProject = (index, field, value) => {
        const newProjects = [...formData.projects];
        newProjects[index][field] = value;
        setFormData({ ...formData, projects: newProjects });
    };

    // Add Skill
    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
            setSkillInput('');
        }
    };

    // Remove Skill
    const removeSkill = (skillToRemove) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter(skill => skill !== skillToRemove)
        });
    };

    // Handle Resume Upload
    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setResumeFile(file);
        setIsUploading(true);

        // TODO: Call API to parse resume with AI
        const formDataUpload = new FormData();
        formDataUpload.append('resume', file);

        try {
            const res = await fetch('/api/profile/parse-resume', {
                method: 'POST',
                body: formDataUpload,
            });
            const data = await res.json();

            if (data.success) {
                // Auto-fill form with parsed data
                setFormData(prev => ({
                    ...prev,
                    ...data.parsedData
                }));
            }
        } catch (error) {
            console.error('Resume upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    // Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        // TODO: Call API to save profile
        console.log('Saving profile:', formData);
        setShowProfileForm(false);
    };



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
                                        <button
                                            onClick={() => setShowProfileForm(true)}
                                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Profile
                                        </button>
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

                            {/* Experience Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Experience
                                </h2>
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
                            </div>

                            {/* Education Section */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-white/20">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Education
                                </h2>
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

                                    <button
                                        onClick={() => setShowProfileForm(true)}
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 mx-auto"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Complete Profile Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal for Profile Editing / Upload */}
                    {showProfileForm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">

                            {/* Container */}
                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl w-full max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto overflow-hidden">

                                {/* Header */}
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-3 sm:px-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                                        <button
                                            onClick={() => setShowProfileForm(false)}
                                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Form Content */}
                                <div className="px-6 py-8 sm:px-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                                    <form onSubmit={handleSubmit} className="space-y-8">

                                        {/* Resume Upload Section */}
                                        <div className="bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-2xl p-6 text-center">
                                            <svg className="w-12 h-12 text-indigo-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Resume (Optional)</h3>
                                            <p className="text-sm text-slate-600 mb-4">Let AI auto-fill your profile from your resume</p>
                                            <input
                                                type="file"
                                                id="resume-upload"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleResumeUpload}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="resume-upload"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                        </svg>
                                                        Parsing Resume...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                        Upload Resume
                                                    </>
                                                )}
                                            </label>
                                            {resumeFile && (
                                                <p className="mt-3 text-sm text-green-700 font-medium">✓ {resumeFile.name}</p>
                                            )}
                                        </div>

                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <span className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                                Basic Information
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.fullName}
                                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                        required
                                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        disabled
                                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 bg-slate-50 cursor-not-allowed"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        required
                                                        placeholder="+1 (555) 123-4567"
                                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn Profile</label>
                                                    <input
                                                        type="url"
                                                        value={formData.linkedinUrl}
                                                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                                        placeholder="https://linkedin.com/in/username"
                                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Portfolio / Website</label>
                                                    <input
                                                        type="url"
                                                        value={formData.portfolioUrl}
                                                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                                        placeholder="https://yourportfolio.com"
                                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Experience Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                    <span className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                                    Experience
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addExperience}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Experience
                                                </button>
                                            </div>

                                            {formData.experiences.map((exp, index) => (
                                                <div key={index} className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4 relative">
                                                    {formData.experiences.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExperience(index)}
                                                            className="absolute top-4 right-4 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title *</label>
                                                            <input
                                                                type="text"
                                                                value={exp.jobTitle}
                                                                onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                                                                required
                                                                placeholder="Software Engineer"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Company *</label>
                                                            <input
                                                                type="text"
                                                                value={exp.company}
                                                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                                                required
                                                                placeholder="Tech Corp"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Duration *</label>
                                                            <input
                                                                type="text"
                                                                value={exp.duration}
                                                                onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                                                                required
                                                                placeholder="Jan 2020 - Dec 2022"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                                            <textarea
                                                                value={exp.description}
                                                                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                                                                rows={3}
                                                                placeholder="Brief description of your role and achievements..."
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Education Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                    <span className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                                    Education
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addEducation}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Education
                                                </button>
                                            </div>

                                            {formData.education.map((edu, index) => (
                                                <div key={index} className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4 relative">
                                                    {formData.education.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEducation(index)}
                                                            className="absolute top-4 right-4 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Degree / Qualification *</label>
                                                            <input
                                                                type="text"
                                                                value={edu.degree}
                                                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                                required
                                                                placeholder="B.Tech in Computer Science"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Institution *</label>
                                                            <input
                                                                type="text"
                                                                value={edu.institution}
                                                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                                required
                                                                placeholder="XYZ University"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Year of Completion *</label>
                                                            <input
                                                                type="text"
                                                                value={edu.year}
                                                                onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                                                required
                                                                placeholder="2023"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">CGPA / Percentage *</label>
                                                            <input
                                                                type="text"
                                                                value={edu.grade}
                                                                onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                                                                required
                                                                placeholder="8.5 CGPA or 85%"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Skills Section */}
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <span className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                                Skills
                                            </h3>

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={skillInput}
                                                    onChange={(e) => setSkillInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                                    placeholder="Add a skill (e.g., React, Python)"
                                                    className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addSkill}
                                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {formData.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium"
                                                    >
                                                        {skill}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSkill(skill)}
                                                            className="hover:text-indigo-900"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Projects Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                    <span className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                                    Projects
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={addProject}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Project
                                                </button>
                                            </div>

                                            {formData.projects.map((project, index) => (
                                                <div key={index} className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4 relative">
                                                    {formData.projects.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProject(index)}
                                                            className="absolute top-4 right-4 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Project Title *</label>
                                                            <input
                                                                type="text"
                                                                value={project.title}
                                                                onChange={(e) => updateProject(index, 'title', e.target.value)}
                                                                required
                                                                placeholder="E-commerce Platform"
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                                            <textarea
                                                                value={project.description}
                                                                onChange={(e) => updateProject(index, 'description', e.target.value)}
                                                                rows={3}
                                                                placeholder="Brief description of the project..."
                                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-semibold text-slate-700 mb-2">GitHub URL</label>
                                                                <input
                                                                    type="url"
                                                                    value={project.githubUrl}
                                                                    onChange={(e) => updateProject(index, 'githubUrl', e.target.value)}
                                                                    placeholder="https://github.com/username/repo"
                                                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Live URL</label>
                                                                <input
                                                                    type="url"
                                                                    value={project.liveUrl}
                                                                    onChange={(e) => updateProject(index, 'liveUrl', e.target.value)}
                                                                    placeholder="https://yourproject.com"
                                                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Form Actions */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-6">
                                            <button
                                                type="submit"
                                                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                                            >
                                                Save Profile
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowProfileForm(false)}
                                                className="flex-1 sm:flex-none px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
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