'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false); // only render inputs after mount
  const [role, setRole] = useState('hr'); // 'hr' or 'candidate'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // mark mounted on client to avoid SSR/DOM mismatch
    setMounted(true);
  }, []);

  function validate() {
    if (!email.trim()) return 'Email is required';
    if (!password) return 'Password is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);

    // Simulate auth delay (demo)
    setTimeout(() => {
      try {
        localStorage.setItem('talentedge_role', role);
        localStorage.setItem('talentedge_user', JSON.stringify({ email, role }));
      } catch (err) {
        // ignore storage errors
      }

      if (role === 'hr') router.push('/dashboard/hr');
      else router.push('/dashboard/candidate');
    }, 700);
  }

  // If not mounted yet, render a minimal server-safe placeholder (no inputs)
  if (!mounted) {
    return (
      <div aria-hidden className="space-y-4">
        <div className="h-4 w-1/3 bg-slate-100 rounded-md" />
        <div className="h-10 bg-slate-100 rounded-md" />
        <div className="h-10 bg-slate-100 rounded-md" />
        <div className="h-10 w-1/2 bg-slate-100 rounded-md" />
      </div>
    );
  }

  // After client mount, render full interactive form (no SSR mismatch)
  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in form">
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Sign in as</legend>
        <div className="mt-2 flex items-center gap-4">
          <label className={`inline-flex items-center px-3 py-2 rounded-lg cursor-pointer ring-1 ${role === 'hr' ? 'ring-indigo-500 bg-indigo-50' : 'ring-slate-100 bg-white'}`}>
            <input
              type="radio"
              name="role"
              value="hr"
              checked={role === 'hr'}
              onChange={() => setRole('hr')}
              className="sr-only"
            />
            <span className="text-sm font-medium text-slate-900">HR / Recruiter</span>
          </label>

          <label className={`inline-flex items-center px-3 py-2 rounded-lg cursor-pointer ring-1 ${role === 'candidate' ? 'ring-indigo-500 bg-indigo-50' : 'ring-slate-100 bg-white'}`}>
            <input
              type="radio"
              name="role"
              value="candidate"
              checked={role === 'candidate'}
              onChange={() => setRole('candidate')}
              className="sr-only"
            />
            <span className="text-sm font-medium text-slate-900">Candidate / Employee</span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 block w-full px-3 py-2 border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 block w-full px-3 py-2 border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {error && <div role="alert" className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-indigo-600 text-white font-medium hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (role === 'hr') {
              setEmail('hr@company.example');
              setPassword('password123');
            } else {
              setEmail('candidate@example.com');
              setPassword('password123');
            }
            setError('');
          }}
          className="text-sm text-slate-600 hover:underline"
        >
          Fill demo creds
        </button>
      </div>

      <p className="text-xs text-slate-500">
        This is a demo sign-in — replace with real auth when ready.
      </p>
    </form>
  );
}
