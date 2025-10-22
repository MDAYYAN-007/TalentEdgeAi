'use client';

import { useState, useEffect } from 'react';
import { createOrganization } from '@/actions/organization/create-organization';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast, { Toaster } from 'react-hot-toast';
import { Building2, UserPlus, Loader2, Mail, Info, Crown, Users, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser } from '@/actions/auth/auth-utils';

export default function OrgSignupPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        companySize: '',
        headquartersLocation: ''
    });

    useEffect(() => {
        const checkUserAndRedirect = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    // User is not authenticated - we'll handle this in the UI
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);

                // If user is already an OrgAdmin, we'll show a different component
                if (currentUser.role === 'OrgAdmin') {
                    setIsLoading(false);
                    return;
                }

                // For regular users, continue with the form
                if (currentUser.role === 'User') {
                    // Autofill email (disabled in form)
                    setFormData(prev => ({ ...prev, adminEmail: currentUser.email }));
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkUserAndRedirect();
    }, [router]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.companyName.trim()) {
            setError('Company Name is required.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                createdById: user.id, // ID of the currently logged-in user
                adminEmail: user.email // Email of the currently logged-in user
            };

            const data = await createOrganization(payload);

            if (data.success) {
                toast.success('Organization created! Redirecting to your Admin Dashboard. 🚀');
                router.push('/dashboard/organization');
            } else {
                setError(data.message || "Failed to create organization.");
                toast.error(data.message || "Organization creation failed.");
            }
        } catch (err) {
            console.error("Org creation error:", err);
            setError("A network error occurred. Please check your connection and try again.");
            toast.error("A network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Unauthenticated Component
    const UnauthenticatedComponent = () => (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="max-w-md w-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Authentication Required
                                </h1>
                                <p className="text-slate-600">
                                    You need to be signed in to create an organization.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/signin')}
                                    className="cursor-pointer w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="cursor-pointer w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                >
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );

    // OrgAdmin Component - User is already an organization admin
    const OrgAdminComponent = () => (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4">
                <div className="max-w-2xl w-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/20 text-center space-y-8">
                            {/* Success Icon */}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mx-auto">
                                <Crown className="w-10 h-10 text-white" />
                            </div>

                            {/* Welcome Message */}
                            <div className="space-y-4">
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200/50 mx-auto">
                                    <span className="text-sm font-semibold text-green-700">Organization Admin</span>
                                </div>

                                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                                    Welcome Back, Admin!
                                </h1>

                                <p className="text-lg text-slate-600 leading-relaxed">
                                    You're already an <span className="font-semibold text-green-600">OrgAdmin</span> for your organization.
                                    Access your admin dashboard to manage jobs, recruiters, and applications.
                                </p>

                                {user?.orgName && (
                                    <p className="text-sm text-slate-500">
                                        Organization: <span className="font-medium text-slate-700">{user.orgName}</span>
                                    </p>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="flex w-full gap-2 md:flex-row flex-col justify-center">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 min-w-48">
                                    <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-blue-700">Jobs</div>
                                    <div className="text-sm text-blue-600">Manage Postings</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 min-w-48">
                                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-purple-700">Team</div>
                                    <div className="text-sm text-purple-600">Manage Recruiters</div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 min-w-48">
                                    <Building2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-orange-700">Org</div>
                                    <div className="text-sm text-orange-600">Settings</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => router.push('/dashboard/organization')}
                                    className="cursor-pointer flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    <Briefcase className="w-5 h-5" />
                                    Admin Dashboard
                                </button>

                                <button
                                    onClick={() => router.push('/organization/jobs')}
                                    className="cursor-pointer flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                                >
                                    <Users className="w-5 h-5" />
                                    View Jobs
                                </button>
                            </div>

                            {/* Additional Options */}
                            <div className="pt-6 border-t border-slate-200/50">
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-500">Quick Links:</p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <button
                                            onClick={() => router.push("/organization/create-job")}
                                            className="cursor-pointer px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-all duration-200 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-sm"
                                        >
                                            Create Job
                                        </button>
                                        <button
                                            onClick={() => router.push("/organization/tests")}
                                            className="cursor-pointer px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-all duration-200 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-sm"
                                        >
                                            Manage Tests
                                        </button>
                                        <button
                                            onClick={() => router.push("/organization/applications")}
                                            className="cursor-pointer px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-all duration-200 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-sm"
                                        >
                                            Applications
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Security Note */}
                            <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
                                <div className="flex items-center gap-3 justify-center">
                                    <Crown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Admin Privileges Active</p>
                                        <p className="text-xs text-blue-700">You have full access to manage your organization's hiring process</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );

    if (isLoading) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-lg mx-auto mb-6 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Checking Access
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Verifying your account permissions...
                        </p>
                        <Loader2 className="animate-spin w-8 h-8 text-indigo-600 mx-auto" />
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Show different components based on user role
    if (!user) {
        return <UnauthenticatedComponent />;
    }

    if (user.role === 'OrgAdmin') {
        return <OrgAdminComponent />;
    }

    return (
        <>
            <Toaster />
            <Navbar />
            <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 relative overflow-hidden flex items-center justify-center p-4 py-16">
                <div className="max-w-3xl w-full">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>

                        <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/20">

                            <div className="flex flex-col items-center mb-8 text-center">
                                <Building2 className="w-10 h-10 text-indigo-600 mb-4" />
                                <h1 className="text-3xl font-bold text-slate-900">Establish Your HRMS</h1>
                                <p className="text-slate-600 mt-2">
                                    Register your company to gain <strong>OrgAdmin</strong> access and begin managing your workforce.
                                </p>
                            </div>

                            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                                <Mail className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-yellow-800">Admin Email Locked</p>
                                    <p className="text-sm text-yellow-700">
                                        The Organization Admin email is automatically set to: <strong>{user.email}</strong>.
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        To use a different email, please logout first and create a new user account.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info Section */}
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-indigo-600" /> Organization Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Company Name Field */}
                                        <div className="md:col-span-2">
                                            <label htmlFor="companyName" className="block text-sm font-semibold text-slate-700">
                                                Company Name *
                                            </label>
                                            <input
                                                id="companyName"
                                                type="text"
                                                name="companyName"
                                                value={formData.companyName}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. Innovate HR Solutions"
                                                disabled={isSubmitting}
                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            />
                                        </div>

                                        {/* Industry Field */}
                                        <div>
                                            <label htmlFor="industry" className="block text-sm font-semibold text-slate-700">
                                                Industry
                                            </label>
                                            <input
                                                id="industry"
                                                type="text"
                                                name="industry"
                                                value={formData.industry}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Technology"
                                                disabled={isSubmitting}
                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            />
                                        </div>

                                        {/* Company Size Field */}
                                        <div>
                                            <label htmlFor="companySize" className="block text-sm font-semibold text-slate-700">
                                                Company Size
                                            </label>
                                            <select
                                                id="companySize"
                                                name="companySize"
                                                value={formData.companySize}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-white"
                                            >
                                                <option value="">Select Size</option>
                                                <option value="1-50">1 - 50 employees</option>
                                                <option value="51-200">51 - 200 employees</option>
                                                <option value="201-1000">201 - 1000 employees</option>
                                                <option value="1000+">1000+ employees</option>
                                            </select>
                                        </div>

                                        {/* Headquarters Location Field */}
                                        <div className="md:col-span-2">
                                            <label htmlFor="headquartersLocation" className="block text-sm font-semibold text-slate-700">
                                                Headquarters Location
                                            </label>
                                            <input
                                                id="headquartersLocation"
                                                type="text"
                                                name="headquartersLocation"
                                                value={formData.headquartersLocation}
                                                onChange={handleInputChange}
                                                placeholder="e.g. New York, USA"
                                                disabled={isSubmitting}
                                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-all duration-200 flex items-center justify-center text-base gap-3 ${isSubmitting
                                        ? 'bg-indigo-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5" />
                                            Setting Up HRMS...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-5 w-5" />
                                            Create Organization & Get Admin Access
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                                <p className="text-sm text-slate-600">
                                    <Link
                                        href="/dashboard"
                                        className="font-semibold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                                    >
                                        Go to your user dashboard
                                    </Link> if you only need candidate access.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}