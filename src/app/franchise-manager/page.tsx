// @ts-nocheck
'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';

// Placeholder for Franchise Manager Dashboard
const FranchiseManagerDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Franchise Manager Dashboard</h1>
            <p className="text-muted-foreground">Manage territories, teams, and franchise operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Total Territories</h3>
            <p className="text-3xl font-bold text-primary">12</p>
            <p className="text-sm text-muted-foreground">Active regions</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <p className="text-3xl font-bold text-primary">48</p>
            <p className="text-sm text-muted-foreground">Across all territories</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Monthly Sales</h3>
            <p className="text-3xl font-bold text-primary">₹2.4M</p>
            <p className="text-sm text-muted-foreground">+15% from last month</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Commission Rate</h3>
            <p className="text-3xl font-bold text-primary">12%</p>
            <p className="text-sm text-muted-foreground">Average across team</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/franchise-manager/dashboard')}
                className="p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/franchise-manager/resellers')}
                className="p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
              >
                Manage Resellers
              </button>
              <button 
                onClick={() => navigate('/franchise-manager/sales')}
                className="p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
              >
                Sales Report
              </button>
              <button 
                onClick={() => navigate('/franchise-manager/commission')}
                className="p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
              >
                Commission
              </button>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>New reseller onboarded</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>Sales target achieved</span>
                <span className="text-sm text-muted-foreground">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>Commission payout processed</span>
                <span className="text-sm text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FranchiseManagerPage() {
  return <FranchiseManagerDashboard />;
}
