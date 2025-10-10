'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar({ links = null }) {
  const [open, setOpen] = useState(false);

  const defaultLinks = [
    { href: '/', label: 'Home' },
    { href: '/#features', label: 'Features' },
    { href: '/#ai-interview', label: 'AI Interview' },
    { href: '/demo', label: 'Demo' },
    { href: '/docs', label: 'Docs' },
  ];
  const navLinks = links ?? defaultLinks;

  return (
    <header className="backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-400 flex items-center justify-center text-white font-extrabold shadow-lg">
              TE
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">TalentEdge AI</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">Smarter hiring. Faster hires.</div>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition">
                {l.label}
              </Link>
            ))}
            <Link href="/signin" className="ml-2 inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium shadow hover:opacity-95">
              Sign In
            </Link>
          </nav>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
              className="p-2 rounded-md ring-1 ring-slate-200 dark:ring-slate-700"
            >
              {open ? (
                <svg className="w-6 h-6 text-slate-700 dark:text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6 text-slate-700 dark:text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-white/95 dark:bg-slate-900/95">
          <div className="px-4 pb-6 pt-4 space-y-2">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="block px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                {l.label}
              </Link>
            ))}
            <Link href="/signin" className="block mt-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-center font-medium">Sign In</Link>
          </div>
        </div>
      )}
    </header>
  );
}
