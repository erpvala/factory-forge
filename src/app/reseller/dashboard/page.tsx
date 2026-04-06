// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard, 
  FileText,
  Headphones,
  Settings,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerDashboardState } from '@/hooks/useResellerDashboardState';
import { useNavigate } from 'react-router-dom';

const ResellerDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useResellerDashboardAuth();
  const { state, refreshData } = useResellerDashboardState();
  const navigate = useNavigate();

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
          <p className="text-muted-foreground">Please log in to access your reseller dashboard.</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalCustomers: state.customers.length,
    activeCustomers: state.customers.filter(c => c.status === 'active').length,
    totalSales: state.sales.reduce((sum, sale) => sum + sale.amount, 0),
    totalEarnings: state.earnings.reduce((sum, earning) => sum + earning.amount, 0),
    activeLicenses: state.licenses.filter(l => l.status === 'active').length,
    pendingSupport: state.supportTickets.filter(t => t.status === 'pending').length,
    recentSales: state.sales.slice(0, 5),
    recentEarnings: state.earnings.slice(0, 5)
  };

  const monthlyGrowth = 12.5; // Demo growth percentage
  const earningsGrowth = 8.3; // Demo earnings growth

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reseller Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'Reseller'}! Here's your business overview.
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCustomers} active customers
            </p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+{monthlyGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalSales / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentSales.length} recent sales
            </p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+{monthlyGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalEarnings / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentEarnings.length} recent earnings
            </p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+{earningsGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground">
              {state.licenses.length} total licenses
            </p>
            <div className="flex items-center mt-2">
              <Activity className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-xs text-blue-600">All systems operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Your latest customer transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{sale.customerName}</p>
                      <p className="text-sm text-muted-foreground">{sale.productName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{sale.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {stats.recentSales.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No recent sales</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/reseller/sales')}>
              View All Sales
            </Button>
          </CardContent>
        </Card>

        {/* Recent Earnings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Earnings</CardTitle>
            <CardDescription>Your latest commission earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentEarnings.map((earning: any) => (
                <div key={earning.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{earning.source}</p>
                      <p className="text-sm text-muted-foreground">{earning.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{earning.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(earning.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {stats.recentEarnings.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No recent earnings</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/reseller/earnings')}>
              View All Earnings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>Customer support requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.supportTickets.slice(0, 3).map((ticket: any) => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{ticket.customerName}</p>
                  </div>
                  <Badge variant={ticket.status === 'pending' ? 'destructive' : 'default'}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
              {stats.pendingSupport > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    {stats.pendingSupport} pending tickets
                  </p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/reseller/support')}>
              Manage Support
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/reseller/customers?action=add')}
              >
                <Users className="h-6 w-6" />
                <span className="text-xs">Add Customer</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/reseller/sales?action=create')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-xs">Create Sale</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/reseller/licenses?action=generate')}
              >
                <Package className="h-6 w-6" />
                <span className="text-xs">Generate License</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                onClick={() => navigate('/reseller/invoices?action=create')}
              >
                <FileText className="h-6 w-6" />
                <span className="text-xs">Create Invoice</span>
              </Button>
            </div>
            
            {/* Performance Overview */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Sales Target</span>
                  <span className="text-sm text-muted-foreground">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">License Utilization</span>
                  <span className="text-sm text-muted-foreground">68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResellerDashboardPage;
