// @ts-nocheck
'use client';

import React from 'react';

// Placeholder for Analytics Dashboard
const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Business intelligence and performance metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Total Revenue</h3>
            <p className="text-3xl font-bold text-primary">₹48.7M</p>
            <p className="text-sm text-muted-foreground">+23% YoY</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Active Users</h3>
            <p className="text-3xl font-bold text-green-600">12.4K</p>
            <p className="text-sm text-muted-foreground">+18% MoM</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Conversion Rate</h3>
            <p className="text-3xl font-bold text-primary">6.8%</p>
            <p className="text-sm text-muted-foreground">+2.1% improvement</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Customer Lifetime Value</h3>
            <p className="text-3xl font-bold text-purple-600">₹124K</p>
            <p className="text-sm text-muted-foreground">Average per customer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Revenue by Module</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Marketplace</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                  <span className="text-sm">₹21.9M</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Reseller Network</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '30%'}}></div>
                  </div>
                  <span className="text-sm">₹14.6M</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Franchise Operations</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '25%'}}></div>
                  </div>
                  <span className="text-sm">₹12.2M</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>Customer Acquisition Cost</span>
                <span className="font-medium">₹8,400</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>Monthly Recurring Revenue</span>
                <span className="font-medium text-green-600">₹3.2M</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>Churn Rate</span>
                <span className="font-medium text-red-600">2.1%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>Net Promoter Score</span>
                <span className="font-medium text-blue-600">72</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
