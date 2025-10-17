'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { createJob } from '@/actions/jobs/createJob';
import { getRecruiters } from '@/actions/jobs/getRecruiters';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, List, Home, Plus, FileText } from 'lucide-react';

export default function CreateJobPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        title: '',
        department: '',
        location: '',
        job_type: 'Full-time',
        work_mode: 'Remote',
        experience_level: 'Fresher',
        status: 'Active',
        min_salary: '',
        max_salary: '',
        currency: 'INR',
        required_skills: [],
        qualifications: [],
        responsibilities: [],
        job_description: '',
        assigned_recruiters: [],
    });

    const [skillInput, setSkillInput] = useState('');
    const [qualificationInput, setQualificationInput] = useState('');
    const [responsibilityInput, setResponsibilityInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recruiters, setRecruiters] = useState([]);
    const [user, setUser] = useState(null);
    const [lockedRecruiters, setLockedRecruiters] = useState([]);
    const [isAuthorized, setIsAuthorized] = useState(true);

    useEffect(() => {
        // Get user info from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);

                // Check if user is authorized to create jobs
                if (decoded.role === 'user' || decoded.role === 'HR') {
                    setIsAuthorized(false);
                    toast.error('You are not authorized to create jobs. Redirecting...');
                    setTimeout(() => router.push('/dashboard'), 3000);
                    return;
                }

                // Fetch recruiters for the organization
                if (decoded.orgId) {
                    fetchRecruiters(decoded.orgId, decoded.id, decoded.role);
                }
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
    }, [router]);

    const fetchRecruiters = async (orgId, userId, userRole) => {
        try {
            const result = await getRecruiters(orgId, userId, userRole);
            if (result.success) {
                setRecruiters(result.recruiters);

                // Set default selected recruiters
                if (result.defaultSelectedRecruiters && result.defaultSelectedRecruiters.length > 0) {
                    setForm(prev => ({
                        ...prev,
                        assigned_recruiters: result.defaultSelectedRecruiters
                    }));
                }

                // Set locked recruiters
                if (result.lockedRecruiters) {
                    setLockedRecruiters(result.lockedRecruiters);
                }
            } else {
                console.error('Failed to fetch recruiters:', result.message);
            }
        } catch (error) {
            console.error('Error fetching recruiters:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddTag = (key, value, reset) => {
        if (value.trim() !== '') {
            setForm((prev) => ({
                ...prev,
                [key]: [...prev[key], value.trim()],
            }));
            reset('');
        }
    };

    const handleRemoveTag = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: prev[key].filter((v) => v !== value),
        }));
    };

    const handleRecruiterSelect = (e) => {
        const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);

        // Ensure locked recruiters are always included
        const finalSelected = [...new Set([...lockedRecruiters, ...selected])];

        setForm((prev) => ({ ...prev, assigned_recruiters: finalSelected }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Prepare auth data from user token
            const authData = {
                userId: user?.id,
                orgId: user?.orgId,
                userRole: user?.role
            };

            const result = await createJob(form, authData);

            if (result.success) {
                toast.success('Job created successfully!');
                // Reset form or redirect
                setForm({
                    title: '',
                    department: '',
                    location: '',
                    job_type: 'Full-time',
                    work_mode: 'Remote',
                    experience_level: 'Fresher',
                    status: 'Active',
                    min_salary: '',
                    max_salary: '',
                    currency: 'INR',
                    required_skills: [],
                    qualifications: [],
                    responsibilities: [],
                    job_description: '',
                    assigned_recruiters: lockedRecruiters, // Keep locked recruiters on reset
                });
            } else {
                toast.error(result.message || 'Failed to create job.');
            }
        } catch (error) {
            console.error('Job creation error:', error);
            toast.error('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if a recruiter is locked (cannot be unselected)
    const isRecruiterLocked = (recruiterId) => {
        return lockedRecruiters.includes(recruiterId.toString());
    };

    // Action button handlers
    const handleSaveDraft = () => {
        setForm(prev => ({ ...prev, status: 'Draft' }));
        toast.success('Job saved as draft! Click "Create Job" to publish.');
    };

    const handlePreview = () => {
        // In a real app, this would show a preview modal
        toast.success('Preview feature coming soon!');
        console.log('Job Preview:', form);
    };

    const handleClearForm = () => {
        if (confirm('Are you sure you want to clear all form data?')) {
            setForm({
                title: '',
                department: '',
                location: '',
                job_type: 'Full-time',
                work_mode: 'Remote',
                experience_level: 'Fresher',
                status: 'Active',
                min_salary: '',
                max_salary: '',
                currency: 'INR',
                required_skills: [],
                qualifications: [],
                responsibilities: [],
                job_description: '',
                assigned_recruiters: lockedRecruiters,
            });
            setSkillInput('');
            setQualificationInput('');
            setResponsibilityInput('');
            toast.success('Form cleared!');
        }
    };

    // Show unauthorized message if user is not allowed to create jobs
    if (!isAuthorized) {
        return (
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
                                        Only <strong>OrgAdmin</strong> and <strong>SeniorHR</strong> can create job listings.
                                    </p>
                                    <p className="text-sm text-slate-500 mt-2">
                                        HR users can manage applications but cannot create new jobs.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
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
    }

    return (
        <>
            <Toaster />
            <Navbar />
            <div className="flex-1 overflow-y-auto p-6">
                {/* Header Section with Action Buttons */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">

                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Create New Job</h1>
                                <p className="text-slate-600 mt-2">Fill in the details below to post a new job opening.</p>
                            </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => router.push('/organization/jobs')}
                                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-indigo-700 cursor-pointer hover:bg-indigo-50 rounded-xl transition-all duration-200"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Jobs
                            </button>

                            <button
                                onClick={handleClearForm}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-xl font-semibold transition-all"
                            >
                                <FileText className="w-4 h-4" />
                                Clear Form
                            </button>
                        </div>
                    </div>

                    {/* User role info */}
                    {user && (
                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <p className="text-sm text-indigo-800">
                                <strong>Your Role:</strong> {user.role}
                                {user.role === 'OrgAdmin' && ' - You can create jobs and will be automatically assigned as a recruiter'}
                                {user.role === 'SeniorHR' && ' - You can create jobs and will be automatically assigned along with the OrgAdmin'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div
                        onClick={() => router.push('/jobs/organization')}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <List className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">View All Jobs</h3>
                                <p className="text-sm text-slate-600">Browse existing job listings</p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => router.push('/dashboard/organization')}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Home className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Dashboard</h3>
                                <p className="text-sm text-slate-600">Go to main dashboard</p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => router.push('/applications')}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Applications</h3>
                                <p className="text-sm text-slate-600">Manage job applications</p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => window.open('/profile', '_blank')}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Plus className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">My Profile</h3>
                                <p className="text-sm text-slate-600">Update your information</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Senior Software Engineer"
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    placeholder="e.g. Engineering"
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g. San Francisco, CA"
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                            Employment Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Job Type *</label>
                                <select name="job_type" value={form.job_type} onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Internship</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Work Mode</label>
                                <select name="work_mode" value={form.work_mode} onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                    <option>Remote</option>
                                    <option>Onsite</option>
                                    <option>Hybrid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level *</label>
                                <select name="experience_level" value={form.experience_level} onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                    <option>Fresher</option>
                                    <option>Junior</option>
                                    <option>Mid</option>
                                    <option>Senior</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                <select name="status" value={form.status} onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                    <option>Active</option>
                                    <option>Closed</option>
                                    <option>Draft</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Assign Recruiters */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                            Assign Recruiters
                        </h3>

                        {/* Locked recruiters info */}
                        {lockedRecruiters.length > 0 && (
                            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                    <strong>Note:</strong> The following recruiters are required and cannot be removed:
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {lockedRecruiters.map(lockedId => {
                                        const recruiter = recruiters.find(rec => rec.id.toString() === lockedId);
                                        return recruiter ? (
                                            <span
                                                key={lockedId}
                                                className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium"
                                            >
                                                {recruiter.name} ({recruiter.role})
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        <select
                            multiple
                            value={form.assigned_recruiters}
                            onChange={handleRecruiterSelect}
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 h-32"
                        >
                            {recruiters.map((recruiter) => (
                                <option
                                    key={recruiter.id}
                                    value={recruiter.id}
                                    disabled={isRecruiterLocked(recruiter.id)}
                                    className={isRecruiterLocked(recruiter.id) ? 'bg-gray-100 text-gray-800' : ''}
                                >
                                    {recruiter.name} ({recruiter.email}) - {recruiter.role}
                                    {isRecruiterLocked(recruiter.id) && ' 🔒'}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-slate-500 mt-2">
                            Hold Ctrl (Windows) or Cmd (Mac) to select multiple recruiters.
                            Locked recruiters (🔒) are required and cannot be unselected.
                        </p>
                    </div>

                    {/* Salary Range */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                            Salary Range
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Min Salary</label>
                                <input
                                    type="number"
                                    name="min_salary"
                                    value={form.min_salary}
                                    onChange={handleChange}
                                    placeholder="50000"
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Max Salary</label>
                                <input
                                    type="number"
                                    name="max_salary"
                                    value={form.max_salary}
                                    onChange={handleChange}
                                    placeholder="80000"
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                                <select name="currency" value={form.currency} onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                    <option>INR</option>
                                    <option>USD</option>
                                    <option>EUR</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <TagInputSection
                        title="Required Skills"
                        formKey="required_skills"
                        inputValue={skillInput}
                        setInputValue={setSkillInput}
                        handleAddTag={handleAddTag}
                        handleRemoveTag={handleRemoveTag}
                        values={form.required_skills}
                    />

                    {/* Qualifications Section */}
                    <TagInputSection
                        title="Qualifications"
                        formKey="qualifications"
                        inputValue={qualificationInput}
                        setInputValue={setQualificationInput}
                        handleAddTag={handleAddTag}
                        handleRemoveTag={handleRemoveTag}
                        values={form.qualifications}
                    />

                    {/* Responsibilities Section */}
                    <TagInputSection
                        title="Responsibilities"
                        formKey="responsibilities"
                        inputValue={responsibilityInput}
                        setInputValue={setResponsibilityInput}
                        handleAddTag={handleAddTag}
                        handleRemoveTag={handleRemoveTag}
                        values={form.responsibilities}
                    />

                    {/* Job Description */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                            Job Description
                        </h3>
                        <textarea
                            name="job_description"
                            value={form.job_description}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Provide a detailed description of the job..."
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* Submit Button Section */}
                    <div className="pt-6 border-t border-slate-200">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.push('/jobs/organization')}
                                    className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 cursor-pointer text-slate-700 hover:bg-red-300 hover:border-red-300 hover:text-white rounded-xl font-semibold transition-all"
                                >
                                    <ArrowLeft className="" />
                                    Cancel
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'}`}
                            >
                                <Plus className="w-5 h-5" />
                                {isSubmitting ? 'Creating Job...' : 'Create Job'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <Footer />
        </>
    );
}

// TagInputSection component (simplified version)
function TagInputSection({
    title,
    formKey,
    inputValue,
    setInputValue,
    handleAddTag,
    handleRemoveTag,
    values,
}) {
    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                {title}
            </h3>

            <div className="space-y-3">
                {values.length > 0 && (
                    <div className="flex gap-2 flex-wrap p-3 border border-slate-300 rounded-xl min-h-[60px]">
                        {values.map((val) => (
                            <span
                                key={val}
                                className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium"
                            >
                                {val}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(formKey, val)}
                                    className="hover:bg-indigo-200 rounded p-0.5 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18-6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(formKey, inputValue, setInputValue);
                        }
                    }}
                    placeholder={`Type a ${title.toLowerCase()} and press Enter`}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>
    );
}