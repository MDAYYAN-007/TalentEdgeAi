'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  AiOutlineDashboard,
  AiOutlineUser,
  AiOutlineTeam,
  AiOutlineRocket,
  AiOutlineCheckCircle,
  AiOutlineSecurityScan
} from "react-icons/ai";
import {
  GiArtificialIntelligence,
  GiPayMoney,
  GiTimeBomb
} from "react-icons/gi";
import {
  MdAnalytics,
  MdOutlineSupportAgent,
  MdAttachMoney,
  MdPeople,
  MdWorkspaces
} from "react-icons/md";
import {
  FaRegClock,
  FaChartLine,
  FaShieldAlt
} from "react-icons/fa";
import { Briefcase, Building, Crown, Users, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          setIsVisible(true);
        }, 50);
      }
    };

    checkAuth();
  }, []);

  // Get role-specific content
  const getRoleContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'OrgAdmin':
        return {
          welcome: `Welcome to Your Organization, ${user.name}!`,
          subtitle: 'Full organizational control and oversight',
          description: 'Manage your entire organization with complete administrative access. Oversee departments, employees, and system configurations.',
          primaryButton: { text: 'Organization Dashboard', href: '/organization/dashboard', icon: Crown },
          secondaryButton: { text: 'Manage Employees', href: '/organization/employees', icon: Users },
          stats: [
            { value: 'Full', label: 'Access Level', color: 'from-purple-400 to-pink-400' },
            { value: 'All', label: 'Features', color: 'from-blue-400 to-cyan-400' },
            { value: 'Admin', label: 'Role', color: 'from-emerald-400 to-green-400' },
            { value: 'Live', label: 'Status', color: 'from-orange-400 to-red-400' }
          ]
        };

      case 'SeniorHR':
        return {
          welcome: `Strategic HR Management, ${user.name}!`,
          subtitle: 'Oversee HR operations and team performance',
          description: 'Lead your HR team with strategic oversight. Monitor recruitment, team performance, and organizational analytics.',
          primaryButton: { text: 'HR Dashboard', href: '/organization/dashboard', icon: Users },
          secondaryButton: { text: 'Team Analytics', href: '/organization/analytics', icon: MdAnalytics },
          stats: [
            { value: 'Manager', label: 'Access Level', color: 'from-blue-400 to-cyan-400' },
            { value: 'Advanced', label: 'Features', color: 'from-purple-400 to-pink-400' },
            { value: 'Leadership', label: 'Role', color: 'from-emerald-400 to-green-400' },
            { value: 'Active', label: 'Status', color: 'from-orange-400 to-red-400' }
          ]
        };

      case 'HR':
        return {
          welcome: `HR Operations, ${user.name}!`,
          subtitle: 'Daily HR management and recruitment',
          description: 'Manage daily HR operations, screen candidates, handle employee management, and streamline recruitment processes.',
          primaryButton: { text: 'HR Dashboard', href: '/organization/dashboard', icon: UserCheck },
          secondaryButton: { text: 'View Jobs', href: '/organization/jobs', icon: Briefcase },
          stats: [
            { value: 'Operator', label: 'Access Level', color: 'from-green-400 to-emerald-400' },
            { value: 'Standard', label: 'Features', color: 'from-blue-400 to-cyan-400' },
            { value: 'Operations', label: 'Role', color: 'from-purple-400 to-pink-400' },
            { value: 'Active', label: 'Status', color: 'from-orange-400 to-red-400' }
          ]
        };

      case 'Employee':
        return {
          welcome: `Welcome to Your Workspace, ${user.name}!`,
          subtitle: 'Personal dashboard and self-service features',
          description: 'Access your personal dashboard, manage your profile, track attendance, and view your performance metrics.',
          primaryButton: { text: 'My Dashboard', href: '/dashboard', icon: AiOutlineUser },
          secondaryButton: { text: 'My Profile', href: '/profile', icon: UserCheck },
          stats: [
            { value: 'Viewer', label: 'Access Level', color: 'from-slate-400 to-slate-500' },
            { value: 'Personal', label: 'Features', color: 'from-blue-400 to-cyan-400' },
            { value: 'Self-Service', label: 'Role', color: 'from-green-400 to-emerald-400' },
            { value: 'Active', label: 'Status', color: 'from-orange-400 to-red-400' }
          ]
        };

      default: // User
        return {
          welcome: `Welcome, ${user.name}!`,
          subtitle: 'Explore your HR platform',
          description: 'Get started with your HR platform. Access your dashboard and explore available features.',
          primaryButton: { text: 'Go to Dashboard', href: '/dashboard', icon: AiOutlineDashboard },
          secondaryButton: { text: 'My Profile', href: '/profile', icon: AiOutlineUser },
          stats: [
            { value: 'Basic', label: 'Access Level', color: 'from-slate-400 to-slate-500' },
            { value: 'Limited', label: 'Features', color: 'from-blue-400 to-cyan-400' },
            { value: 'Standard', label: 'Role', color: 'from-green-400 to-emerald-400' },
            { value: 'Active', label: 'Status', color: 'from-orange-400 to-red-400' }
          ]
        };
    }
  };

  const roleContent = user ? getRoleContent() : null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">

        {/* Hero Section with Animation */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col lg:flex-row items-center gap-12">
            <div className={`lg:w-1/2 text-center lg:text-left space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-4">
                <AiOutlineRocket className="w-4 h-4" />
                {user ? roleContent?.subtitle : 'AI-Powered HR Revolution'}
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white">
                {user ? (
                  <>
                    {roleContent?.welcome.split(', ')[0]},
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-cyan-300">
                      {roleContent?.welcome.split(', ')[1]}
                    </span>
                  </>
                ) : (
                  <>
                    Smarter
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-cyan-300">
                      HR Management
                    </span>
                    Starts Here
                  </>
                )}
              </h1>

              <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                {user
                  ? roleContent?.description
                  : `Transform your workplace with AI-driven recruitment, employee management, attendance tracking, and payroll automation—all in one seamless platform.`
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
                {user ? (
                  // Logged-in user buttons
                  <>
                    <Link
                      href={roleContent?.primaryButton.href || '/dashboard'}
                      className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-indigo-600 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:-translate-y-1"
                    >
                      {roleContent?.primaryButton.icon && <roleContent.primaryButton.icon className="w-6 h-6 mr-3" />}
                      {roleContent?.primaryButton.text}
                      <AiOutlineRocket className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {roleContent?.secondaryButton && (
                      <Link
                        href={roleContent.secondaryButton.href}
                        className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white border-2 border-white/50 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white transform hover:scale-105 transition-all duration-300 hover:-translate-y-1"
                      >
                        {roleContent.secondaryButton.icon && <roleContent.secondaryButton.icon className="w-6 h-6 mr-3" />}
                        {roleContent.secondaryButton.text}
                      </Link>
                    )}
                  </>
                ) : (
                  // Logged-out user buttons
                  <>
                    <Link
                      href="/create-organization"
                      className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-indigo-600 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:-translate-y-1"
                    >
                      <MdWorkspaces className="w-6 h-6 mr-3" />
                      Launch Your Organization
                      <AiOutlineRocket className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      href="/signin"
                      className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white border-2 border-white/50 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white transform hover:scale-105 transition-all duration-300 hover:-translate-y-1"
                    >
                      <AiOutlineDashboard className="w-6 h-6 mr-3" />
                      Access Dashboard
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-8 text-blue-100">
                <div className="flex items-center gap-2">
                  <AiOutlineSecurityScan className="w-5 h-5" />
                  <span className="text-sm">Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  <span className="text-sm">99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdPeople className="w-5 h-5" />
                  <span className="text-sm">5,000+ Employees Scale</span>
                </div>
                {user && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.role === 'OrgAdmin' ? 'bg-purple-400' :
                      user.role === 'SeniorHR' ? 'bg-blue-400' :
                        user.role === 'HR' ? 'bg-green-400' :
                          user.role === 'Employee' ? 'bg-amber-400' : 'bg-slate-400'
                      }`}></div>
                    <span className="text-sm capitalize">{user.role}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Animated Stats Cards */}
            <div className={`lg:w-1/2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                <div className="absolute -inset-4 bg-white/20 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="text-center text-white font-semibold text-lg mb-8">
                    {user ? 'Your Platform Access' : 'Platform Intelligence'}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {user ? (
                      // Logged-in user stats based on role
                      roleContent?.stats.map((stat, index) => (
                        <div
                          key={index}
                          className="text-center p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:from-white/20 hover:to-white/10 transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                          </div>
                          <div className="text-white/80 text-sm mt-2">{stat.label}</div>
                        </div>
                      ))
                    ) : (
                      // Logged-out user stats
                      <>
                        {[
                          { value: "5K+", label: "Employees Supported", color: "from-blue-400 to-cyan-400" },
                          { value: "87%", label: "AI Match Accuracy", color: "from-emerald-400 to-green-400" },
                          { value: "40%", label: "HR Time Saved", color: "from-purple-400 to-pink-400" },
                          { value: "4", label: "Role Levels", color: "from-orange-400 to-red-400" },
                        ].map((stat, index) => (
                          <div
                            key={index}
                            className="text-center p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:from-white/20 hover:to-white/10 transition-all duration-300 transform hover:-translate-y-1"
                          >
                            <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                              {stat.value}
                            </div>
                            <div className="text-white/80 text-sm mt-2">{stat.label}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rest of the sections remain the same */}
        {/* Features Grid */}
        <section className="relative py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-slate-900 mb-6">
                Everything Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">HR Team Needs</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                From AI-powered recruitment to comprehensive employee management—all integrated into one intelligent platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <GiArtificialIntelligence className="w-8 h-8" />,
                  title: "AI Resume Screening",
                  description: "Intelligent parsing and ranking of resumes with skill-based matching",
                  color: "from-purple-500 to-indigo-500",
                  features: ["Smart Skill Matching", "Automated Ranking", "Bias Reduction"]
                },
                {
                  icon: <MdPeople className="w-8 h-8" />,
                  title: "Employee Management",
                  description: "Complete employee lifecycle management with role-based access",
                  color: "from-blue-500 to-cyan-500",
                  features: ["Role Hierarchy", "Department Management", "Performance Tracking"]
                },
                {
                  icon: <FaRegClock className="w-8 h-8" />,
                  title: "Attendance System",
                  description: "Real-time tracking with intelligent leave management",
                  color: "from-green-500 to-emerald-500",
                  features: ["Live Tracking", "Leave Management", "Automated Reports"]
                },
                {
                  icon: <MdAttachMoney className="w-8 h-8" />,
                  title: "Payroll Automation",
                  description: "Seamless payroll processing with tax compliance",
                  color: "from-yellow-500 to-orange-500",
                  features: ["Auto Calculations", "Tax Compliance", "Digital Payslips"]
                },
                {
                  icon: <FaChartLine className="w-8 h-8" />,
                  title: "Performance Analytics",
                  description: "Deep insights into employee and organizational performance",
                  color: "from-pink-500 to-rose-500",
                  features: ["KPI Tracking", "Team Analytics", "Growth Insights"]
                },
                {
                  icon: <FaShieldAlt className="w-8 h-8" />,
                  title: "Role-Based Security",
                  description: "Multi-level access control for different organizational roles",
                  color: "from-indigo-500 to-purple-500",
                  features: ["Hierarchical Access", "Data Security", "Audit Logs"]
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">{feature.description}</p>

                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-700">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`}></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role System Showcase */}
        <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">
                Built for <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Every Role</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Hierarchical access control designed for modern organizational structures
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  role: "Org Admin",
                  description: "Full organizational control and oversight",
                  permissions: ["Employee Enrollment", "Department Management", "System Configuration"],
                  color: "from-purple-500 to-pink-500",
                  level: "Full Access"
                },
                {
                  role: "Senior HR",
                  description: "Strategic HR management and team oversight",
                  permissions: ["Team Performance", "Recruitment Oversight", "Analytics"],
                  color: "from-blue-500 to-cyan-500",
                  level: "Management"
                },
                {
                  role: "HR Manager",
                  description: "Daily HR operations and employee management",
                  permissions: ["Candidate Screening", "Attendance Management", "Payroll"],
                  color: "from-green-500 to-emerald-500",
                  level: "Operations"
                },
                {
                  role: "Employee",
                  description: "Personal dashboard and self-service features",
                  permissions: ["Profile Management", "Leave Requests", "Performance"],
                  color: "from-slate-500 to-slate-600",
                  level: "Self-Service"
                }
              ].map((role, index) => (
                <div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${role.color} flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg`}>
                    {role.role.split(' ').map(w => w[0]).join('')}
                  </div>

                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${role.color} text-white mb-4`}>
                    {role.level}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">{role.role}</h3>
                  <p className="text-slate-300 mb-6">{role.description}</p>

                  <ul className="space-y-3">
                    {role.permissions.map((permission, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${role.color}`}></div>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center px-6 lg:px-8">
            <h2 className="text-5xl font-bold text-white mb-8">
              {user ? 'Continue Your HR Journey' : 'Ready to Transform Your HR Operations?'}
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
              {user
                ? 'Keep leveraging AI-powered tools to enhance your HR operations and organizational efficiency.'
                : 'Join thousands of organizations that have revolutionized their HR management with our AI-powered platform.'
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href={user ? "/organization/dashboard" : "/create-organization"}
                className="group inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-indigo-600 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:-translate-y-1"
              >
                <MdWorkspaces className="w-6 h-6 mr-3" />
                {user ? "Go to Dashboard" : "Start Free Trial"}
                <AiOutlineRocket className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={user ? "/profile" : "/signin"}
                className="group inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-white border-2 border-white/50 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white transform hover:scale-105 transition-all duration-300 hover:-translate-y-1"
              >
                <AiOutlineDashboard className="w-6 h-6 mr-3" />
                {user ? "My Profile" : "View Demo"}
              </Link>
            </div>

            <div className="mt-8 text-blue-200 text-sm">
              No credit card required • 14-day free trial • Setup in 5 minutes
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}