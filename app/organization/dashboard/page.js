'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ChevronRight, TrendingUp, Zap, Users, Briefcase, Building2, UserPlus, FileText, Settings, AreaChart, MapPin, ClipboardList, Loader2, LogOut, Mail, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getOrganizationData } from '@/actions/organization/getOrganizationData';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrgAdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [orgData, setOrgData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Initial Authentication and Data Fetch
    useEffect(() => {
        const fetchOrgData = async (userId, orgId, token) => {
            try {
                const authData = {
                    userId: userId,
                    orgId: orgId,
                    userRole: user?.role // Make sure user is set before calling this
                };

                const result = await getOrganizationData(orgId, authData);

                if (result.success && result.organization) {
                    setOrgData(result.organization);
                } else {
                    setError(result.message || "Failed to load organization data.");
                }
            } catch (err) {
                console.error("Org data fetch error:", err);
                setError("Network error while fetching company details.");
            } finally {
                setIsLoading(false);
            }
        };
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log('Decoded JWT:', decoded);
                const currentUser = {
                    id: decoded.id,
                    fullName: decoded.fullName || 'Admin',
                    email: decoded.email,
                    role: decoded.role || 'user',
                    orgId: decoded.orgId,
                };
                setUser(currentUser);

                // Only proceed to fetch data if the user is linked to an organization
                if (currentUser.role === 'OrgAdmin' && currentUser.orgId) {
                    fetchOrgData(currentUser.id, currentUser.orgId, token);
                } else {
                    // Redirect non-admin roles to the general dashboard
                    router.push('/dashboard');
                    console.warn('Access denied: User is not an OrgAdmin or lacks org association. Redirecting to /dashboard.');
                }

            } catch (err) {
                console.error('Invalid token:', err);
                localStorage.removeItem('token');
                router.push('/signin');
            }
        } else {
            router.push('/signin');
        }
    }, [router]);

    // 2. Define Metrics (using fetched data)
    const keyMetrics = useMemo(() => {
        if (!orgData) return [];
        return [
            { title: 'Total Employees', value: orgData.employeesTotal?.toLocaleString() || 'N/A', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { title: 'HR Staff', value: orgData.hrCount || 0, icon: UserPlus, color: 'text-sky-600', bg: 'bg-sky-50' },
            { title: 'Senior HR/Managers', value: orgData.seniorHrCount || 0, icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-50' },
            { title: 'Open Roles', value: orgData.openRoles || 0, icon: Briefcase, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { title: 'Avg Time to Hire', value: orgData.avgTimeToHire ? `${orgData.avgTimeToHire} days` : 'N/A', icon: TrendingUp, color: 'text-pink-600', bg: 'bg-pink-50' },
            { title: 'AI Match Rate', value: orgData.aiMatchSuccessRate ? `${orgData.aiMatchSuccessRate}%` : 'N/A', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ];
    }, [orgData]);

    const quickActions = [
        { title: 'Manage Users', desc: 'Invite or manage roles for HRs and Managers.', icon: UserPlus, href: '/org/users', color: 'bg-purple-500' },
        { title: 'View All Jobs', desc: 'View and manage all job postings.', icon: Briefcase, href: '/organization/jobs', color: 'bg-indigo-500' },
        { title: 'View Analytics', desc: 'Deep dive into hiring performance and trends.', icon: AreaChart, href: '/org/analytics', color: 'bg-emerald-500' },

    ];

    if (isLoading || !user) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                    <div className="relative w-24 h-24 mb-6">
                        {/* Outer Ring: Placeholder for a visual circle/ring effect */}
                        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full opacity-50"></div>

                        {/* Inner Icon Container with Spin */}
                        <div className="absolute inset-0 flex items-center justify-center transform animate-spin-slow">
                            <div className="relative w-16 h-16">
                                {/* The Organization Icon */}
                                <Building2 className="absolute top-0 left-0 w-8 h-8 text-indigo-600 transform -translate-x-1/2 -translate-y-1/2" />

                                {/* The Users Icon (representing the team/employees) */}
                                <Users className="absolute bottom-0 right-0 w-8 h-8 text-purple-600 transform translate-x-1/2 translate-y-1/2" />

                                {/* A small loader for continued movement emphasis */}
                                <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-spin" />
                            </div>
                        </div>

                        {/* A custom keyframe spin that is slower for the whole container */}
                        <style jsx>{`
                    .animate-spin-slow {
                        animation: spin-slow 6s linear infinite;
                    }
                    @keyframes spin-slow {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
                    </div>

                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        Loading Dashboard...
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Securing connection and fetching organization data...
                    </p>
                </div>
                <Footer />
            </>
        );
    }

    // Fallback if data loading failed
    if (error) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center p-20">
                    <div className="text-center bg-red-50 border border-red-200 p-8 rounded-xl shadow-lg max-w-md w-full">
                        <h1 className="text-2xl font-bold text-red-700 mb-4">Error Accessing Organization Data</h1>
                        <p className="text-red-600 mb-6">{error}</p>

                        {/* Reload option - Buttons side by side */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2 justify-center hover:bg-red-600 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Reload Page
                            </button>

                            <button
                                onClick={() => router.push('/signin')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 justify-center hover:bg-red-700 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign In Again
                            </button>
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
            <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
                    <div className="space-y-10">
                        {/* Admin Welcome Header */}
                        <header className="bg-gradient-to-r from-indigo-700 to-purple-700 p-8 rounded-3xl shadow-2xl text-white">
                            <h1 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3">
                                <Building2 className="w-8 h-8" />
                                {orgData?.companyName || 'Loading...'} Admin Console
                            </h1>
                            <p className="mt-2 text-indigo-200 text-lg">
                                You are signed in as **{user.role}**. Manage your company's HR pipeline and metrics.
                            </p>
                        </header>

                        {/* Key Metrics Overview */}
                        <h2 className="text-2xl font-bold text-slate-800">HR Snapshot</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                            {keyMetrics.map((metric, index) => (
                                <div key={index} className={`p-4 sm:p-6 rounded-2xl ${metric.bg} border-l-4 ${metric.color.replace('text-', 'border-')} shadow-lg hover:shadow-xl transition-shadow`}>
                                    <metric.icon className={`w-6 h-6 ${metric.color} mb-2`} />
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium">{metric.title}</p>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{metric.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Actions & Insights Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Quick Actions */}
                            <div className="lg:col-span-2 p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
                                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-purple-600" /> Administrative Quick Links
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {quickActions.map((action, index) => (
                                        <Link
                                            key={index}
                                            href={action.href}
                                            className={`group p-5 rounded-xl text-white shadow-md ${action.color} hover:opacity-95 transition-all flex flex-col justify-between h-full`}
                                        >
                                            <action.icon className="w-6 h-6 mb-2" />
                                            <h4 className="font-bold text-lg">{action.title}</h4>
                                            <p className="text-xs mt-1 opacity-80">{action.desc}</p>
                                            <span className="mt-3 text-sm font-semibold flex items-center">
                                                Go <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Company Profile Card */}
                            <div className="p-6 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Settings className="w-6 h-6 text-slate-600" /> Company Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><MapPin className="w-4 h-4" /> Headquarters</p>
                                            <p className="font-semibold text-slate-900">{orgData?.location || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><FileText className="w-4 h-4" /> Industry</p>
                                            <p className="font-semibold text-slate-900">{orgData?.industry || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><Mail className="w-4 h-4" /> Admin Email</p>
                                            <p className="font-semibold text-slate-900 break-words">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="/org/settings"
                                    className="mt-6 w-full text-center px-4 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
                                >
                                    Edit Company Details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
