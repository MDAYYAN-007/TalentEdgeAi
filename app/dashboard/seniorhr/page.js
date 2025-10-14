'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';

export default function SeniorHRDashboard() {
    const [stats, setStats] = useState({
        totalHRs: 0,
        totalEmployees: 0,
        activeJobs: 0,
        pendingApplications: 0
    });
    const [recentJobs, setRecentJobs] = useState([]);
    const [hrs, setHrs] = useState([]);
    const [user, setUser] = useState({ name: 'Sarah Johnson' });
    const [isLoading, setIsLoading] = useState(true);
    const [showManageHRs, setShowManageHRs] = useState(false);

    useEffect(() => {
        
        setTimeout(() => {
            setStats({
                totalHRs: 12,
                totalEmployees: 247,
                activeJobs: 18,
                pendingApplications: 56
            });
            setRecentJobs([
                { id: 1, title: 'Senior Software Engineer', department: 'Engineering', applicants: 23, postedDate: '2 days ago', status: 'Active' },
                { id: 2, title: 'Product Manager', department: 'Product', applicants: 15, postedDate: '5 days ago', status: 'Active' },
                { id: 3, title: 'UX Designer', department: 'Design', applicants: 31, postedDate: '1 week ago', status: 'Active' },
                { id: 4, title: 'Data Analyst', department: 'Analytics', applicants: 12, postedDate: '1 week ago', status: 'Active' },
                { id: 5, title: 'Marketing Specialist', department: 'Marketing', applicants: 8, postedDate: '2 weeks ago', status: 'Active' }
            ]);
            setHrs([
                { id: 1, name: 'John Smith', email: 'john.smith@company.com', managedEmployees: 32, pendingApps: 8, avatar: 'JS' },
                { id: 2, name: 'Emily Chen', email: 'emily.chen@company.com', managedEmployees: 28, pendingApps: 12, avatar: 'EC' },
                { id: 3, name: 'Michael Brown', email: 'michael.brown@company.com', managedEmployees: 25, pendingApps: 6, avatar: 'MB' },
                { id: 4, name: 'Lisa Anderson', email: 'lisa.anderson@company.com', managedEmployees: 30, pendingApps: 15, avatar: 'LA' }
            ]);
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleViewHRDashboard = (hrId) => {
        console.log(`Viewing HR dashboard for ID: ${hrId}`);
        // In real app: window.location.href = `/hr/${hrId}/dashboard`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-6 text-slate-700 font-semibold text-lg">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">
                                    Welcome back, {user.name}! 👋
                                </h1>
                                <p className="text-slate-600 mt-1">Here's your hiring overview for today</p>
                            </div>
                            <span className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md">
                                Senior HR
                            </span>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 font-medium">Total HRs</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalHRs}</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 font-medium">Total Employees</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalEmployees}</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 font-medium">Active Jobs</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activeJobs}</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 font-medium">Pending Applications</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingApplications}</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Jobs - Takes 2 columns */}
                        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Recent Jobs
                                </h2>
                                <a
                                    href="/manage-jobs"
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Manage Jobs
                                </a>
                            </div>

                            <div className="space-y-3">
                                {recentJobs.map((job) => (
                                    <div key={job.id} className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        {job.department}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{job.postedDate}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-indigo-600">{job.applicants}</p>
                                                    <p className="text-xs text-slate-500">applicants</p>
                                                </div>
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                                                    {job.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions - Takes 1 column */}
                        <div className="space-y-6">
                            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Quick Actions
                                </h2>
                                <div className="space-y-3">
                                    <a
                                        href="/manage-jobs"
                                        className="block p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-lg">Manage Jobs</p>
                                                <p className="text-sm text-indigo-100 mt-1">Create, edit & delete jobs</p>
                                            </div>
                                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </a>

                                    <button
                                        onClick={() => setShowManageHRs(!showManageHRs)}
                                        className="w-full block p-4 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-left">
                                                <p className="font-semibold text-lg">Manage HRs</p>
                                                <p className="text-sm text-blue-100 mt-1">View HR dashboards</p>
                                            </div>
                                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* System Health */}
                            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></span>
                                    Hiring Health
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Application Response Rate</span>
                                        <span className="font-semibold text-green-600">87%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-sm text-slate-600">Avg. Time to Hire</span>
                                        <span className="font-semibold text-indigo-600">12 days</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manage HRs Section */}
                    {showManageHRs && (
                        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full"></span>
                                    HR Team Overview
                                </h2>
                                <button
                                    onClick={() => setShowManageHRs(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hrs.map((hr) => (
                                    <div key={hr.id} className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200 hover:shadow-lg transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                {hr.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 text-lg">{hr.name}</h3>
                                                <p className="text-sm text-slate-600 truncate">{hr.email}</p>
                                                <div className="flex items-center gap-4 mt-3 text-sm">
                                                    <span className="text-slate-600">
                                                        <span className="font-semibold text-slate-900">{hr.managedEmployees}</span> employees
                                                    </span>
                                                    <span className="text-slate-400">•</span>
                                                    <span className="text-amber-600">
                                                        <span className="font-semibold">{hr.pendingApps}</span> pending
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleViewHRDashboard(hr.id)}
                                                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
                                                >
                                                    View Dashboard
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}