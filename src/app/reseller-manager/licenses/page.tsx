// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Search, Download, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Demo data
const licenses = [
  {
    id: 'LIC-001',
    reseller: 'John Doe',
    resellerId: 'RES-001',
    product: 'Software Vala Basic',
    licenseKey: 'SVB-2024-ABC123-XYZ789',
    status: 'Active',
    issuedDate: '2024-01-15',
    expiryDate: '2025-01-15',
    maxUsers: 10,
    currentUsers: 7
  },
  {
    id: 'LIC-002',
    reseller: 'Jane Smith',
    resellerId: 'RES-002',
    product: 'Software Vala Pro',
    licenseKey: 'SVP-2024-DEF456-UVW012',
    status: 'Active',
    issuedDate: '2024-02-20',
    expiryDate: '2025-02-20',
    maxUsers: 25,
    currentUsers: 18
  },
  {
    id: 'LIC-003',
    reseller: 'Mike Johnson',
    resellerId: 'RES-003',
    product: 'Software Vala Enterprise',
    licenseKey: 'SVE-2024-GHI789-RST345',
    status: 'Suspended',
    issuedDate: '2024-03-10',
    expiryDate: '2025-03-10',
    maxUsers: 50,
    currentUsers: 0
  },
  {
    id: 'LIC-004',
    reseller: 'Sarah Wilson',
    resellerId: 'RES-004',
    product: 'Mobile App License',
    licenseKey: 'MAL-2024-JKL012-MNO678',
    status: 'Active',
    issuedDate: '2024-04-05',
    expiryDate: '2025-04-05',
    maxUsers: 100,
    currentUsers: 45
  },
  {
    id: 'LIC-005',
    reseller: 'Tom Brown',
    resellerId: 'RES-005',
    product: 'API Access Token',
    licenseKey: 'AAT-2024-PQR345-STU901',
    status: 'Expired',
    issuedDate: '2023-12-01',
    expiryDate: '2024-12-01',
    maxUsers: 5,
    currentUsers: 0
  }
];

const ResellerManagerLicensesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<any>(null);

  const filteredLicenses = licenses.filter(license =>
    license.reseller.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.resellerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateLicense = () => {
    // Handle license generation logic
    console.log('Generate new license');
  };

  const handleRevokeLicense = (licenseId: string) => {
    // Handle license revocation logic
    console.log('Revoke license:', licenseId);
  };

  const handleRenewLicense = (licenseId: string) => {
    // Handle license renewal logic
    console.log('Renew license:', licenseId);
  };

  const handleExportLicenses = () => {
    // Handle license export logic
    console.log('Export licenses');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              <Key className="h-3 w-3 mr-1" />
              LICENSE MANAGEMENT
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportLicenses}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" onClick={handleGenerateLicense}>
              <Plus className="h-4 w-4 mr-1" />
              Generate License
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            License Management
          </h1>
          <p className="text-muted-foreground">
            Generate, manage, and monitor reseller licenses
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Licenses</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{licenses.length}</span>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Active Licenses</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {licenses.filter(l => l.status === 'Active').length}
                </span>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Suspended</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {licenses.filter(l => l.status === 'Suspended').length}
                </span>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Expired</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {licenses.filter(l => l.status === 'Expired').length}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reseller, product, or license key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Licenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Reseller Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License ID</TableHead>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>License Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-mono text-sm">{license.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.reseller}</div>
                          <div className="text-sm text-muted-foreground">{license.resellerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{license.product}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span>{license.licenseKey}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(license.licenseKey)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(license.status)}>
                          {license.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{license.issuedDate}</TableCell>
                      <TableCell>{license.expiryDate}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{license.currentUsers}/{license.maxUsers}</div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full" 
                              style={{ width: `${(license.currentUsers / license.maxUsers) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedLicense(license)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>License Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">License ID</label>
                                    <p className="text-sm text-muted-foreground">{license.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Reseller</label>
                                    <p className="text-sm text-muted-foreground">{license.reseller}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Product</label>
                                    <p className="text-sm text-muted-foreground">{license.product}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge className={getStatusColor(license.status)}>
                                      {license.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">License Key</label>
                                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">{license.licenseKey}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleRenewLicense(license.id)}>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Renew
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRevokeLicense(license.id)}>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Revoke
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRenewLicense(license.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevokeLicense(license.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ResellerManagerLicensesPage;
