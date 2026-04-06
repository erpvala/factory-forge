// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Key, 
  Search, 
  Filter, 
  Plus,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerDashboardState } from '@/hooks/useResellerDashboardState';

const ResellerLicensesPage: React.FC = () => {
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
          <p className="text-muted-foreground">Please log in to access your licenses.</p>
        </div>
      </div>
    );
  }

  const filteredLicenses = state.licenses.filter(license => {
    const matchesSearch = license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || license.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleGenerateLicense = () => {
    // Navigate to generate license form
    console.log('Generate new license');
  };

  const handleRenewLicense = (licenseId: string) => {
    // Renew license
    console.log('Renew license:', licenseId);
  };

  const handleRevokeLicense = (licenseId: string) => {
    // Revoke license with confirmation
    console.log('Revoke license:', licenseId);
  };

  const handleDownloadLicense = (licenseId: string) => {
    // Download license certificate
    console.log('Download license:', licenseId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'suspended': return 'secondary';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
          <p className="text-muted-foreground">
            Manage customer licenses and product activations
          </p>
        </div>
        <Button onClick={handleGenerateLicense}>
          <Plus className="h-4 w-4 mr-2" />
          Generate License
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.licenses.length}</div>
            <p className="text-xs text-muted-foreground">
              {state.licenses.filter(l => l.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.licenses.filter(l => l.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.licenses.filter(l => {
                const days = getDaysUntilExpiry(l.expiryDate);
                return days > 0 && days <= 30;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.licenses.filter(l => l.status === 'expired').length}</div>
            <p className="text-xs text-muted-foreground">
              Need renewal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search licenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterStatus('all')}>
          <Filter className="h-4 w-4 mr-2" />
          All
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('active')}>
          Active
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('expired')}>
          Expired
        </Button>
        <Button variant="outline" onClick={() => setFilterStatus('suspended')}>
          Suspended
        </Button>
      </div>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>License Management</CardTitle>
          <CardDescription>View and manage all customer licenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">License Key</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Expires</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((license: any) => {
                  const daysUntilExpiry = getDaysUntilExpiry(license.expiryDate);
                  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                  
                  return (
                    <tr key={license.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-mono text-sm">{license.licenseKey}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{license.customerName}</span>
                        </div>
                      </td>
                      <td className="p-4">{license.productName}</td>
                      <td className="p-4">
                        <Badge variant={getStatusColor(license.status)}>
                          {license.status}
                        </Badge>
                        {isExpiringSoon && (
                          <Badge variant="outline" className="ml-2 text-orange-600">
                            Expiring Soon
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{new Date(license.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(license.expiryDate).toLocaleDateString()}
                          {daysUntilExpiry > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {daysUntilExpiry} days left
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadLicense(license.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {license.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRenewLicense(license.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          {license.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRevokeLicense(license.id)}
                            >
                              Revoke
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

          {filteredLicenses.length === 0 && (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No licenses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Generate your first license to get started'}
              </p>
              <Button onClick={handleGenerateLicense}>
                <Plus className="h-4 w-4 mr-2" />
                Generate License
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResellerLicensesPage;
