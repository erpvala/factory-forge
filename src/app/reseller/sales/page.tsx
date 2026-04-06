// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  DollarSign,
  Eye,
  Download
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerDashboardState } from '@/hooks/useResellerDashboardState';

const ResellerSalesPage: React.FC = () => {
  const { user, isAuthenticated } = useResellerDashboardAuth();
  const { state, refreshData } = useResellerDashboardState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('30');

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
          <p className="text-muted-foreground">Please log in to access your sales.</p>
        </div>
      </div>
    );
  }

  const filteredSales = state.sales.filter(sale => {
    const matchesSearch = sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || sale.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateSale = () => {
    // Navigate to create sale form
    console.log('Create new sale');
  };

  const handleViewSale = (saleId: string) => {
    // Navigate to sale details
    console.log('View sale:', saleId);
  };

  const handleDownloadInvoice = (saleId: string) => {
    // Download invoice
    console.log('Download invoice:', saleId);
  };

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCommission = filteredSales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
  const averageSaleValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">
            Track your sales performance and customer transactions
          </p>
        </div>
        <Button onClick={handleCreateSale}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalRevenue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.length} total sales
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalCommission / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              From all sales
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+8.3% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageSaleValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+5.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <p className="text-xs text-muted-foreground">
              Leads to sales
            </p>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-xs text-red-600">-2.1% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterStatus('all')}>
          <Filter className="h-4 w-4 mr-2" />
          All
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('completed')}>
          Completed
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('pending')}>
          Pending
        </Button>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
          <CardDescription>View and manage all customer sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Invoice #</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Commission</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale: any) => (
                  <tr key={sale.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-mono text-sm">{sale.invoiceNumber}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{sale.customerName}</span>
                      </div>
                    </td>
                    <td className="p-4">{sale.productName}</td>
                    <td className="p-4">
                      <div className="font-semibold">₹{sale.amount.toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-600">₹{(sale.commission || 0).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(sale.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewSale(sale.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadInvoice(sale.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sales found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Create your first sale to get started'}
              </p>
              <Button onClick={handleCreateSale}>
                <Plus className="h-4 w-4 mr-2" />
                Create Sale
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResellerSalesPage;
