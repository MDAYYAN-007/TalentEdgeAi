// components/Footer.js
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [year, setYear] = useState(2025);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="bg-slate-900 text-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company Info */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-extrabold">
              TE
            </div>
            <div>
              <div className="font-bold text-lg">TalentEdge HRMS</div>
              <div className="text-sm text-slate-400">Modern HR Management Platform</div>
            </div>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            Streamline your hiring process with AI-powered resume scoring,
            automated interviews, and comprehensive candidate management.
          </p>
        </div>

        {/* For Candidates */}
        <div>
          <h4 className="font-semibold mb-3 text-slate-100">For Candidates</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
            <li><Link href="/applications" className="hover:text-white transition-colors">My Applications</Link></li>
            <li><Link href="/tests" className="hover:text-white transition-colors">My Tests</Link></li>
            <li><Link href="/interviews" className="hover:text-white transition-colors">My Interviews</Link></li>
          </ul>
        </div>

        {/* For Organizations */}
        <div>
          <h4 className="font-semibold mb-3 text-slate-100">For Organizations</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/organization/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            <li><Link href="/organization/jobs" className="hover:text-white transition-colors">Manage Jobs</Link></li>
            <li><Link href="/organization/applications" className="hover:text-white transition-colors">Applications</Link></li>
            <li><Link href="/organization/tests" className="hover:text-white transition-colors">Assessment Tests</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
          <div>© {year} TalentEdge HR Management System. All rights reserved.</div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>Built with</span>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">Next.js 14</span>
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">PostgreSQL</span>
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}