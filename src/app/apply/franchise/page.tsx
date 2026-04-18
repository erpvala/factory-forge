// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, User, Mail, Phone, Briefcase, Globe, MapPin, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApplyFranchisePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    experience: '',
    territory: '',
    investment: '',
    businessPlan: '',
    whyJoin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create application
      const application = {
        id: Date.now(),
        role: 'franchise',
        data: formData,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      // Store in localStorage (demo)
      const applications = JSON.parse(localStorage.getItem('applications') || '[]');
      applications.push(application);
      localStorage.setItem('applications', JSON.stringify(applications));

      // Create user session
      localStorage.setItem('user_token', 'demo-pending-token');
      localStorage.setItem('user_role', 'franchise');
      localStorage.setItem('user_status', 'PENDING');
      localStorage.setItem('user_application', JSON.stringify(application));

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/pending');
      }, 2000);
    } catch (err) {
      setError('Application submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 text-white max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-slate-400 mb-4">Your franchise application has been received and is under review.</p>
            <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-500" />
              <h1 className="text-xl font-bold text-white">Franchise Application</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/login')}>
              Already have an account? Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Own Your Territory</CardTitle>
            <CardDescription className="text-slate-400">
              Become a franchise partner and build your own business with our proven model.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-400">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-400">Business Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="company"
                      placeholder="Doe Franchise LLC"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Business Experience *</Label>
                  <Textarea
                    id="experience"
                    placeholder="10+ years in business management, franchise operations..."
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Franchise Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-400">Franchise Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="territory">Desired Territory *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="territory"
                      placeholder="New York Metro Area, California, Texas..."
                      value={formData.territory}
                      onChange={(e) => setFormData(prev => ({ ...prev, territory: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investment">Investment Capacity *</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="investment"
                      placeholder="$50,000 - $100,000"
                      value={formData.investment}
                      onChange={(e) => setFormData(prev => ({ ...prev, investment: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPlan">Business Plan</Label>
                  <Textarea
                    id="businessPlan"
                    placeholder="Describe your plan for growing the franchise in your territory..."
                    value={formData.businessPlan}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessPlan: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={4}
                  />
                </div>
              </div>

              {/* Online Presence */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-400">Online Presence</h3>
                <div className="space-y-2">
                  <Label htmlFor="website">Company Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="website"
                      placeholder="https://doefranchise.com"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Why Join */}
              <div className="space-y-2">
                <Label htmlFor="whyJoin">Why do you want to become a franchise partner? *</Label>
                <Textarea
                  id="whyJoin"
                  placeholder="Tell us about your vision and why you're interested in this opportunity..."
                  value={formData.whyJoin}
                  onChange={(e) => setFormData(prev => ({ ...prev, whyJoin: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  rows={4}
                  required
                />
              </div>

              {error && (
                <Alert className="bg-red-900/20 border-red-800 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
