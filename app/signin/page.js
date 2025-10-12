'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
    setIsPageLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setLoading(false);
        setError("Server error. Please try again later or contact support");
        console.error("API returned non-JSON response");
        return;
      }

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        // Handle different error scenarios
        if (res.status === 404) {
          setError("No account found with this email address");
        } else if (res.status === 401) {
          if (data.message && data.message.includes("not verified")) {
            setError("Please verify your email before signing in");
          } else {
            setError("Incorrect password. Please try again");
          }
        } else {
          setError(data.message || "Sign in failed. Please try again");
        }
      }
    } catch (err) {
      setLoading(false);
      console.error("Login error:", err);
      if (err.name === 'SyntaxError') {
        setError("Server configuration error. Please contact support");
      } else {
        setError("Network error. Please check your connection and try again");
      }
    }
  };

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
                      onClick={() => {
                        localStorage.removeItem('token');
                        window.location.reload();
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