// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, ShoppingCart, Search, Filter, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Demo data
const salesData = [
  {
    id: 'SAL-001',
    reseller: 'John Doe',
    resellerId: 'RES-001',
    product: 'Software Vala Basic',
    amount: '₹2,499',
    commission: '₹375',
    date: '2024-01-15',
    status: 'Completed',
    customer: 'ABC Company',
    region: 'North'
  },
  {
    id: 'SAL-002',
    reseller: 'Jane Smith',
    resellerId: 'RES-002',
    product: 'Software Vala Pro',
    amount: '₹4,999',
    commission: '₹1,000',
    date: '2024-01-16',
    status: 'Completed',
    customer: 'XYZ Corp',
    region: 'South'
  },
  {
    id: 'SAL-003',
    reseller: 'Mike Johnson',
    resellerId: 'RES-003',
    product: 'Software Vala Enterprise',
    amount: '₹9,999',
    commission: '₹2,500',
    date: '2024-01-17',
    status: 'Pending',
    customer: 'Tech Solutions',
    region: 'East'
  },
  {
    id: 'SAL-004',
    reseller: 'Sarah Wilson',
    resellerId: 'RES-004',
    product: 'Mobile App License',
    amount: '₹999',
    commission: '₹100',
    date: '2024-01-18',
    status: 'Completed',
    customer: 'Digital Agency',
    region: 'West'
  },
  {
    id: 'SAL-005',
    reseller: 'Tom Brown',
    resellerId: 'RES-005',
    product: 'API Access Token',
    amount: '₹1,999',
    commission: '₹240',
    date: '2024-01-19',
    status: 'Failed',
    customer: 'Startup Inc',
    region: 'Central'
  }
];

const ResellerManagerSalesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');

  const filteredSales = salesData.filter(sale => {
    const matchesSearch = sale.reseller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesRegion = regionFilter === 'all' || sale.region.toLowerCase() === regionFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const totalSales = salesData.reduce((sum, sale) => 
    sale.status === 'Completed' ? sum + parseInt(sale.amount.replace(/[₹,]/g, '')) : sum, 0
  );
  
  const totalCommission = salesData.reduce((sum, sale) => 
    sale.status === 'Completed' ? sum + parseInt(sale.commission.replace(/[₹,]/g, '')) : sum, 0
  );

  const handleExportSales = () => {
    console.log('Export sales data');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Failed':
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
              <TrendingUp className="h-3 w-3 mr-1" />
              SALES OVERVIEW
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportSales}>
              <Download className="h-4 w-4 mr-1" />
              Export
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
            Sales Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze reseller sales performance
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
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{totalSales.toLocaleString()}</span>
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
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Commission Paid</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{totalCommission.toLocaleString()}</span>
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
                  <ShoppingCart className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{salesData.length}</span>
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
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Active Resellers</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {new Set(salesData.map(s => s.resellerId)).size}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reseller, product, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
                <SelectItem value="central">Central</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              More Filters
            </Button>
          </div>
        </motion.div>

        {/* Sales Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">{sale.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.reseller}</div>
                          <div className="text-sm text-muted-foreground">{sale.resellerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{sale.product}</TableCell>
                      <TableCell>{sale.customer}</TableCell>
                      <TableCell className="font-medium">{sale.amount}</TableCell>
                      <TableCell className="text-green-600 font-medium">{sale.commission}</TableCell>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.region}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(sale.status)}>
                          {sale.status}
                        </Badge>
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

export default ResellerManagerSalesPage;
