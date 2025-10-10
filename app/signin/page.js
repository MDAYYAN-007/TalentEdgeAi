import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SignInForm from '../../components/SignInForm';

export const metadata = {
  title: 'Sign In — TalentEdge AI',
  description: 'Sign in as HR or Candidate to view your dashboard.',
};

export default function SignInPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 flex items-center">
        <div className="max-w-4xl mx-auto w-full px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: marketing / benefits */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Welcome back to <span className="text-indigo-600">TalentEdge AI</span>
              </h1>
              <p className="mt-4 text-slate-600">
                Sign in as an HR to manage candidates, run AI screening and schedule interviews. Sign in as a Candidate to apply, track your applications and take AI interviews.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>• HR: Access resume ranking, interview queue, analytics and employee management.</li>
                <li>• Candidate: Upload resume, take AI interviews and track application status.</li>
              </ul>
            </div>

            {/* Right: sign-in form */}
            <div>
              <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
                <p className="mt-1 text-sm text-slate-500">Choose a role and enter your credentials (demo-only).</p>

                <div className="mt-6">
                  <SignInForm />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Demo behavior: form stores the selected role in localStorage and redirects to the role dashboard. No backend call is performed.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
