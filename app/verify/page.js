'use client';

export const dynamic = 'force-dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { verifyOTP } from '@/actions/auth/verify';
import { resendOTP } from '@/actions/auth/resend-otp';

export default function VerifyPage() {
  const searchParams = useParams();
  const router = useRouter();
  const emailFromQuery = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setEmail(emailFromQuery);
  }, [emailFromQuery]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setStatus('Verifying...');
    setError('');

    try {
      const data = await verifyOTP({ email, otp });

      if (data.success) {
        setStatus('Email verified successfully!');

        // Redirect to dashboard - cookies are automatically set
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError(data.message || 'Verification failed');
        setStatus('');
      }
    } catch (err) {
      setError('Verification failed');
      setStatus('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const data = await resendOTP({ email }); // Use your server action
      if (data.success) {
        setStatus('OTP resent successfully. Check your email.');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">

              {/* Left: Info / Marketing - Centered on mobile */}
              <div className="text-center lg:text-left flex flex-col items-center lg:items-start space-y-6 sm:space-y-8">
                {/* Icon Badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="block text-slate-900 leading-tight">Verify Your</span>
                    <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">Email Address</span>
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    We've sent a verification code to your email. Enter it below to complete your signup and unlock access to TalentEdge AI.
                  </p>
                </div>

                {/* Info Cards */}
                <div className="w-full max-w-xl space-y-3">
                  {[
                    { icon: '⏱️', text: 'OTP expires in 5 minutes', subtext: 'Make sure to verify quickly' },
                    { icon: '🔒', text: 'Secure verification process', subtext: 'Your data is protected' },
                    { icon: '🚀', text: 'Start applying immediately', subtext: 'Access jobs right after verification' }
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

              {/* Right: OTP Form */}
              <div className="w-full max-w-xl mx-auto lg:max-w-none">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>

                  <div className="relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-3xl shadow-2xl border border-white/20">
                    <div className="text-center space-y-2 mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Enter Verification Code</h2>
                      <p className="text-sm sm:text-base text-slate-600">
                        Code sent to
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-indigo-900 text-sm sm:text-base">{email}</span>
                      </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          6-Digit Code
                        </label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          required
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 sm:py-4 text-center text-2xl sm:text-3xl font-bold tracking-widest text-slate-900 placeholder-slate-300 bg-white/50 backdrop-blur-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300"
                          placeholder="000000"
                        />
                      </div>

                      {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4 animate-shake">
                          <p className="text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                          </p>
                        </div>
                      )}

                      {status && (
                        <div className="rounded-xl bg-green-50 border border-green-200 p-3 sm:p-4 flex items-center gap-2">
                          <span className="text-green-700 text-sm sm:text-base font-medium flex items-center gap-2">
                            {(verifying || resending) ? (
                              // Spinner only while verifying/resending
                              <svg
                                className="animate-spin w-4 h-4 sm:w-5 sm:h-5"
                                fill="none"
                                stroke="currentColor"
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
                            ) : (
                              // Checkmark for success
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {status}
                          </span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 sm:py-4 rounded-xl text-white font-bold shadow-lg transition-all duration-200 flex items-center justify-center text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verify & Continue
                      </button>
                    </form>

                    {/* Resend Section */}
                    <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-200">
                      <p className="text-center text-sm text-slate-600">
                        Didn't receive the code?
                      </p>
                      <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm">
                        <button
                          onClick={handleResend}
                          disabled={resending}
                          className={`text-indigo-600 hover:text-indigo-700 font-semibold transition-colors inline-flex items-center gap-1 group cursor-pointer ${resending ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                          {resending && (
                            <svg className="animate-spin w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                          )}
                          Resend Code
                        </button>

                        <span className="text-slate-400 hidden sm:inline">or</span>
                        <button className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                          Check Spam Folder
                        </button>
                      </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/50">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        For security reasons, verification codes expire after 5 minutes. If your code has expired, request a new one.
                      </p>
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