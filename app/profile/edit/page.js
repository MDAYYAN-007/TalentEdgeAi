'use client';

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { parseResume } from '@/actions/resume/parseResume';
import { getProfile } from '@/actions/profile/getProfile';
import { saveProfile } from '@/actions/profile/saveProfile';
import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { Plus, X, Trash2, Loader2, Github, BookOpen, Briefcase, User, Phone, Linkedin, Globe, GraduationCap, Zap, UploadCloud } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";

export default function ProfileEditPages() {

    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('upload');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [skillInput, setSkillInput] = useState('');
    const router = useRouter();

    const initialFormData = {
        fullName: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        portfolioUrl: '',
        experiences: [],
        education: [],
        skills: [],
        projects: []
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
                console.log("Decoded JWT:", decoded);

                // Set email & fullName initially
                setFormData(prev => ({
                    ...prev,
                    name: decoded.name || prev.name,
                    email: decoded.email || prev.email,
                }));

                // Fetch profile using server action
                const data = await getProfile(decoded.id);

                if (data.success && data.profile) {
                    const profile = data.profile;

                    setFormData(prev => ({
                        ...prev,
                        phone: profile.phone || "",
                        linkedinUrl: profile.linkedin_url || "",
                        portfolioUrl: profile.portfolio_url || "",
                        resumeUrl: profile.resume_url || "",
                        experiences: profile.experiences || [],
                        education: profile.education || [],
                        skills: profile.skills || [],
                        projects: profile.projects || [],
                    }));
                } else {
                    console.warn("No existing profile found for user");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            }
        };

        fetchProfile();
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const updateNestedArray = (arrayName, index, field, value) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addNestedItem = (arrayName, newItem) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: [...prev[arrayName], newItem]
        }));
    };

    const removeNestedItem = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }));
    };

    const addSkill = () => {
        const skill = skillInput.trim();
        if (skill && !formData.skills.includes(skill)) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
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

                console.log("Parsed Data:", parsed);
                console.log("Raw Affinda Response:", data.raw);

                // Auto-fill your form fields from Affinda's parsed data
                setFormData(prev => ({
                    ...prev,
                    name: parsed.name || prev.name,
                    email: parsed.email || prev.email,
                    phone: parsed.phone || prev.phone,
                    linkedinUrl: parsed.linkedinUrl || prev.linkedinUrl,
                    portfolioUrl: parsed.portfolioUrl || prev.portfolioUrl,
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
                toast.success("Resume parsed successfully!");
            } else {
                console.log("Raw Affinda Response:", data.raw);
                toast.error(data.message || "Failed to parse resume. Fill manually.");
            }
        } catch (err) {
            console.error("Resume parsing error:", err);
            toast.error("Error uploading resume");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        if (!formData.name.trim()) {
            toast.error("Full Name is required.");
            setActiveTab("basic");
            setIsSaving(false);
            return;
        }

        if (!formData.phone.trim()) {
            toast.error("Phone number is required.");
            setActiveTab("basic");
            setIsSaving(false);
            return;
        }

        const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
            toast.error("Please enter a valid phone number.");
            setActiveTab("basic");
            setIsSaving(false);
            return;
        }

        if (!formData.skills.length) {
            toast.error("Please add at least one skill.");
            setActiveTab("skills");
            setIsSaving(false);
            return;
        }

        if (formData.experiences.length > 0) {
            for (const exp of formData.experiences) {
                if (!exp.jobTitle || !exp.company || !exp.duration) {
                    toast.error("Please fill all required fields in Experience.");
                    setActiveTab("experience");
                    setIsSaving(false);
                    return;
                }
            }
        }

        if (formData.education.length > 0) {
            for (const edu of formData.education) {
                if (!edu.degree || !edu.institution) {
                    toast.error("Please fill all required fields in Education.");
                    setActiveTab("education");
                    setIsSaving(false);
                    return;
                }
            }
        }

        if (formData.projects.length > 0) {
            for (const proj of formData.projects) {
                if (!proj.title || !proj.description) {
                    toast.error("Please fill all required fields in Projects.");
                    setActiveTab("projects");
                    setIsSaving(false);
                    return;
                }
            }
        }

        const data = {
            userId: user?.id,
            email: formData.email,
            name: formData.name,
            role: user?.role || 'user',
            phone: formData.phone,
            linkedinUrl: formData.linkedinUrl,
            portfolioUrl: formData.portfolioUrl,
            resumeUrl: formData.resumeUrl,
            experiences: formData.experiences,
            education: formData.education,
            skills: formData.skills,
            projects: formData.projects
        };

        try {
            const result = await saveProfile(data);

            if (result.success) {
                localStorage.setItem("token", result.token);
                router.push('/profile');
                toast.success("Profile saved successfully!");
            } else {
                console.error('Error saving profile:', result);
                toast.error(result.message || 'Failed to save profile.');
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            toast.error('Something went wrong while saving profile.');
        } finally {
            setIsSaving(false);
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

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="bg-slate-50 min-h-[calc(100vh-120px)] pb-12">

                {/* Dedicated Page Header */}
                <div className="bg-gradient-to-r from-indigo-700 to-purple-700 py-10 px-4 sm:px-6 lg:px-8 shadow-xl">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-4xl font-extrabold text-white">Edit Your Profile ✏️</h1>
                        <p className="mt-2 text-xl text-indigo-200">Manage your resume, experience, education, and skills.</p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">

                        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">

                            {/* Sidebar/Tab Navigation */}
                            <div className="lg:w-1/4 p-6 bg-slate-50 border-b lg:border-r border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Profile Sections</h3>
                                <nav className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2 lg:space-x-0">
                                    {tabData.map(({ key, label, Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setActiveTab(key)}
                                            className={`flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === key
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                                                : 'text-slate-700 hover:bg-slate-400'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="hidden sm:inline">{label}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Form Content */}
                            <div className="lg:w-3/4 p-8 space-y-10">

                                {/* --- Tab Content Rendering --- */}
                                <div>
                                    {/* 1. Upload Resume Tab */}
                                    {activeTab === 'upload' && (
                                        <div className="space-y-8">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-2"><UploadCloud className="w-5 h-5 text-indigo-600" /> Resume Upload (AI Auto-Fill)</h3>
                                            <div className="bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center">
                                                <p className="text-xs text-indigo-500 font-semibold uppercase mb-1">Step 1: Get Started Quickly</p>
                                                <h3 className="text-xl font-semibold text-slate-900 mb-2 mt-4">Upload Your CV or Resume</h3>
                                                <p className="text-base text-slate-600 mb-6">Our AI will parse your document (PDF, DOCX) to instantly populate your sections.</p>

                                                <input
                                                    type="file"
                                                    id="resume-upload"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={handleResumeUpload}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="resume-upload"
                                                    className={`inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold transition-all cursor-pointer ${isUploading ? 'opacity-70 cursor-wait' : 'hover:bg-indigo-700 shadow-lg hover:shadow-xl'}`}
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Loader2 className="animate-spin h-5 w-5" />
                                                            Parsing Resume...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadCloud className="w-5 h-5" />
                                                            Select File to Upload
                                                        </>
                                                    )}
                                                </label>

                                                {resumeFile && (
                                                    <p className="mt-4 text-sm font-medium text-slate-900">
                                                        File selected: <span className="text-green-700 font-semibold">{resumeFile.name}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="p-4 bg-slate-100 rounded-xl text-slate-700">
                                                <p className="font-semibold">Tip:</p>
                                                <p className="text-sm">If you skip upload, click the **"Basic Info"** tab to start filling the form manually.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Basic Info Tab */}
                                    {activeTab === 'basic' && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-2"><User className="w-5 h-5 text-indigo-600" /> Personal Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Full Name */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                </div>
                                                {/* Email */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                                    <input type="email" name="email" value={formData.email} disabled className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 bg-slate-50 cursor-not-allowed" />
                                                </div>
                                                {/* Phone Number */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 123-4567" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                    </div>
                                                </div>
                                                {/* LinkedIn */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn Profile</label>
                                                    <div className="relative">
                                                        <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleInputChange} placeholder="https://linkedin.com/in/username" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                    </div>
                                                </div>
                                                {/* Portfolio */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Portfolio / Website</label>
                                                    <div className="relative">
                                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input type="url" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleInputChange} placeholder="https://yourportfolio.com" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Skills Tab */}
                                    {activeTab === 'skills' && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-2"><Zap className="w-5 h-5 text-indigo-600" /> Technical Skills</h3>

                                            <div className="space-y-4">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={skillInput}
                                                        onChange={(e) => setSkillInput(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                                        placeholder="Type a skill and press Enter or Add (e.g., React, Python)"
                                                        className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addSkill}
                                                        className="px-6 py-2.5 cursor-pointer bg-indigo-600 text-white rounded-xl hover:bg-indigo-800 transition-colors font-semibold"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 min-h-[40px] p-1">
                                                    {formData.skills.map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium transition-all duration-150"
                                                        >
                                                            {skill}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSkill(skill)}
                                                                className="text-indigo-500 cursor-pointer hover:text-indigo-900 p-0.5 rounded-full hover:bg-indigo-200 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    {formData.skills.length === 0 && (
                                                        <p className="text-sm text-slate-500 italic">No skills added yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Education Tab */}
                                    {activeTab === 'education' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600" /> Education</h3>

                                                <button
                                                    type="button"
                                                    onClick={() => addNestedItem('education', { degree: '', institution: '', year: '', grade: '' })}
                                                    className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                                                >
                                                    <Plus className="w-5 h-5" /> Add Degree
                                                </button>


                                            </div>

                                            {formData.education.map((edu, index) => (
                                                <div key={index} className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
                                                    {formData.education.length > 1 &&
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNestedItem('education', index)}
                                                            className="absolute cursor-pointer top-4 right-4 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors z-10"
                                                            aria-label="Remove item"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    }
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Degree */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Degree / Qualification *</label>
                                                            <input type="text" value={edu.degree} onChange={(e) => updateNestedArray('education', index, 'degree', e.target.value)} placeholder="B.Tech in Computer Science" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                        {/* Institution */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Institution *</label>
                                                            <input type="text" value={edu.institution} onChange={(e) => updateNestedArray('education', index, 'institution', e.target.value)} placeholder="XYZ University" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                        {/* Year */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Year of Completion *</label>
                                                            <input type="text" value={edu.year} onChange={(e) => updateNestedArray('education', index, 'year', e.target.value)} placeholder="2023" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                        {/* Grade */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">CGPA / Percentage *</label>
                                                            <input type="text" value={edu.grade} onChange={(e) => updateNestedArray('education', index, 'grade', e.target.value)} placeholder="8.5 CGPA or 85%" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.education.length === 0 && (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                                                    <p className="text-base italic">Click 'Add Degree' to list your academic qualifications.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 5. Experience Tab */}
                                    {activeTab === 'experience' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-600" /> Experience</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => addNestedItem('experiences', { jobTitle: '', company: '', duration: '', description: '' })}
                                                    className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                                                >
                                                    <Plus className="w-5 h-5" /> Add Job
                                                </button>
                                            </div>

                                            {formData.experiences.map((exp, index) => (
                                                <div key={index} className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4 relative shadow-sm hover:shadow-md transition-shadow">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNestedItem('experiences', index)}
                                                        className="absolute cursor-pointer top-4 right-4 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors z-10"
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Job Title */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title *</label>
                                                            <input type="text" value={exp.jobTitle} onChange={(e) => updateNestedArray('experiences', index, 'jobTitle', e.target.value)} placeholder="Software Engineer" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                        {/* Company */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Company *</label>
                                                            <input type="text" value={exp.company} onChange={(e) => updateNestedArray('experiences', index, 'company', e.target.value)} placeholder="Tech Corp" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                        {/* Duration */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Duration *</label>
                                                            <input type="text" value={exp.duration} onChange={(e) => updateNestedArray('experiences', index, 'duration', e.target.value)} placeholder="Jan 2020 - Dec 2022" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                        {/* Description */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                                            <textarea value={exp.description} onChange={(e) => updateNestedArray('experiences', index, 'description', e.target.value)} rows={3} placeholder="Brief description of your role and achievements..." className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.experiences.length === 0 && (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                                                    <p className="text-base italic">Click 'Add Job' to list your professional experience.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 6. Projects Tab */}
                                    {activeTab === 'projects' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-600" /> Portfolio Projects</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => addNestedItem('projects', { title: '', description: '', githubUrl: '', liveUrl: '' })}
                                                    className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                                                >
                                                    <Plus className="w-5 h-5" /> Add Project
                                                </button>
                                            </div>

                                            {formData.projects.map((project, index) => (
                                                <div key={index} className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4 relative shadow-sm hover:shadow-md transition-shadow">

                                                    <button
                                                        type="button"
                                                        onClick={() => removeNestedItem('projects', index)}
                                                        className="absolute cursor-pointer top-4 right-4 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors z-10"
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                    <div className="space-y-4">
                                                        {/* Project Title */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Project Title *</label>
                                                            <input type="text" value={project.title} onChange={(e) => updateNestedArray('projects', index, 'title', e.target.value)} required placeholder="E-commerce Platform" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                                                        </div>
                                                        {/* Description */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
                                                            <textarea value={project.description} onChange={(e) => updateNestedArray('projects', index, 'description', e.target.value)} rows={3} placeholder="Brief description of the project..." className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" />
                                                        </div>
                                                        {/* URLs */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* GitHub URL */}
                                                            <div>
                                                                <label className="block text-sm font-semibold text-slate-700 mb-2">GitHub URL</label>
                                                                <div className="relative">
                                                                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                                    <input type="url" value={project.githubUrl} onChange={(e) => updateNestedArray('projects', index, 'githubUrl', e.target.value)} placeholder="https://github.com/username/repo" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                                </div>
                                                            </div>
                                                            {/* Live URL */}
                                                            <div>
                                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Live URL</label>
                                                                <div className="relative">
                                                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                                    <input type="url" value={project.liveUrl} onChange={(e) => updateNestedArray('projects', index, 'liveUrl', e.target.value)} placeholder="https://yourproject.com" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-11" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.projects.length === 0 && (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                                                    <p className="text-base italic">Click 'Add Project' to showcase your work.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="pt-8 border-t border-slate-200">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className={`cursor-pointer text-white text-lg flex-1 py-3 rounded-xl font-bold transition-all duration-200 ${isSaving ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-0.5'}`}
                                        >
                                            {isSaving ? 'Saving...' : 'Save Profile'}
                                        </button>

                                        <Link
                                            href="/profile"
                                            className="flex-1 sm:flex-none px-8 py-4 border-2 border-red-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                                        >
                                            Go Back
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}