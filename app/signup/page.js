'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import { useRouter } from 'next/navigation';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { logout } from '@/actions/auth/logout';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsPageLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const router = useRouter();

  // Password validation checks
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const isPasswordValid = Object.values(passwordChecks).every(check => check);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side password validation
    if (!passwordChecks.minLength) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (!passwordChecks.hasUpperCase) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!passwordChecks.hasNumber) {
      setError("Password must contain at least one number");
      return;
    }
    if (!passwordChecks.hasSymbol) {
      setError("Password must contain at least one symbol (!@#$%^&*...)");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await signupUser({ email, password, firstName, lastName });
      setLoading(false);

      if (data.success) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.message || "Signup failed. Please try again");
      }
    } catch (err) {
      setLoading(false);
      setError("Network error. Please check your connection and try again");
    }
  };

  const features = [
    { name: 'Secure Email Verification', description: 'Protect your account with a reliable multi-step process.' },
    { name: 'Real-time Application Tracking', description: 'Monitor your job applications and progress instantly.' },
    { name: 'AI-Assisted Interviews & Feedback', description: 'Practice and receive actionable insights from our advanced AI.' },
  ];

  if (isPageLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 px-4">
          {/* Spinning loader */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 border-b-4 mb-6"></div>

          {/* Loading text */}
          <p className="text-lg text-slate-700 font-semibold">Loading, please wait...</p>

          {/* Optional subtle animation or background effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (isLoggedIn) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 relative overflow-hidden flex items-center justify-center px-4 py-12">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative max-w-4xl w-full">
            {/* Main Card */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>

              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Top decorative bar */}
                <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"></div>

                <div className="p-8 sm:p-12 lg:p-16 text-center">
                  {/* Success Icon with animation */}
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30 mb-6 animate-bounce-slow">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  {/* Heading */}
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                    Welcome Back! 👋
                  </h2>

                  <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                    You're already logged in and ready to go. Continue to your dashboard to manage your applications and prepare for interviews.
                  </p>

                  {/* Quick Stats or Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
                    <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 hover:border-indigo-200 transition-all hover:shadow-md">
                      <div className="text-3xl mb-2">📊</div>
                      <p className="text-sm font-semibold text-slate-900">Track Applications</p>
                      <p className="text-xs text-slate-600 mt-1">Monitor your progress</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-100 hover:border-purple-200 transition-all hover:shadow-md">
                      <div className="text-3xl mb-2">🤖</div>
                      <p className="text-sm font-semibold text-slate-900">AI Interview Prep</p>
                      <p className="text-xs text-slate-600 mt-1">Practice with AI</p>
                    </div>
                    <div className="p-4 rounded-xl bg-pink-50/80 border border-pink-100 hover:border-pink-200 transition-all hover:shadow-md">
                      <div className="text-3xl mb-2">💼</div>
                      <p className="text-sm font-semibold text-slate-900">New Opportunities</p>
                      <p className="text-xs text-slate-600 mt-1">Explore job listings</p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                      href="/dashboard"
                      className="w-full sm:w-auto group relative px-8 py-4 rounded-xl text-white font-bold shadow-lg transition-all duration-200 flex items-center justify-center text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span className="flex items-center gap-2">
                        Go to Dashboard
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </a>

                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          setIsLoggedIn(false);
                          router.push('/signin');
                        } catch (error) {
                          console.error('Error signing out:', error);
                          router.push('/signin');
                        }
                      }}
                      className="w-full sm:w-auto cursor-pointer px-8 py-4 rounded-xl text-slate-700 font-semibold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out & Login as Different User
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-10 pt-8 border-t border-slate-200">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Your session is secure and active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fun fact or tip box */}
            <div className="mt-6 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 text-center">
              <div className="flex items-start justify-center gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">Pro Tip</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Complete your profile to get better job recommendations and increase your chances of landing interviews!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
          @keyframes bounce-slow {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
        `}</style>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative pt-16 pb-12 sm:pt-24 sm:pb-20 lg:pt-28 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-12 lg:gap-20">

              {/* Left: Marketing / Benefits - Centered on mobile/tablet */}
              <div className="lg:col-span-3 space-y-6 sm:space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start">
                <div className="space-y-4 max-w-3xl">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100/80 backdrop-blur-sm border border-indigo-200/50">
                    <span className="text-sm font-semibold text-indigo-700">Join 10,000+ Candidates</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                    <span className="block text-slate-900 leading-tight">Elevate Your</span>
                    <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">Career Journey</span>
                  </h1>

                  <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Sign up as a Candidate to access exclusive job listings, manage your applications effortlessly, and prepare for success with our AI-powered interview platform.
                  </p>
                </div>

                {/* Features Section - Better responsive layout */}
                <div className="space-y-6 pt-4 w-full max-w-3xl">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center justify-center lg:justify-start gap-2">
                    <span className="w-1 h-6 sm:h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                    What You Get
                  </h3>

                  <div className="grid gap-4 sm:gap-5">
                    {features.map((feature, index) => (
                      <div
                        key={feature.name}
                        className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:border-indigo-300/50 hover:bg-white/80 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 text-left"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="relative">
                            <CheckCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
                            <div className="absolute inset-0 bg-indigo-600/20 blur-md rounded-full group-hover:bg-indigo-600/30 transition-all"></div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-base sm:text-lg">{feature.name}</p>
                          <p className="text-slate-600 mt-1 text-sm sm:text-base">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Signup form - Full width on mobile, constrained on desktop */}
              <div className="lg:col-span-2 w-full max-w-xl mx-auto lg:max-w-none">
                <div className="relative">
                  {/* Glow effect behind card */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>

                  <div className="relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-3xl shadow-2xl border border-white/20">
                    <div className="space-y-2 mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Account</h2>
                      <p className="text-sm sm:text-base text-slate-600">
                        Enter your details to get started
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          placeholder="John"
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          placeholder="Doe"
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900"
                        />
                      </div>

                      {/* Email Field */}
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-white/50 backdrop-blur-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                        />
                      </div>

                      {/* Password Field */}
                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocus(true)}
                            required
                            placeholder="Create a strong password"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 sm:py-3 pr-12 text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-white/50 backdrop-blur-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                          />
                          <button
                            type="button"
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <AiOutlineEyeInvisible className="h-5 w-5" /> : <AiOutlineEye className="h-5 w-5" />}
                          </button>
                        </div>

                        {/* Password Requirements */}
                        {(passwordFocus || password.length > 0) && (
                          <div className="mt-3 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Password must contain:</p>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs">
                                {passwordChecks.minLength ? (
                                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className={passwordChecks.minLength ? 'text-green-700 font-medium' : 'text-slate-600'}>
                                  At least 8 characters
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                {passwordChecks.hasUpperCase ? (
                                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className={passwordChecks.hasUpperCase ? 'text-green-700 font-medium' : 'text-slate-600'}>
                                  One uppercase letter (A-Z)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                {passwordChecks.hasNumber ? (
                                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className={passwordChecks.hasNumber ? 'text-green-700 font-medium' : 'text-slate-600'}>
                                  One number (0-9)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                {passwordChecks.hasSymbol ? (
                                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className={passwordChecks.hasSymbol ? 'text-green-700 font-medium' : 'text-slate-600'}>
                                  One symbol (!@#$%^&*...)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirm-password"
                            type={showConfirm ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            placeholder="Re-enter your password"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 sm:py-3 pr-12 text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-white/50 backdrop-blur-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                          />
                          <button
                            type="button"
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            onClick={() => setShowConfirm(!showConfirm)}
                            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                          >
                            {showConfirm ? <AiOutlineEyeInvisible className="h-5 w-5" /> : <AiOutlineEye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4">
                          <p className="text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                          </p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 sm:py-4 rounded-xl text-white font-bold shadow-lg transition-all duration-200 flex items-center justify-center text-sm sm:text-base ${loading
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0'
                          }`}
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5 mr-3 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            Send Verification Code
                            <svg className="ml-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-200">
                      <p className="text-center text-sm sm:text-base text-slate-600">
                        Already have an account?{' '}
                        <a
                          href="/signin"
                          className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1 group"
                        >
                          Sign In
                          <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-xs text-slate-500 bg-slate-50/50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200/50">
                      <svg className="h-4 w-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>A verification code will be sent to your email</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}