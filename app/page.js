import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AiOutlineDashboard, AiOutlineUser, AiOutlineTeam } from "react-icons/ai";
import { GiArtificialIntelligence } from "react-icons/gi";
import { MdAnalytics, MdOutlineSupportAgent } from "react-icons/md";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32 flex flex-col lg:flex-row items-center gap-12">

            <div className="lg:w-1/2 text-center lg:text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white">
                Transform HR with{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-green-200">
                  AI-powered
                </span>{' '}
                Automation
              </h1>
              <p className="text-lg text-indigo-100 max-w-xl">
                Streamline recruiting, performance tracking, payroll, and attendance — all in one smart HRMS platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-6">
                <a
                  href="/login"
                  className="inline-flex items-center px-6 py-3 rounded-md bg-white text-indigo-700 font-semibold shadow-lg hover:scale-105 transform transition"
                >
                  Get Started
                </a>
                <a
                  href="/#features"
                  className="inline-flex items-center px-6 py-3 rounded-md border border-white text-white hover:bg-white hover:text-indigo-700 transition"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:w-1/2">
              <div className="rounded-3xl p-6 bg-white shadow-2xl ring-1 ring-slate-200">
                <div className="text-center text-slate-800 font-medium mb-6">Live Dashboard Preview</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg text-center hover:scale-105 transform transition">
                    <div className="text-xl font-bold">12</div>
                    <div className="text-sm text-slate-500">Open Roles</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg text-center hover:scale-105 transform transition">
                    <div className="text-xl font-bold">87%</div>
                    <div className="text-sm text-slate-500">AI Match</div>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg text-center hover:scale-105 transform transition">
                    <div className="text-xl font-bold">21d</div>
                    <div className="text-sm text-slate-500">Avg Time to Hire</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center hover:scale-105 transform transition">
                    <div className="text-xl font-bold">5k+</div>
                    <div className="text-sm text-slate-500">Employees Supported</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
        {/* Features Section */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-6 lg:px-8 py-24 bg-gradient-to-b from-indigo-50 via-white to-indigo-100 border-t border-slate-200"
        >
          <h2 className="text-3xl font-bold text-slate-900 text-center">Core Features</h2>
          <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
            All-in-one HRMS functionalities powered by AI for modern workplaces.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <GiArtificialIntelligence className="text-indigo-600" />, title: "AI Resume Screening", desc: "Automatically parse and rank resumes for skills and role-fit." },
              { icon: <AiOutlineDashboard className="text-emerald-500" />, title: "Dashboards & Analytics", desc: "Visualize hiring trends, attendance stats, and performance insights." },
              { icon: <AiOutlineTeam className="text-pink-500" />, title: "Team & Performance", desc: "Managers track attendance, assign tasks, and review performance." },
              { icon: <AiOutlineUser className="text-yellow-500" />, title: "Role-based Access", desc: "Separate views for HR, Management, and Employees with secure permissions." },
              { icon: <MdOutlineSupportAgent className="text-purple-500" />, title: "AI Helpdesk", desc: "Employees can ask HR queries via AI chatbot reducing HR workload." },
              { icon: <MdAnalytics className="text-red-500" />, title: "Hiring Insights", desc: "Analyze candidate success ratios, trends, and AI scoring stats." },
              { icon: <AiOutlineDashboard className="text-teal-500" />, title: "Attendance Tracking", desc: "Real-time employee attendance monitoring for teams and company-wide." },
              { icon: <GiArtificialIntelligence className="text-fuchsia-500" />, title: "Voice & Chat Interviews", desc: "Automated AI interviews with scoring, transcripts, and insights." },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-2 hover:scale-105">
                <div className="text-3xl mb-4 mx-auto">{feature.icon}</div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-gradient-to-br from-white via-indigo-50 to-slate-100 py-24 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 text-center">
              How It Works
            </h2>
            <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
              From AI-powered hiring to smart employee management, here’s how TalentEdge AI transforms HR operations.
            </p>

            <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { step: "1", color: "bg-indigo-100 text-indigo-600", title: "Register & Assign Roles", desc: "HR, Management, and Employees get role-based access via secure login." },
                { step: "2", color: "bg-emerald-100 text-emerald-600", title: "AI Resume Screening", desc: "Upload resumes, and AI shortlists candidates based on skills & match scores." },
                { step: "3", color: "bg-pink-100 text-pink-600", title: "Smart Interview", desc: "AI chatbot conducts interviews and evaluates responses automatically." },
                { step: "4", color: "bg-yellow-100 text-yellow-600", title: "Management Insights", desc: "Dashboard shows analytics and hiring performance." },
                { step: "5", color: "bg-indigo-100 text-indigo-600", title: "Employee Portal", desc: "Employees track attendance, salary slips, and feedback seamlessly." },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center bg-white p-6 rounded-xl shadow hover:shadow-lg transition hover:-translate-y-2">
                  <div className={`w-14 h-14 flex items-center justify-center rounded-full ${item.color} text-2xl font-bold mb-4`}>{item.step}</div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900">What Our Clients Say</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              HR teams love how simple and intelligent TalentEdge AI makes their workflow.
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  name: "Ravi Kumar",
                  role: "HR Manager, FinEdge",
                  quote: "TalentEdge AI cut our hiring time by 40%. The AI matching is incredibly accurate.",
                },
                {
                  name: "Ananya Rao",
                  role: "CTO, NextTech",
                  quote: "The analytics dashboard helps us track productivity in real-time. Game changer!",
                },
                {
                  name: "Suresh Mehta",
                  role: "CEO, SmartWorks",
                  quote: "Our onboarding process has become seamless. AI-based automation saves so much time.",
                },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition text-slate-700">
                  <p className="italic">“{t.quote}”</p>
                  <div className="mt-4">
                    <h4 className="font-semibold text-slate-900">{t.name}</h4>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-emerald-500 py-20 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to Modernize HR?</h2>
          <p className="mt-4 text-lg max-w-xl mx-auto">
            Start your AI-powered HR journey and hire smarter, faster, and easier.
          </p>
          <a
            href="/login"
            className="mt-8 inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:scale-105 transform transition"
          >
            Get Started
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
