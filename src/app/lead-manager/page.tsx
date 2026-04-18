// @ts-nocheck
'use client';

import React from 'react';

// Placeholder for Lead Manager Dashboard
const LeadManagerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lead Manager Dashboard</h1>
            <p className="text-muted-foreground">Capture, qualify, and distribute leads effectively</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Total Leads</h3>
            <p className="text-3xl font-bold text-primary">1,247</p>
            <p className="text-sm text-muted-foreground">This month</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Qualified</h3>
            <p className="text-3xl font-bold text-green-600">342</p>
            <p className="text-sm text-muted-foreground">Ready for assignment</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Conversion Rate</h3>
            <p className="text-3xl font-bold text-primary">28%</p>
            <p className="text-sm text-muted-foreground">Lead to customer</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Assigned Today</h3>
            <p className="text-3xl font-bold text-primary">56</p>
            <p className="text-sm text-muted-foreground">To resellers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Lead Sources</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>SEO Traffic</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                  <span className="text-sm">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Social Media</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '30%'}}></div>
                  </div>
                  <span className="text-sm">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Direct</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '25%'}}></div>
                  </div>
                  <span className="text-sm">25%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Recent Leads</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-medium">TechCorp Solutions</p>
                  <p className="text-sm text-muted-foreground">Enterprise software</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">New</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-medium">Global Retail Inc</p>
                  <p className="text-sm text-muted-foreground">POS system</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Qualified</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-medium">StartupHub</p>
                  <p className="text-sm text-muted-foreground">Mobile app</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Assigned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LeadManagerPage() {
  return <LeadManagerDashboard />;
}
