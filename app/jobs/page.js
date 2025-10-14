'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import toast, { Toaster } from 'react-hot-toast';

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [user, setUser] = useState(null); // State to hold decoded user info
    const [isLoading, setIsLoading] = useState(true); // State for initial loading
    const [editingJobId, setEditingJobId] = useState(null); // Tracks the ID of the job being edited
    const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submissions

    const initialFormState = {
        title: '',
        department: '',
        job_type: 'Full-time',
        work_mode: 'Remote',
        location: '',
        min_salary: '',
        max_salary: '',
        currency: 'INR',
        experience_level: 'Junior',
        required_skills: [],
        qualifications: [],
        responsibilities: [],
        job_description: '',
        status: 'Active',
    };

    // Helper to reset the entire modal state (form and editing status)
    const resetModalState = () => {
        setForm(initialFormState);
        setEditingJobId(null);
        setSkillInput('');
        setQualificationInput('');
        setResponsibilityInput('');
        setShowModal(false);
        setIsSubmitting(false);
    };

    const [form, setForm] = useState(initialFormState);
    const [skillInput, setSkillInput] = useState('');
    const [qualificationInput, setQualificationInput] = useState('');
    const [responsibilityInput, setResponsibilityInput] = useState('');

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchJobs = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode(token);
                setUser(decoded);

                const res = await fetch(`/api/jobs?userId=${decoded.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (data.success && data.jobs) {
                    setJobs(data.jobs);
                } else {
                    console.error("Failed to fetch jobs:", data.message);
                }
            } catch (error) {
                console.error("Error loading jobs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, []);

    // --- Form Handlers ---
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddTag = (field, value, setValue) => {
        if (value.trim() && !form[field].includes(value.trim())) {
            setForm({ ...form, [field]: [...form[field], value.trim()] });
            setValue('');
        }
    };

    const handleRemoveTag = (field, tag) => {
        setForm({ ...form, [field]: form[field].filter((t) => t !== tag) });
    };

    // --- Edit Initialization Function ---
    const handleEditClick = (job) => {
        // Prepare data for the form. Ensure salary is string as expected by input type="number"
        // and that arrays exist.
        const jobDataForForm = {
            title: job.title || '',
            department: job.department || '',
            job_type: job.job_type || 'Full-time',
            work_mode: job.work_mode || 'Remote',
            location: job.location || '',
            // Ensure numbers are handled as strings for input[type=number] compatibility
            min_salary: String(job.min_salary || ''),
            max_salary: String(job.max_salary || ''),
            currency: job.currency || 'INR',
            experience_level: job.experience_level || 'Junior',
            required_skills: job.required_skills || [],
            qualifications: job.qualifications || [],
            responsibilities: job.responsibilities || [],
            job_description: job.job_description || '',
            status: job.status || 'Active',
        };

        setForm(jobDataForForm);
        setEditingJobId(job.id); // Set the ID to indicate editing mode
        setShowModal(true);
    };


    // --- Job Submission/Update Logic ---
    const handleSubmit = async () => {
        if (isSubmitting) return; // Prevent multiple submissions
        if (!form.title.trim()) { toast.error('Job title is required'); return; }
        if (!form.job_type) { toast.error('Job type is required'); return; }
        if (!form.experience_level) { toast.error('Experience level is required'); return; }

        const token = localStorage.getItem("token");
        if (!user || !token) {
            toast.error("You must be logged in to post or edit a job.");
            return;
        }

        setIsSubmitting(true); // Set submitting state to true

        const isUpdate = !!editingJobId;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = '/api/jobs';

        try {
            const payload = {
                ...form,
                user_id: user.id, // posted_by ID
                ...(isUpdate && { id: editingJobId }) // Add ID only if updating
            };

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                const responseJob = data.newJob || data.updatedJob;

                if (isUpdate) {
                    // Replace the old job object with the updated one
                    setJobs(jobs.map(job => job.id === editingJobId ? responseJob : job));
                    toast.success('Job updated successfully! ✨');
                } else {
                    // Add the new job to the list
                    setJobs([...jobs, responseJob]);
                    toast.success('Job created successfully! 🎉');
                }

                resetModalState(); // Close modal and reset state
            } else {
                toast.error(data.message || `Failed to ${isUpdate ? 'update' : 'create'} job.`);
            }
        } catch (err) {
            console.error(err);
            toast.error(`Something went wrong during job ${isUpdate ? 'update' : 'creation'}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job?')) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`/api/jobs?jobId=${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await res.json();

            if (data.success) {
                setJobs(jobs.filter(job => job.id !== jobId));
                toast.success('Job deleted successfully.');
            } else {
                toast.error(data.message || 'Failed to delete job.');
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Error deleting job.");
        }
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-indigo-600">Loading jobs...</p>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <Toaster />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-3xl shadow-xl border border-indigo-300/20 p-6 sm:p-8 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white">Manage Jobs</h1>
                                <p className="text-indigo-100 mt-1">Create, edit, and manage all job postings</p>
                            </div>
                            <button
                                // Reset editing state before opening modal for creation
                                onClick={() => { setEditingJobId(null); setForm(initialFormState); setShowModal(true); }}
                                className="flex items-center cursor-pointer gap-2 bg-white hover:bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all border border-white/20"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Job
                            </button>
                        </div>
                    </div>

                    {/* Jobs List */}
                    <div className="space-y-4">
                        {jobs.length === 0 ? (
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-12 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs posted yet</h3>
                                <p className="text-slate-600 mb-6">Get started by creating your first job posting</p>
                                <button
                                    onClick={() => { setEditingJobId(null); setForm(initialFormState); setShowModal(true); }}
                                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Your First Job
                                </button>
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <div key={job.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                                                        {job.department && (
                                                            <>
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                    </svg>
                                                                    {job.department}
                                                                </span>
                                                                <span className="text-slate-400">•</span>
                                                            </>
                                                        )}
                                                        <span>{job.job_type}</span>
                                                        <span className="text-slate-400">•</span>
                                                        <span>{job.work_mode}</span>
                                                        {job.location && (
                                                            <>
                                                                <span className="text-slate-400">•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    {job.location}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {(job.min_salary || job.max_salary) && (
                                                        <div className="mt-3 text-lg font-semibold text-indigo-600">
                                                            {/* Use job.min_salary and job.max_salary directly as they are now strings from the API */}
                                                            {job.currency} {job.min_salary && Number(job.min_salary).toLocaleString()}
                                                            {job.min_salary && job.max_salary && ' - '}
                                                            {job.max_salary && Number(job.max_salary).toLocaleString()}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                                                            {job.experience_level}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${job.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                            job.status === 'Closed' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {job.status}
                                                        </span>
                                                    </div>

                                                    {job.required_skills && job.required_skills.length > 0 && (
                                                        <div className="mt-4">
                                                            <p className="text-sm text-slate-600 font-medium mb-2">Required Skills:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {job.required_skills.map((skill, idx) => (
                                                                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex lg:flex-col gap-2">
                                            <button
                                                onClick={() => handleEditClick(job)} // Attach the edit handler
                                                className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Modal Header (Dynamic Title) */}
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        {editingJobId ? 'Edit Job Posting' : 'Create New Job'}
                                    </h2>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {editingJobId ? 'Modify the details of this job posting.' : 'Fill in the details to post a new job.'}
                                    </p>
                                </div>
                                <button
                                    onClick={resetModalState} // Use reset helper function
                                    className="p-2 text-slate-600 cursor-pointer hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-6">

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
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
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
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
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
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
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
                                                <select
                                                    name="job_type"
                                                    value={form.job_type}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
                                                >
                                                    <option>Full-time</option>
                                                    <option>Part-time</option>
                                                    <option>Internship</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Work Mode</label>
                                                <select
                                                    name="work_mode"
                                                    value={form.work_mode}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
                                                >
                                                    <option>Remote</option>
                                                    <option>Onsite</option>
                                                    <option>Hybrid</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level *</label>
                                                <select
                                                    name="experience_level"
                                                    value={form.experience_level}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
                                                >
                                                    <option>Junior</option>
                                                    <option>Mid</option>
                                                    <option>Senior</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                                <select
                                                    name="status"
                                                    value={form.status}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
                                                >
                                                    <option>Active</option>
                                                    <option>Closed</option>
                                                    <option>Draft</option>
                                                </select>
                                            </div>
                                        </div>
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
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
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
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                                                <select
                                                    name="currency"
                                                    value={form.currency}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    disabled={isSubmitting}
                                                >
                                                    <option>INR</option>
                                                    <option>USD</option>
                                                    <option>EUR</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                            Required Skills
                                        </h3>
                                        <div className="space-y-3">
                                            {form.required_skills.length > 0 && (
                                                <div className="flex gap-2 flex-wrap p-3 border border-slate-300 rounded-xl min-h-[60px]">
                                                    {form.required_skills.map((skill) => (
                                                        <span key={skill} className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
                                                            {skill}
                                                            <button type="button" onClick={() => handleRemoveTag('required_skills', skill)} className="hover:bg-indigo-200 rounded p-0.5 transition-colors">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={skillInput}
                                                onChange={(e) => setSkillInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddTag('required_skills', skillInput, setSkillInput);
                                                    }
                                                }}
                                                placeholder="Type a skill and press Enter"
                                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Qualifications */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                            Qualifications
                                        </h3>
                                        <div className="space-y-3">
                                            {form.qualifications.length > 0 && (
                                                <div className="flex gap-2 flex-wrap p-3 border border-slate-300 rounded-xl min-h-[60px]">
                                                    {form.qualifications.map((qual) => (
                                                        <span key={qual} className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
                                                            {qual}
                                                            <button type="button" onClick={() => handleRemoveTag('qualifications', qual)} className="hover:bg-green-200 rounded p-0.5 transition-colors">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={qualificationInput}
                                                onChange={(e) => setQualificationInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddTag('qualifications', qualificationInput, setQualificationInput);
                                                    }
                                                }}
                                                placeholder="Type a qualification and press Enter"
                                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Responsibilities */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                            Responsibility
                                        </h3>
                                        <div className="space-y-3">
                                            {form.responsibilities.length > 0 && (
                                                <div className="flex gap-2 flex-wrap p-3 border border-slate-300 rounded-xl min-h-[60px]">
                                                    {form.responsibilities.map((res) => (
                                                        <span key={res} className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
                                                            {res}
                                                            <button type="button" onClick={() => handleRemoveTag('responsibilities', res)} className="hover:bg-amber-200 rounded p-0.5 transition-colors">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={responsibilityInput}
                                                onChange={(e) => setResponsibilityInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddTag('responsibilities', responsibilityInput, setResponsibilityInput);
                                                    }
                                                }}
                                                placeholder="Type a responsibility and press Enter"
                                                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

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
                                            placeholder="Provide a detailed description of the job role, expectations, and what makes this opportunity great..."
                                            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer (Dynamic Button Text) */}
                            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                                <button
                                    onClick={resetModalState} // Use reset helper function
                                    className="px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-red-200 cursor-pointer font-semibold text-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting} // Disable when submitting
                                    className={`
                                    px-8 py-3 rounded-xl text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2
                                    ${isSubmitting
                                            ? 'bg-indigo-400 cursor-not-allowed' // Grey out/change color when disabled
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer hover:shadow-xl'
                                        }
                                `}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className={`animate-spin h-5 w-5 text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {editingJobId ? 'Saving...' : 'Creating...'}
                                        </>
                                    ) : (
                                        <>{editingJobId ? 'Save Changes' : 'Create Job'}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
