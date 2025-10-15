'use client';

import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Mail, Briefcase, ChevronRight, BarChart3, TrendingUp, Zap, Users, ClipboardCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Employee');
  const [message, setMessage] = useState('');

  // JWT decoding logic
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          name: decoded.name || 'User',
          email: decoded.email,
          role: decoded.role || 'Candidate',
        });
      } catch (err) {
        console.error('Invalid token', err);
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Mock data arrays (can be replaced with API calls later)
  const applications = [
    { id: 1, jobTitle: 'Frontend Developer', company: 'NextCorp', status: 'Interview Scheduled', score: 92, lastUpdated: '2 hours ago' },
    { id: 2, jobTitle: 'AI Engineer', company: 'DataFlow', status: 'Screening Complete', score: 84, lastUpdated: '1 day ago' },
    { id: 3, jobTitle: 'Backend Developer', company: 'CloudTech', status: 'Application Submitted', score: 70, lastUpdated: '2 days ago' },
  ];

  const jobs = [
    { id: 1, title: 'Full Stack Developer', match: 95, location: 'Remote', salary: '$120k' },
    { id: 2, title: 'DevOps Engineer', match: 88, location: 'Bengaluru, IN', salary: '$110k' },
    { id: 3, title: 'Technical Writer', match: 75, location: 'Mumbai, IN', salary: '$70k' },
  ];

  const roles = ['Employee', 'HR Recruiter', 'Senior Manager', 'Admin'];

  // Stats
  const total = applications.length;
  const active = applications.filter(a => /Interview|Screening|Submitted/.test(a.status)).length;
  const interviews = applications.filter(a => a.status.includes('Interview')).length;
  const avgScore = total ? (applications.reduce((s, a) => s + a.score, 0) / total).toFixed(0) : 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage('');
    await new Promise(r => setTimeout(r, 1500));
    setMessage(`Promotion request for ${selectedRole} submitted successfully.`);
    setIsSubmitting(false);
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 font-medium text-lg">
        Loading dashboard...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="p-4 md:p-8 lg:p-12 space-y-10">
        {/* Welcome Section */}
        <header className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 md:p-8 rounded-3xl shadow-2xl text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold">Welcome back, {user.name}!</h1>
          <p className="mt-2 text-indigo-100 text-lg">
            Your <strong>{user.role}</strong> Dashboard is ready. Let's track your journey and prepare for success.
          </p>
        </header>

        {/* Role Change */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-start space-x-4">
                <Users className="w-8 h-8 text-indigo-500 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Apply for Promotion or Role Change</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Select your desired internal role to submit a formal promotion application.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full sm:w-60 px-4 py-2.5 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 transition text-slate-700 font-medium"
                >
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-4 p-4 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-medium">
                {message}
              </div>
            )}
          </div>

          {/* AI Coach */}
          <div className="p-6 bg-purple-500 rounded-2xl shadow-xl border border-purple-400 text-white flex flex-col justify-between">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <Zap className="w-6 h-6" /> AI Interview Coach
            </h3>
            <p className="text-purple-100 mt-2 text-sm">
              Practice with personalized AI scenarios based on your applied roles and get instant feedback.
            </p>
            <a
              href="/ai-interview"
              className="mt-4 inline-flex items-center justify-center px-4 py-2.5 text-indigo-700 bg-white font-bold rounded-xl shadow-md hover:bg-indigo-50 transition"
            >
              Start Mock Interview
              <ChevronRight className="w-5 h-5 ml-1" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <h2 className="text-2xl font-bold text-slate-800 pt-6">My Career Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl border-l-4 border-indigo-500 bg-white shadow-xl">
            <p className="text-sm text-slate-500">Average AI Match Score</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{avgScore}%</p>
          </div>
          <div className="p-5 rounded-2xl border-l-4 border-yellow-500 bg-white shadow-xl">
            <p className="text-sm text-slate-500">Total Applications</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{total}</p>
          </div>
          <div className="p-5 rounded-2xl border-l-4 border-emerald-500 bg-white shadow-xl">
            <p className="text-sm text-slate-500">Active Applications</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{active}</p>
          </div>
          <div className="p-5 rounded-2xl border-l-4 border-pink-500 bg-white shadow-xl">
            <p className="text-sm text-slate-500">Interviews Scheduled</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{interviews}</p>
          </div>
        </div>

        {/* Applications + Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-indigo-600" /> Application Tracker ({active} Active)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">AI Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Last Update</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-indigo-50/50 transition">
                      <td className="px-6 py-4 text-sm font-medium">{app.jobTitle}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{app.company}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            app.score >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.score >= 70
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {app.score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{app.status}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{app.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a
              href="/applications"
              className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex justify-end items-center"
            >
              View All History <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" /> Top AI Job Matches
            </h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <h3 className="font-semibold flex justify-between">
                    {job.title}
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full">
                      {job.match}%
                    </span>
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {job.location} · {job.salary}
                  </p>
                  <a
                    href={`/jobs/${job.id}`}
                    className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    View Details <ChevronRight className="w-3 h-3 ml-1" />
                  </a>
                </div>
              ))}
            </div>
            <a
              href="/jobs"
              className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex justify-end items-center"
            >
              Explore All Jobs <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
