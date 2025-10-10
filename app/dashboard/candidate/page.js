'use client'

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';

export default function CandidateDashboard() {
  const [applications] = useState([
    { role: 'Frontend Developer', company: 'Acme Corp', status: 'Interview Scheduled', match: '88%', interviewDate: '12 Oct 2025' },
    { role: 'Data Scientist', company: 'TechSolutions', status: 'AI Screening Completed', match: '92%', interviewDate: 'N/A' },
    { role: 'Backend Developer', company: 'InnovateX', status: 'Application Submitted', match: '85%', interviewDate: 'N/A' },
  ]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Candidate Dashboard</h1>

          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">Total Applications</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">{applications.length}</span>
            </div>
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">AI Match Avg</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">88%</span>
            </div>
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">Interviews Scheduled</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">{applications.filter(a => a.status.includes('Interview')).length}</span>
            </div>
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">Offers Received</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">0</span>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">My Applications</h2>
            <ul className="divide-y divide-slate-200">
              {applications.map((app, idx) => (
                <li key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center py-4">
                  <div>
                    <div className="font-medium text-slate-900">{app.role} @ {app.company}</div>
                    <div className="text-sm text-slate-500">Match: {app.match} | Status: {app.status}</div>
                  </div>
                  {app.interviewDate !== 'N/A' && (
                    <span className="mt-2 md:mt-0 text-sm text-indigo-600 font-medium">Interview: {app.interviewDate}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recommended Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition">
                Take AI Interview
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">
                Upload Resume
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600 transition">
                Update Profile
              </button>
              <button className="px-4 py-2 bg-slate-600 text-white rounded-lg shadow hover:bg-slate-700 transition">
                View Feedback
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <ul className="divide-y divide-slate-200 text-sm text-slate-600">
              <li className="py-2">AI Screening completed for Frontend Developer @ Acme Corp.</li>
              <li className="py-2">Interview scheduled for Data Scientist @ TechSolutions.</li>
              <li className="py-2">Profile updated successfully.</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
