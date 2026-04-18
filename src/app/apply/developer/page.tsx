// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Code, User, Mail, Phone, Briefcase, Github, Linkedin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApplyDeveloperPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    skills: '',
    github: '',
    linkedin: '',
    portfolio: '',
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
        role: 'developer',
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
      localStorage.setItem('user_role', 'developer');
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
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <Code className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-slate-400 mb-4">Your developer application has been received and is under review.</p>
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
              <Code className="h-8 w-8 text-blue-500" />
              <h1 className="text-xl font-bold text-white">Developer Application</h1>
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
            <CardTitle className="text-2xl">Join Our Developer Team</CardTitle>
            <CardDescription className="text-slate-400">
              Apply to become part of our elite development team and work on cutting-edge projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400">Personal Information</h3>
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

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400">Professional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="experience"
                      placeholder="3+ years of full-stack development"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Technical Skills *</Label>
                  <Textarea
                    id="skills"
                    placeholder="React, Node.js, Python, AWS, Docker..."
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Portfolio Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400">Portfolio & Links</h3>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Profile</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="github"
                      placeholder="https://github.com/johndoe"
                      value={formData.github}
                      onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/in/johndoe"
                      value={formData.linkedin}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio Website</Label>
                  <Input
                    id="portfolio"
                    placeholder="https://johndoe.dev"
                    value={formData.portfolio}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Why Join */}
              <div className="space-y-2">
                <Label htmlFor="whyJoin">Why do you want to join our team? *</Label>
                <Textarea
                  id="whyJoin"
                  placeholder="Tell us about your motivation and what you hope to contribute..."
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
                className="w-full bg-blue-600 hover:bg-blue-700"
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
