// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, User, Mail, Phone, Instagram, Youtube, Twitter, Globe, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApplyInfluencerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    niche: '',
    experience: '',
    followers: '',
    platforms: '',
    engagement: '',
    rates: '',
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
        role: 'influencer',
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
      localStorage.setItem('user_role', 'influencer');
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
            <div className="mx-auto w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-slate-400 mb-4">Your influencer application has been received and is under review.</p>
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
              <Users className="h-8 w-8 text-pink-500" />
              <h1 className="text-xl font-bold text-white">Influencer Application</h1>
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
            <CardTitle className="text-2xl">Partner With Us</CardTitle>
            <CardDescription className="text-slate-400">
              Join our influencer program and earn commissions while promoting products you love.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-pink-400">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        placeholder="Jane Creator"
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
                        placeholder="jane@creator.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Influencer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-pink-400">Influencer Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="niche">Your Niche *</Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="niche"
                      placeholder="Tech, Beauty, Fashion, Gaming, Lifestyle..."
                      value={formData.niche}
                      onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Content Creation Experience *</Label>
                  <Textarea
                    id="experience"
                    placeholder="3+ years creating content, experienced in product reviews..."
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Social Media Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-pink-400">Social Media Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="followers">Total Followers *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="followers"
                      placeholder="50K+ Instagram, 25K+ YouTube, 100K+ TikTok..."
                      value={formData.followers}
                      onChange={(e) => setFormData(prev => ({ ...prev, followers: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platforms">Primary Platforms *</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="platforms"
                      placeholder="Instagram, YouTube, TikTok, Twitter, Blog..."
                      value={formData.platforms}
                      onChange={(e) => setFormData(prev => ({ ...prev, platforms: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engagement">Engagement Rate *</Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="engagement"
                      placeholder="3-5% average engagement rate across platforms"
                      value={formData.engagement}
                      onChange={(e) => setFormData(prev => ({ ...prev, engagement: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rates">Typical Rates</Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="rates"
                      placeholder="$500/Instagram post, $1000/YouTube video..."
                      value={formData.rates}
                      onChange={(e) => setFormData(prev => ({ ...prev, rates: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Why Join */}
              <div className="space-y-2">
                <Label htmlFor="whyJoin">Why do you want to partner with us? *</Label>
                <Textarea
                  id="whyJoin"
                  placeholder="Tell us about your audience and why you're excited about our products..."
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
                className="w-full bg-pink-600 hover:bg-pink-700"
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
