import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-100 to-emerald-100 opacity-40 blur-3xl transform rotate-12 pointer-events-none" />
          <div className="absolute right-0 -bottom-28 w-96 h-96 rounded-full bg-gradient-to-br from-pink-100 via-indigo-50 to-indigo-100 opacity-30 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900">
                  Hire faster with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-400">AI-powered</span> hiring
                </h1>
                <p className="mt-6 text-lg text-slate-600 max-w-xl">
                  TalentEdge AI automates resume screening, runs smart interviews, and surfaces the best candidates — so your team focuses on the human part.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <a href="/demo" className="inline-flex items-center px-6 py-3 rounded-md bg-indigo-600 text-white font-semibold shadow hover:scale-[1.01] transform transition">
                    Try Demo
                  </a>
                  <a href="/#features" className="inline-flex items-center px-6 py-3 rounded-md border border-slate-200 text-slate-700 bg-white shadow-sm hover:bg-slate-50 transition">
                    Explore Features
                  </a>
                </div>

                <div className="mt-8 flex gap-6 text-sm text-slate-500">
                  <div><strong className="text-slate-900">5k+</strong> employees supported</div>
                  <div><strong className="text-slate-900">70%</strong> faster screening</div>
                </div>
              </div>

              {/* Right card / mock dashboard */}
              <div>
                <div className="rounded-2xl p-6 bg-white shadow-2xl ring-1 ring-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-slate-500">Company</div>
                      <div className="text-lg font-semibold text-slate-900">Acme Corp</div>
                    </div>
                    <div className="text-xs text-slate-400">Live Preview</div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500">Open Roles</div>
                      <div className="font-bold text-xl">12</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500">Avg TtH</div>
                      <div className="font-bold text-xl">21d</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500">AI Match</div>
                      <div className="font-bold text-xl">87%</div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs text-slate-500">Top Shortlisted</div>
                    <ul className="mt-3 space-y-2">
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium">JD</div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">J. Doe</div>
                            <div className="text-xs text-slate-400">Frontend Dev — 92%</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">Shortlisted</div>
                      </li>

                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium">AK</div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">A. Khan</div>
                            <div className="text-xs text-slate-400">Data Scientist — 89%</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">Interview</div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* small note */}
                <p className="mt-3 text-xs text-slate-400">Demo data — values are illustrative.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features preview */}
        <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-slate-900">Core features</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">Everything you need to automate recruiting and HR operations.</p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-indigo-600 mb-3">📄</div>
              <h3 className="font-semibold">AI Resume Screening</h3>
              <p className="text-sm text-slate-500 mt-2">Upload CVs and let the AI rank candidates for role-fit and skills.</p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-indigo-600 mb-3">🎤</div>
              <h3 className="font-semibold">Voice & Chat Interviews</h3>
              <p className="text-sm text-slate-500 mt-2">Automated interviews with transcripts, sentiment and competency scores.</p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-indigo-600 mb-3">📊</div>
              <h3 className="font-semibold">Dashboards & Analytics</h3>
              <p className="text-sm text-slate-500 mt-2">Visualize hiring funnels, attrition risks and performance metrics.</p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-indigo-600 mb-3">🔒</div>
              <h3 className="font-semibold">Role-based Access</h3>
              <p className="text-sm text-slate-500 mt-2">Separate views for HR, Management and Employees with secure access control.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
