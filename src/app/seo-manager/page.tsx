// @ts-nocheck
'use client';

import React from 'react';

// Placeholder for SEO Manager Dashboard
const SEOManagerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SEO Manager Dashboard</h1>
            <p className="text-muted-foreground">Drive traffic and generate quality leads</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Organic Traffic</h3>
            <p className="text-3xl font-bold text-primary">45.2K</p>
            <p className="text-sm text-muted-foreground">Monthly visitors</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Lead Generation</h3>
            <p className="text-3xl font-bold text-green-600">1,847</p>
            <p className="text-sm text-muted-foreground">From SEO</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Conversion Rate</h3>
            <p className="text-3xl font-bold text-primary">4.1%</p>
            <p className="text-sm text-muted-foreground">Visitor to lead</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Keyword Rankings</h3>
            <p className="text-3xl font-bold text-primary">127</p>
            <p className="text-sm text-muted-foreground">Top 10 positions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Top Performing Keywords</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>software development services</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">#3</span>
                  <span className="text-sm text-muted-foreground">2.1K/mo</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>enterprise software solutions</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">#5</span>
                  <span className="text-sm text-muted-foreground">1.8K/mo</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>custom software development</span>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600 text-sm">#8</span>
                  <span className="text-sm text-muted-foreground">1.5K/mo</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Google Organic</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '68%'}}></div>
                  </div>
                  <span className="text-sm">68%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Direct</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '20%'}}></div>
                  </div>
                  <span className="text-sm">20%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Referral</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '12%'}}></div>
                  </div>
                  <span className="text-sm">12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SEOManagerPage() {
  return <SEOManagerDashboard />;
}
