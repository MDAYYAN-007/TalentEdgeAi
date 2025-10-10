'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [year, setYear] = useState(2025);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="bg-gradient-to-t from-slate-900 to-slate-800 text-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-extrabold">TE</div>
            <div>
              <div className="font-semibold">TalentEdge AI</div>
              <div className="text-sm text-slate-400">AI-driven HR automation — smarter hiring pipelines and insightful analytics.</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">Built for scalability and hackathon-ready. Deploy on Vercel in one click.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-slate-100">Product</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/#features">Features</Link></li>
            <li><Link href="/demo">Demo</Link></li>
            <li><Link href="/docs">Docs</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-slate-100">Company</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/careers">Careers</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between text-sm text-slate-500">
          <div>© {year} TalentEdge AI. All rights reserved.</div>
          <div className="mt-2 sm:mt-0">Made with ❤️ • Built with Next.js & Tailwind</div>
        </div>
      </div>
    </footer>
  );
}
