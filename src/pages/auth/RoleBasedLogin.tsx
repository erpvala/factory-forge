// @ts-nocheck
/**
 * ROLE-BASED LOGIN & SIGNUP PAGE
 * Enterprise dark navy theme with role selector
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Loader2, User,
  Crown, Briefcase, Globe, Server, Bot, Package, Users, Store,
  HeadphonesIcon, BarChart3, Search, Megaphone, Scale, UserCheck,
  ListChecks, Monitor, Cpu, MapPin, ShieldCheck, ShoppingBag,
  Key, Rocket, Bell, Link2, ClipboardList, Star, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { getDefaultDashboardRoute } from '@/hooks/useProtectedActionHandler';
import { toast } from 'sonner';

const ROLE_OPTIONS: { value: AppRole; label: string; icon: React.ReactNode; tier: string }[] = [
  // Authority
  { value: 'boss_owner', label: 'Boss / Owner', icon: <Crown className="w-4 h-4" />, tier: 'Authority' },
  { value: 'ceo', label: 'CEO', icon: <Briefcase className="w-4 h-4" />, tier: 'Authority' },
  { value: 'super_admin', label: 'Super Admin', icon: <Shield className="w-4 h-4" />, tier: 'Authority' },
  { value: 'admin', label: 'Admin', icon: <UserCheck className="w-4 h-4" />, tier: 'Authority' },
  // Management
  { value: 'server_manager', label: 'Server Manager', icon: <Server className="w-4 h-4" />, tier: 'Management' },
  { value: 'api_ai_manager', label: 'AI API Manager', icon: <Cpu className="w-4 h-4" />, tier: 'Management' },
  { value: 'product_manager', label: 'Product Manager', icon: <Package className="w-4 h-4" />, tier: 'Management' },
  { value: 'demo_manager', label: 'Demo Manager', icon: <Monitor className="w-4 h-4" />, tier: 'Management' },
  { value: 'task_manager', label: 'Task Manager', icon: <ListChecks className="w-4 h-4" />, tier: 'Management' },
  { value: 'lead_manager', label: 'Lead Manager', icon: <Users className="w-4 h-4" />, tier: 'Management' },
  { value: 'marketing_manager', label: 'Marketing Manager', icon: <Megaphone className="w-4 h-4" />, tier: 'Management' },
  { value: 'seo_manager', label: 'SEO Manager', icon: <Search className="w-4 h-4" />, tier: 'Management' },
  { value: 'sales_support', label: 'Sales & Support', icon: <HeadphonesIcon className="w-4 h-4" />, tier: 'Management' },
  { value: 'finance_manager', label: 'Finance Manager', icon: <BarChart3 className="w-4 h-4" />, tier: 'Management' },
  { value: 'legal_manager', label: 'Legal Manager', icon: <Scale className="w-4 h-4" />, tier: 'Management' },
  { value: 'hr_manager', label: 'HR Manager', icon: <UserCheck className="w-4 h-4" />, tier: 'Management' },
  { value: 'pro_manager', label: 'Pro Manager', icon: <Star className="w-4 h-4" />, tier: 'Management' },
  { value: 'security_manager', label: 'Security Manager', icon: <ShieldCheck className="w-4 h-4" />, tier: 'Management' },
  { value: 'marketplace_manager', label: 'Marketplace Manager', icon: <ShoppingBag className="w-4 h-4" />, tier: 'Management' },
  { value: 'analytics_manager', label: 'Analytics Manager', icon: <BarChart3 className="w-4 h-4" />, tier: 'Management' },
  { value: 'notification_manager', label: 'Notification Manager', icon: <Bell className="w-4 h-4" />, tier: 'Management' },
  { value: 'integration_manager', label: 'Integration Manager', icon: <Link2 className="w-4 h-4" />, tier: 'Management' },
  { value: 'audit_manager', label: 'Audit Manager', icon: <ClipboardList className="w-4 h-4" />, tier: 'Management' },
  { value: 'license_manager', label: 'License Manager', icon: <Key className="w-4 h-4" />, tier: 'Management' },
  { value: 'deployment_manager', label: 'Deployment Manager', icon: <Rocket className="w-4 h-4" />, tier: 'Management' },
  // Regional
  { value: 'continent_admin', label: 'Continent Admin', icon: <Globe className="w-4 h-4" />, tier: 'Regional' },
  { value: 'country_admin', label: 'Country Admin', icon: <MapPin className="w-4 h-4" />, tier: 'Regional' },
  // Partners
  { value: 'franchise_owner', label: 'Franchise Owner', icon: <Store className="w-4 h-4" />, tier: 'Partners' },
  { value: 'franchise_manager', label: 'Franchise Manager', icon: <Store className="w-4 h-4" />, tier: 'Partners' },
  { value: 'reseller', label: 'Reseller', icon: <Users className="w-4 h-4" />, tier: 'Partners' },
  { value: 'reseller_manager', label: 'Reseller Manager', icon: <Users className="w-4 h-4" />, tier: 'Partners' },
  { value: 'influencer', label: 'Influencer', icon: <Megaphone className="w-4 h-4" />, tier: 'Partners' },
  { value: 'influencer_manager', label: 'Influencer Manager', icon: <Megaphone className="w-4 h-4" />, tier: 'Partners' },
  // Users
  { value: 'developer', label: 'Developer', icon: <Bot className="w-4 h-4" />, tier: 'Staff' },
  { value: 'prime_user', label: 'Prime User', icon: <Star className="w-4 h-4" />, tier: 'Users' },
  { value: 'user', label: 'User', icon: <UserCircle className="w-4 h-4" />, tier: 'Users' },
];

export default function RoleBasedLogin() {
  const navigate = useNavigate();
  const { signIn, signUp, user, userRole } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && userRole) {
      navigate(getDefaultDashboardRoute(userRole), { replace: true });
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!isLogin && !fullName) {
      toast.error('Please enter your full name');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Login successful!');
        }
      } else {
        const { error } = await signUp(email, password, selectedRole, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          if (selectedRole === 'boss_owner') {
            toast.success('Boss account created! Redirecting...');
          } else {
            toast.success('Account created! Awaiting Boss approval.');
            navigate('/pending-approval', { replace: true });
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const tiers = [...new Set(ROLE_OPTIONS.map(r => r.tier))];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(180deg, #0a1628 0%, #0d1b2a 100%)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Software Vala</span>
          </div>
          <p className="text-slate-400 text-sm">Enterprise Management Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-6" style={{
          background: 'rgba(13, 27, 42, 0.95)',
          borderColor: '#1e3a5f',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Toggle */}
          <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ background: 'rgba(30, 58, 95, 0.5)' }}>
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (signup only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <Label className="text-slate-300 text-sm">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <Label className="text-slate-300 text-sm">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label className="text-slate-300 text-sm">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selector (signup only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <Label className="text-slate-300 text-sm">Select Your Role</Label>
                  <button
                    type="button"
                    onClick={() => setShowRoles(!showRoles)}
                    className="w-full mt-1 flex items-center justify-between px-3 py-2.5 rounded-md border text-sm text-white"
                    style={{ background: 'rgba(15, 23, 42, 0.5)', borderColor: '#334155' }}
                  >
                    <span className="flex items-center gap-2">
                      {ROLE_OPTIONS.find(r => r.value === selectedRole)?.icon}
                      {ROLE_OPTIONS.find(r => r.value === selectedRole)?.label || 'Select role'}
                    </span>
                    <ArrowRight className={`w-4 h-4 transition-transform ${showRoles ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showRoles && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 max-h-60 overflow-y-auto rounded-lg border p-2 space-y-2"
                        style={{ background: 'rgba(10, 22, 40, 0.95)', borderColor: '#1e3a5f' }}
                      >
                        {tiers.map(tier => (
                          <div key={tier}>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1 font-semibold">
                              {tier}
                            </div>
                            {ROLE_OPTIONS.filter(r => r.tier === tier).map(role => (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() => { setSelectedRole(role.value); setShowRoles(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                                  selectedRole === role.value
                                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                {role.icon}
                                {role.label}
                              </button>
                            ))}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {selectedRole !== 'boss_owner' && (
                    <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Requires Boss approval after signup
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-2.5 rounded-lg"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          © 2026 Software Vala. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
