'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import {
  User,
  LogOut,
  Menu,
  X,
  Building,
  Briefcase,
  BarChart3,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

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
      }
    };

    checkAuth();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }

      // Close mobile menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { logout } = await import('@/actions/auth/logout');
      await logout();
      setUser(null);
      setShowUserMenu(false);
      setIsOpen(false);
      router.push('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigateTo = (path) => {
    router.push(path);
    setIsOpen(false);
    setShowUserMenu(false);
  };

  const getNavItems = () => {
    if (!user) return [];

    let baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
      { name: 'Jobs', href: '/jobs', icon: Briefcase },
      { name: 'Applications', href: '/applications', icon: Users },
    ];

    if (['HR', 'SeniorHR', 'OrgAdmin'].includes(user.role)) {
      baseItems = [
        { name: 'Dashboard', href: '/organization/dashboard', icon: Users },
        { name: 'Jobs', href: '/organization/jobs', icon: Clock },
        { name: 'Applications', href: '/organization/applications', icon: DollarSign }
      ];
    }

    return baseItems;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'OrgAdmin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SeniorHR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HR': return 'bg-green-100 text-green-800 border-green-200';
      case 'Employee': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'OrgAdmin': return 'Organization Admin';
      case 'SeniorHR': return 'Senior HR';
      case 'HR': return 'HR Manager';
      case 'Employee': return 'Employee';
      default: return role;
    }
  };

  const Logo = () => (
    <button
      onClick={() => navigateTo('/')}
      className="flex items-center gap-3 group cursor-pointer"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-300">
          <Building className="w-5 h-5" />
        </div>
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
      </div>
      <div className="leading-tight">
        <div className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          TalentEdge AI
        </div>
        <div className="text-xs text-slate-500 -mt-0.5">HR Management</div>
      </div>
    </button>
  );

  const LoadingSkeleton = () => (
    <div className="flex items-center space-x-4 animate-pulse">
      <div className="hidden md:flex items-center space-x-4">
        <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-28 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
    </div>
  );

  const UserMenu = () => (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-slate-900 leading-none">
            {user?.name || 'User'}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full border ${getRoleBadgeColor(user?.role)} mt-1`}>
            {getRoleDisplayName(user?.role)}
          </div>
        </div>
        <div className={`transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {showUserMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-80">
          {/* User Info */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email}
                </p>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleDisplayName(user?.role)}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => navigateTo('/profile')}
              className="flex items-center gap-3 w-full px-3 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group cursor-pointer relative"
            >
              <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm font-medium">Profile Settings</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
            </button>

            {user?.orgId && (
              <button
                onClick={() => navigateTo('/organization/dashboard')}
                className="flex items-center gap-3 w-full px-3 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group cursor-pointer relative"
              >
                <Building className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-medium">Organization</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></div>
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="p-2 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors group cursor-pointer relative"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Sign Out</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Navigation Item Component with Hover Animation
  const NavItem = ({ item, isActive, isMobile = false }) => {
    const Icon = item.icon;

    return (
      <button
        onClick={() => navigateTo(item.href)}
        className={`flex items-center gap-2 ${isMobile ? 'w-full px-4 py-3 text-left' : 'px-4 py-2'
          } rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer relative ${isActive
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
      >
        <Icon className="w-4 h-4" />
        <span>{item.name}</span>

        {/* Hover underline animation */}
        {!isActive && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-4/5"></div>
        )}

        {/* Active state indicator */}
        {isActive && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-indigo-500"></div>
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 supports-backdrop-blur:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Navigation - Desktop */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1">
              {getNavItems().map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <LoadingSkeleton />
            ) : user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden sm:block">
                  <UserMenu />
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden transition-colors cursor-pointer relative group"
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-4/5"></div>
                </button>
              </>
            ) : (
              /* Signed-out State */
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigateTo('/signin')}
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors hidden sm:block cursor-pointer relative group"
                >
                  Sign In
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-4/5"></div>
                </button>
                <button
                  onClick={() => navigateTo('/create-organization')}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 cursor-pointer"
                >
                  Get Started
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden transition-colors cursor-pointer relative group"
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-4/5"></div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md"
          >
            <div className="py-4 space-y-2">
              {/* Navigation Items for Logged-in Users */}
              {user && getNavItems().map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href}
                  isMobile={true}
                />
              ))}

              {/* User Info for Mobile */}
              {user && (
                <div className="px-4 py-3 border-t border-slate-200 mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500">{getRoleDisplayName(user?.role)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigateTo('/profile')}
                      className="px-3 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer relative group"
                    >
                      Profile
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-4/5"></div>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer relative group"
                    >
                      Sign Out
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-4/5"></div>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation for Signed-out Users */}
              {!user && (
                <>
                  <button
                    onClick={() => navigateTo('/signin')}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer relative group"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Sign In</span>
                    <div className="absolute bottom-0 left-4 right-4 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-[calc(100%-2rem)]"></div>
                  </button>
                  <button
                    onClick={() => navigateTo('/create-organization')}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium mt-2 cursor-pointer hover:shadow-lg transition-all duration-200"
                  >
                    <Building className="w-5 h-5" />
                    <span>Create Organization</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}