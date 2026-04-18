// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Phone, Briefcase, GraduationCap, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApplyJobPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    education: '',
    location: '',
    availability: '',
    salary: '',
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
        role: 'job',
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
      localStorage.setItem('user_role', 'job');
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
            <div className="mx-auto w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-slate-400 mb-4">Your job application has been received and is under review.</p>
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
              <Briefcase className="h-8 w-8 text-orange-500" />
              <h1 className="text-xl font-bold text-white">Job Application</h1>
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
            <CardTitle className="text-2xl">Join Our Team</CardTitle>
            <CardDescription className="text-slate-400">
              Explore career opportunities and become part of our growing team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">Personal Information</h3>
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

              {/* Position Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">Position Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="position">Desired Position *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="position"
                      placeholder="Software Engineer, Product Manager, Sales Executive..."
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Work Experience *</Label>
                  <Textarea
                    id="experience"
                    placeholder="5+ years in software development, experience with React, Node.js..."
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education *</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="education"
                      placeholder="Bachelor's in Computer Science, Master's in Business..."
                      value={formData.education}
                      onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="location"
                      placeholder="New York, NY (Remote Available)"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="availability"
                      placeholder="Immediate, 2 weeks notice, 1 month notice..."
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary Expectations</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="salary"
                      placeholder="$80,000 - $120,000 annually"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Why Join */}
              <div className="space-y-2">
                <Label htmlFor="whyJoin">Why do you want to join our team? *</Label>
                <Textarea
                  id="whyJoin"
                  placeholder="Tell us about your career goals and why you're excited about this opportunity..."
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
                className="w-full bg-orange-600 hover:bg-orange-700"
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
