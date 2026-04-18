// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NavigationHeader from '@/components/Header/NavigationHeader';
import { supabase } from '@/lib/supabase';
import { callEdgeRoute } from '@/lib/api/edge-client';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Real user validation with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        // Check if user exists in database for demo fallback
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .single();
        
        if (userError || !userData) {
          setError('Invalid credentials. Please check your email and password.');
          return;
        }
        
        // Demo account fallback
        if (formData.email === 'boss@factoryforge.com' && formData.password === 'boss123') {
          await handleDemoLogin('boss', '/boss/dashboard');
        } else if (formData.email === 'developer@factoryforge.com' && formData.password === 'dev123') {
          await handleDemoLogin('developer', '/control-panel/developer-dashboard');
        } else if (formData.email === 'reseller@factoryforge.com' && formData.password === 'reseller123') {
          await handleDemoLogin('reseller', '/control-panel/reseller-dashboard');
        } else if (formData.email === 'franchise@factoryforge.com' && formData.password === 'franchise123') {
          await handleDemoLogin('franchise', '/control-panel/franchise-dashboard');
        } else if (formData.email === 'influencer@factoryforge.com' && formData.password === 'influencer123') {
          await handleDemoLogin('influencer', '/control-panel/influencer-dashboard');
        } else {
          setError('Invalid credentials. Try demo accounts or apply below.');
        }
        return;
      }

      // Successful authentication
      if (authData.user) {
        // Get user role from database
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, status')
          .eq('user_id', authData.user.id)
          .single();
        
        if (profileError || !profileData) {
          setError('User profile not found. Please contact support.');
          return;
        }
        
        // Log audit trail
        await supabase.from('audit_logs').insert({
          action: 'user_login_success',
          module: 'authentication',
          user_id: authData.user.id,
          metadata: { 
            email: formData.email,
            role: profileData.role,
            login_method: 'supabase_auth'
          }
        });
        
        // Navigate based on role
        const roleRoutes = {
          'boss': '/control-panel',
          'boss_owner': '/control-panel',
          'developer': '/control-panel/developer-dashboard',
          'reseller': '/control-panel/reseller-dashboard',
          'franchise': '/control-panel/franchise-dashboard',
          'influencer': '/control-panel/influencer-dashboard',
          'ceo': '/control-panel/ceo-dashboard',
          'admin': '/control-panel',
          'super_admin': '/control-panel'
        };
        
        const dashboardRoute = roleRoutes[profileData.role] || '/control-panel';
        router.push(dashboardRoute);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDemoLogin = async (role: string, dashboardPath: string) => {
    try {
      // Create demo session
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email)
        .single();
      
      if (userError || !userData) {
        setError('Demo account not found in database.');
        return;
      }
      
      // Log audit trail for demo login
      await supabase.from('audit_logs').insert({
        action: 'demo_login_success',
        module: 'authentication',
        user_id: userData.id,
        metadata: { 
          email: formData.email,
          role: role,
          login_method: 'demo'
        }
      });
      
      // Set demo session
      localStorage.setItem('user_token', `demo-${role}-token`);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_status', 'ACTIVE');
      localStorage.setItem('user_id', userData.id);
      
      router.push(dashboardPath);
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Demo login failed.');
    }
  };

  return (
    <>
      <NavigationHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <LogIn className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-slate-400">
                Sign in to your Factory Forge account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert className="bg-red-900/20 border-red-800 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center text-sm text-slate-400">
                  Don't have an account?{' '}
                  <Button variant="link" className="p-0 text-blue-400 hover:text-blue-300" onClick={() => router.push('/apply/developer')}>
                    Apply now
                  </Button>
                </div>
                
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-xs text-slate-500 text-center mb-2">Demo Accounts:</p>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Admin: admin@factory.com / admin123</div>
                    <div>Developer: developer@factory.com / dev123</div>
                    <div>Reseller: reseller@factory.com / reseller123</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
