'use client';

import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decode JWT and get user info
  useEffect(() => {
    // Set a small delay to make the loading state visible for demonstration,
    // in a real app you might remove this.
    const loadingTimer = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // NOTE: 'jwt-decode' is a named import for CJS compatibility
          const decoded = jwtDecode(token);
          setUser({
            name: decoded.name || 'User',
            role: decoded.role || 'user',
          });
        } catch (err) {
          console.error('Invalid token:', err);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    }, 500); // 500ms delay

    return () => clearTimeout(loadingTimer);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Close mobile menu if it was open
    setOpen(false);
    router.push('/signin');
  };

  const Logo = () => (
    <a href="/" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-extrabold shadow-lg">
        TE
      </div>
      <div className="leading-tight">
        <div className="text-lg font-semibold text-slate-900">TalentEdge AI</div>
        <div className="text-xs text-slate-500 -mt-0.5">AI HRMS</div>
      </div>
    </a>
  );

  const UserIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  // New Loading Skeleton Component
  const LoadingSkeleton = () => (
    // 'animate-pulse' is a Tailwind CSS utility for a simple pulsing effect
    <div className="flex items-center space-x-4 animate-pulse">
      {/* Placeholder for user info/button group */}
      <div className="hidden sm:block">
        <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
        <div className="h-3 bg-slate-200 rounded w-16"></div>
      </div>
      {/* Placeholder for the main action button (e.g., Sign Out or Login) */}
      <div className="h-10 w-20 bg-indigo-200 rounded-md shadow-sm"></div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Conditional Rendering based on Loading State and User State */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : user ? (
            /* Signed-In Navbar */
            <div className="flex items-center space-x-4">
              {/* Welcome Text */}
              <div className="hidden sm:flex flex-col items-end leading-none">
                <span className="text-sm font-medium text-slate-900">
                  Welcome, {user.name}!
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  Role: {user.role}
                </span>
              </div>

              {/* Dashboard Button */}
              <button
                className="p-2 cursor-pointer rounded-full text-indigo-600 hover:bg-indigo-50 transition hidden sm:block"
                title="Dashboard"
                onClick={() => router.push('/dashboard')}
              >
                <UserIcon />
              </button>

              {/* Profile Button */}
              <button
                className="px-4 py-2 cursor-pointer bg-slate-100 text-slate-900 rounded-md font-medium shadow hover:bg-slate-200 transition hidden sm:inline-flex"
                title="Profile"
                onClick={() => router.push('/profile')}
              >
                Profile
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="text-sm cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-md font-medium shadow hover:opacity-95 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            /* Signed-Out Navbar (Common pages) */
            <>
              <nav className="hidden md:flex items-center space-x-6">
                <a
                  href="/"
                  className="text-slate-700 hover:text-indigo-600 transition"
                >
                  Home
                </a>
                <a
                  href="/signin"
                  className="ml-2 inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium shadow hover:opacity-95"
                >
                  Signin
                </a>
              </nav>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setOpen((s) => !s)}
                  className="p-2 rounded-md ring-1 ring-slate-200 text-slate-700"
                >
                  {open ? '✖' : '☰'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Dropdown (only when signed out) */}
      {open && !user && (
        <div className="md:hidden bg-white/95 border-t border-slate-200">
          <div className="px-4 py-4 space-y-2">
            <a
              href="/"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50"
            >
              Home
            </a>
            <a
              href="/signin"
              onClick={() => setOpen(false)}
              className="block mt-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-center font-medium"
            >
              SignIn
            </a>
          </div>
        </div>
      )}
    </header>
  );
}