'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';


export default function CreateJobPage() {
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
    const [recruiters,setRecruiters] = useState([]);

    useEffect(() => {
        
    }, []);

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
        setForm((prev) => ({ ...prev, assigned_recruiters: selected }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Job form submitted:', form);
    };

    return (
        <>
            <Navbar />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Create New Job</h1>
                    <p className="text-slate-600 mt-2">Fill in the details below to post a new job opening.</p>
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
                        <select
                            multiple
                            value={form.assigned_recruiters}
                            onChange={handleRecruiterSelect}
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 h-32"
                        >
                            {recruiters.map((rec) => (
                                <option key={rec} value={rec}>
                                    {rec}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-slate-500 mt-2">Hold Ctrl (Windows) or Cmd (Mac) to select multiple recruiters.</p>
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
                        color="indigo"
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
                        color="green"
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
                        color="amber"
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

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
                        >
                            Create Job
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </>
    );
}

// ---------------- Tag Input Section Component ----------------
function TagInputSection({
    title,
    color,
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
                <span className={`w-1 h-5 bg-gradient-to-b from-${color}-600 to-${color}-400 rounded-full`}></span>
                {title}
            </h3>

            <div className="space-y-3">
                {values.length > 0 && (
                    <div className="flex gap-2 flex-wrap p-3 border border-slate-300 rounded-xl min-h-[60px]">
                        {values.map((val) => (
                            <span
                                key={val}
                                className={`bg-${color}-100 text-${color}-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium`}
                            >
                                {val}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(formKey, val)}
                                    className={`hover:bg-${color}-200 rounded p-0.5 transition-colors`}
                                >
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
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(formKey, inputValue, setInputValue);
                        }
                    }}
                    placeholder={`Type a ${title.toLowerCase()} and press Enter`}
                    className={`w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-${color}-500`}
                />
            </div>
        </div>
    );
}
