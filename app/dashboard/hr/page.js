'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';
import HiringFunnelChart from '@/components/HiringFunnelChart';

export default function HRDashboard() {
  const [candidates] = useState([
    { name: 'J. Doe', role: 'Frontend Dev', match: '92%', status: 'Shortlisted' },
    { name: 'A. Khan', role: 'Data Scientist', match: '89%', status: 'Interview' },
    { name: 'L. Smith', role: 'Backend Dev', match: '85%', status: 'Applied' },
  ]);

  const funnelData = {
    labels: ['Applied', 'Screened', 'Interviewed', 'Hired'],
    datasets: [
      {
        label: 'Candidates',
        data: [120, 80, 50, 12],
        backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EF4444'],
      },
    ],
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">HR Dashboard</h1>

          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">Open Roles</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">12</span>
            </div>
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">Avg Time-to-Hire</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">21d</span>
            </div>
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">AI Match Accuracy</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">87%</span>
            </div>
            <div className="p-6 bg-white rounded-xl shadow flex flex-col">
              <span className="text-sm text-slate-500">Total Candidates</span>
              <span className="text-2xl font-bold text-slate-900 mt-2">120</span>
            </div>
          </div>

          {/* Candidate Table & Funnel Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Candidates</h2>
              <ul className="divide-y divide-slate-200">
                {candidates.map((c, idx) => (
                  <li key={idx} className="flex justify-between py-3 items-center">
                    <div>
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-sm text-slate-500">{c.role} — {c.match}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      c.status === 'Shortlisted' ? 'bg-green-100 text-green-700' :
                      c.status === 'Interview' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Hiring Funnel</h2>
              <div className="h-64">
                <HiringFunnelChart data={funnelData} />
              </div>
            </div>
          </div>

          {/* Quick Actions & Activity Feed ... same as before */}
        </div>
      </main>
      <Footer />
    </>
  );
}
