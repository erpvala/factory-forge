// @ts-nocheck
'use client';

import React from 'react';

// Placeholder for Wallet Dashboard
const WalletDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet Dashboard</h1>
            <p className="text-muted-foreground">Central financial hub for all transactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">User Wallets</h3>
            <p className="text-3xl font-bold text-primary">₹12.4M</p>
            <p className="text-sm text-muted-foreground">Total balance</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Reseller Wallets</h3>
            <p className="text-3xl font-bold text-green-600">₹8.7M</p>
            <p className="text-sm text-muted-foreground">Available for payout</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Franchise Wallets</h3>
            <p className="text-3xl font-bold text-primary">₹15.2M</p>
            <p className="text-sm text-muted-foreground">Commission earnings</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Boss Wallet</h3>
            <p className="text-3xl font-bold text-purple-600">₹24.8M</p>
            <p className="text-sm text-muted-foreground">Executive revenue</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-sm text-muted-foreground">Customer #1234</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">+₹24,900</p>
                  <p className="text-xs text-muted-foreground">2 min ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-medium">Commission Credited</p>
                  <p className="text-sm text-muted-foreground">Reseller #567</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">+₹3,735</p>
                  <p className="text-xs text-muted-foreground">15 min ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-medium">Payout Processed</p>
                  <p className="text-sm text-muted-foreground">Franchise #89</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">-₹45,000</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Payout Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Pending Payouts</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Processing Today</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">₹2.4M</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Payout</span>
                <span className="text-sm text-muted-foreground">Yesterday, ₹1.8M</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next Payout Cycle</span>
                <span className="text-sm text-muted-foreground">In 3 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WalletPage() {
  return <WalletDashboard />;
}
