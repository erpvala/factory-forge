// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  User, 
  Code, 
  Users, 
  Briefcase, 
  LogIn,
  ChevronDown
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function NavigationHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('user_token');
    const role = localStorage.getItem('user_role');
    const status = localStorage.getItem('user_status');
    
    setIsLoggedIn(!!token && status === 'ACTIVE');
    setUserRole(role || '');
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole('');
    router.push('/');
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const applyOptions = [
    { 
      label: 'Developer', 
      icon: Code, 
      path: '/apply/developer',
      description: 'Join our development team'
    },
    { 
      label: 'Reseller', 
      icon: Briefcase, 
      path: '/apply/reseller',
      description: 'Become an authorized reseller'
    },
    { 
      label: 'Franchise', 
      icon: Users, 
      path: '/apply/franchise',
      description: 'Own a territory'
    },
    { 
      label: 'Influencer', 
      icon: Users, 
      path: '/apply/influencer',
      description: 'Partner with us'
    },
    { 
      label: 'Jobs', 
      icon: User, 
      path: '/apply/job',
      description: 'Explore career opportunities'
    }
  ];

  // Quick action buttons for header
  const quickActions = [
    {
      label: 'Join Developer',
      icon: Code,
      path: '/apply/developer',
      variant: 'default' as const
    },
    {
      label: 'Become Reseller',
      icon: Briefcase,
      path: '/apply/reseller',
      variant: 'outline' as const
    },
    {
      label: 'Own Franchise',
      icon: Users,
      path: '/apply/franchise',
      variant: 'outline' as const
    }
  ];

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FF</span>
              </div>
              <span className="text-white font-bold text-xl">Factory Forge</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation('/')}
              className={`text-sm font-medium transition-colors ${
                pathname === '/' ? 'text-blue-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              Marketplace
            </button>
            
            {/* Apply Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                <span>Apply</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  {applyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.path}
                        onClick={() => handleNavigation(option.path)}
                        className="w-full px-4 py-3 flex items-center space-x-3 text-left hover:bg-slate-700 transition-colors"
                      >
                        <Icon className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{option.label}</p>
                          <p className="text-xs text-gray-400">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <button
                onClick={() => handleNavigation(`/${userRole}/dashboard`)}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => handleNavigation('/login')}
                className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Badge variant="outline" className="capitalize">
                  {userRole}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.path}
                      variant={action.variant}
                      size="sm"
                      onClick={() => handleNavigation(action.path)}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{action.label}</span>
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => handleNavigation('/login')}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => handleNavigation('/')}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  pathname === '/' ? 'bg-slate-800 text-blue-400' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Marketplace
              </button>
              
              {/* Mobile Apply Options */}
              <div className="space-y-1">
                <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Apply
                </p>
                {applyOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.path}
                      onClick={() => handleNavigation(option.path)}
                      className="w-full px-3 py-2 flex items-center space-x-3 text-left rounded-md text-base font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Icon className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-white">{option.label}</p>
                        <p className="text-xs text-gray-400">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => handleNavigation(`/${userRole}/dashboard`)}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Dashboard
                  </button>
                  <div className="flex items-center justify-between px-3 py-2">
                    <Badge variant="outline" className="capitalize">
                      {userRole}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Login
                  </button>
                  <div className="space-y-2 pt-2 border-t border-slate-700">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.path}
                          variant={action.variant}
                          size="sm"
                          onClick={() => handleNavigation(action.path)}
                          className="w-full justify-start flex items-center space-x-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{action.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
