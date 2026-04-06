// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus,
  Download,
  Send,
  Eye,
  Calendar,
  User,
  DollarSign,
  Mail,
  CheckCircle
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerDashboardState } from '@/hooks/useResellerDashboardState';

const ResellerInvoicesPage: React.FC = () => {
  const { user, isAuthenticated } = useResellerDashboardAuth();
  const { state, refreshData } = useResellerDashboardState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
          <p className="text-muted-foreground">Please log in to access your invoices.</p>
        </div>
      </div>
    );
  }

  const filteredInvoices = state.invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateInvoice = () => {
    // Navigate to create invoice form
    console.log('Create new invoice');
  };

  const handleViewInvoice = (invoiceId: string) => {
    // Navigate to invoice details
    console.log('View invoice:', invoiceId);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // Download invoice PDF
    console.log('Download invoice:', invoiceId);
  };

  const handleSendInvoice = (invoiceId: string) => {
    // Send invoice to customer
    console.log('Send invoice:', invoiceId);
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    // Mark invoice as paid
    console.log('Mark as paid:', invoiceId);
  };

  const totalInvoiced = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidInvoices = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const unpaidInvoices = filteredInvoices.filter(i => i.status === 'unpaid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueInvoices = filteredInvoices.filter(i => i.status === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'unpaid': return 'secondary';
      case 'overdue': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage customer invoices
          </p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalInvoiced / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length} total invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(paidInvoices / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(i => i.status === 'paid').length} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(unpaidInvoices / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(i => i.status === 'unpaid').length} unpaid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(overdueInvoices / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(i => i.status === 'overdue').length} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterStatus('all')}>
          <Filter className="h-4 w-4 mr-2" />
          All
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('paid')}>
          Paid
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('unpaid')}>
          Unpaid
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('overdue')}>
          Overdue
        </Button>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>View and manage all customer invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Invoice #</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Subject</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Due Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice: any) => {
                  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
                  
                  return (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-mono text-sm">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{invoice.customerName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs truncate">{invoice.subject}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">₹{invoice.amount.toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="ml-2">
                            Overdue
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'unpaid' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === 'unpaid' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Create your first invoice to get started'}
              </p>
              <Button onClick={handleCreateInvoice}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResellerInvoicesPage;
