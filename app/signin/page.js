'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { signInUser } from "@/actions/auth/signin";
import { getCurrentUser } from "@/actions/auth/auth-utils";
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { logout } from "@/actions/auth/logout";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await signInUser({ email, password });

      if (data.success) {
        router.push("/dashboard");
      } else {
        // Handle different error scenarios
        if (data.message && data.message.includes("No account found")) {
          setError("No account found with this email address");
        } else if (data.message && data.message.includes("verify your email")) {
          setError("Please verify your email before signing in");
        } else if (data.message && data.message.includes("Incorrect password")) {
          setError("Incorrect password. Please try again");
        } else {
          setError(data.message || "Sign in failed. Please try again");
        }
      }
    } catch (err) {
      setLoading(false);
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Checking authentication...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Show "already signed in" component if user exists
  if (user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative flex items-center justify-center px-4 py-12 sm:py-16 lg:py-20">
            <div className="max-w-2xl w-full">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur-2xl opacity-20"></div>

                <div className="relative bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 text-center space-y-8">
                  {/* Success Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>

                  {/* Welcome Message */}
                  <div className="space-y-4">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100/80 backdrop-blur-sm border border-green-200/50 mx-auto">
                      <span className="text-sm font-semibold text-green-700">Welcome Back!</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                      You're Already Signed In
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed">
                      Welcome back, <span className="font-semibold text-slate-900">{user.name || user.email}</span>!
                      You're already signed into your account.
                    </p>

                    {user.orgName && (
                      <p className="text-sm text-slate-500">
                        Organization: <span className="font-medium">{user.orgName}</span>
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="cursor-pointer flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Go to Dashboard
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="cursor-pointer flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out & Sign In Again
                    </button>
                  </div>

                  {/* Additional Options */}
                  <div className="pt-6 border-t border-slate-200/50">
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 text-center">Quick Links:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => router.push("/profile")}
                          className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-all duration-200 bg-white hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-sm hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </button>
                        <button
                          onClick={() => router.push("/jobs")}
                          className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-all duration-200 bg-white hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-sm hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                          </svg>
                          Jobs
                        </button>
                        <button
                          onClick={() => router.push("/applications")}
                          className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-all duration-200 bg-white hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-sm hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Applications
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 mt-6">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Session Active</p>
                        <p className="text-xs text-blue-700">Your session is secure and will remain active for 7 days</p>
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

  // Original sign-in form (only shown if user is not signed in)
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative flex items-center justify-center px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">

              {/* Left: Marketing Content - Centered on mobile */}
              <div className="text-center lg:text-left flex flex-col items-center lg:items-start space-y-6 sm:space-y-8 order-2 lg:order-1">
                {/* Icon Badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>

                <div className="space-y-4">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100/80 backdrop-blur-sm border border-indigo-200/50">
                    <span className="text-sm font-semibold text-indigo-700">Welcome Back!</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="block text-slate-900 leading-tight">Continue Your</span>
                    <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">Career Journey</span>
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Sign in to access your personalized dashboard, track applications, and unlock AI-powered interview preparation tools.
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="w-full max-w-xl space-y-3">
                  {[
                    { icon: '📊', text: 'Track Your Applications', subtext: 'Real-time status updates' },
                    { icon: '🤖', text: 'AI Interview Coach', subtext: 'Practice with instant feedback' },
                    { icon: '💼', text: 'Exclusive Job Listings', subtext: 'Curated opportunities for you' }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 hover:shadow-md text-left"
                    >
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm sm:text-base">{item.text}</p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{item.subtext}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Sign In Form */}
              <div className="w-full max-w-xl mx-auto lg:max-w-none order-1 lg:order-2">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>

                  <div className="relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-3xl shadow-2xl border border-white/20">
                    <div className="space-y-2 mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Sign In</h2>
                      <p className="text-sm sm:text-base text-slate-600">
                        Enter your credentials to access your account
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
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
                        <div className="flex items-center justify-between">
                          <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                            Password
                          </label>
                          <a href="/forgot-password" className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                            Forgot password?
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
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
                      </div>

                      {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4 animate-shake">
                          <div className="flex items-start gap-2">
                            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
                              {error.includes("verify your email") && (
                                <a href="/verify" className="text-xs text-red-600 hover:text-red-700 font-semibold underline mt-1 inline-block">
                                  Go to verification page
                                </a>
                              )}
                              {error.includes("No account found") && (
                                <a href="/signup" className="text-xs text-red-600 hover:text-red-700 font-semibold underline mt-1 inline-block">
                                  Create an account instead
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 sm:py-4 cursor-pointer rounded-xl text-white font-bold shadow-lg transition-all duration-200 flex items-center justify-center text-sm sm:text-base ${loading
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
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6 sm:my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white/80 text-slate-500 font-medium">New to TalentEdge?</span>
                      </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                      <p className="text-sm sm:text-base text-slate-600">
                        Don't have an account?{' '}
                        <a
                          href="/signup"
                          className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1 group"
                        >
                          Create Account
                          <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </p>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50/50 rounded-lg px-4 py-3 border border-slate-200/50">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Your data is protected with enterprise-grade security</span>
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