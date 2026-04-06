// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Wallet
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerDashboardState } from '@/hooks/useResellerDashboardState';

const ResellerEarningsPage: React.FC = () => {
  const { user, isAuthenticated } = useResellerDashboardAuth();
  const { state, refreshData } = useResellerDashboardState();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your earnings.</p>
        </div>
      </div>
    );
  }

  const totalEarnings = state.earnings.reduce((sum, earning) => sum + earning.amount, 0);
  const pendingEarnings = state.earnings.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.amount, 0);
  const paidEarnings = state.earnings.filter(e => e.status === 'paid').reduce((sum, earning) => sum + earning.amount, 0);
  const currentMonthEarnings = state.earnings.filter(e => {
    const earningDate = new Date(e.date);
    const currentDate = new Date();
    return earningDate.getMonth() === currentDate.getMonth() && 
           earningDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, earning) => sum + earning.amount, 0);

  const earningsBySource = state.earnings.reduce((acc: any, earning) => {
    acc[earning.source] = (acc[earning.source] || 0) + earning.amount;
    return acc;
  }, {});

  const handleRequestPayout = () => {
    // Navigate to payout request form
    console.log('Request payout');
  };

  const handleDownloadStatement = () => {
    // Download earnings statement
    console.log('Download statement');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">
            Track your commission earnings and payout history
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownloadStatement}>
            <Download className="h-4 w-4 mr-2" />
            Download Statement
          </Button>
          <Button onClick={handleRequestPayout}>
            <Wallet className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalEarnings / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+15.3% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(currentMonthEarnings / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+8.7% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(pendingEarnings / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payout
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-orange-600">
                {state.earnings.filter(e => e.status === 'pending').length} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(paidEarnings / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              Successfully paid
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="default" className="text-green-600">
                {state.earnings.filter(e => e.status === 'paid').length} paid
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings by Source</CardTitle>
            <CardDescription>Breakdown of your earnings by product/service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(earningsBySource).map(([source, amount]: [string, number]) => {
                const percentage = (amount / totalEarnings) * 100;
                return (
                  <div key={source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{source}</span>
                      <span className="text-sm">₹{amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Your earnings trend over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'December', earnings: 45000, growth: 12.5 },
                { month: 'November', earnings: 40000, growth: 8.3 },
                { month: 'October', earnings: 36900, growth: -2.1 },
                { month: 'September', earnings: 37700, growth: 15.7 },
                { month: 'August', earnings: 32600, growth: 9.2 },
                { month: 'July', earnings: 29850, growth: 5.8 }
              ].map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{month.month}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">₹{(month.earnings / 1000).toFixed(1)}K</span>
                    {month.growth > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs ${month.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {month.growth > 0 ? '+' : ''}{month.growth}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
          <CardDescription>Your latest commission earnings and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.earnings.slice(0, 10).map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{earning.source}</p>
                    <p className="text-sm text-muted-foreground">{earning.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(earning.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{earning.amount.toLocaleString()}</p>
                  <Badge variant={earning.status === 'paid' ? 'default' : 'secondary'}>
                    {earning.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {state.earnings.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
              <p className="text-muted-foreground">
                Start making sales to see your earnings here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
          <CardDescription>Manage your payout preferences and schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Next Payout Date</h4>
              <p className="text-2xl font-bold">15th December 2024</p>
              <p className="text-sm text-muted-foreground">
                Pending earnings will be processed on this date
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Payout Method</h4>
              <p className="text-lg font-semibold">Bank Transfer</p>
              <p className="text-sm text-muted-foreground">
                Account ending in ****4582
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Update Payment Method
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResellerEarningsPage;
