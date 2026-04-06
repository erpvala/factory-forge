// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Percent, Search, Filter, Download, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Demo data
const commissionData = [
  {
    id: 'COM-001',
    reseller: 'John Doe',
    resellerId: 'RES-001',
    period: '2024-01',
    totalSales: '₹24,990',
    commissionRate: '15%',
    commissionEarned: '₹3,749',
    status: 'Paid',
    paidDate: '2024-02-05',
    salesCount: 10,
    targetAchieved: 125
  },
  {
    id: 'COM-002',
    reseller: 'Jane Smith',
    resellerId: 'RES-002',
    period: '2024-01',
    totalSales: '₹49,990',
    commissionRate: '20%',
    commissionEarned: '₹9,998',
    status: 'Pending',
    paidDate: '-',
    salesCount: 10,
    targetAchieved: 167
  },
  {
    id: 'COM-003',
    reseller: 'Mike Johnson',
    resellerId: 'RES-003',
    period: '2024-01',
    totalSales: '₹99,990',
    commissionRate: '25%',
    commissionEarned: '₹24,998',
    status: 'Processing',
    paidDate: '-',
    salesCount: 10,
    targetAchieved: 200
  },
  {
    id: 'COM-004',
    reseller: 'Sarah Wilson',
    resellerId: 'RES-004',
    period: '2024-01',
    totalSales: '₹9,990',
    commissionRate: '10%',
    commissionEarned: '₹999',
    status: 'Paid',
    paidDate: '2024-02-03',
    salesCount: 10,
    targetAchieved: 83
  },
  {
    id: 'COM-005',
    reseller: 'Tom Brown',
    resellerId: 'RES-005',
    period: '2024-01',
    totalSales: '₹19,990',
    commissionRate: '12%',
    commissionEarned: '₹2,399',
    status: 'Hold',
    paidDate: '-',
    salesCount: 10,
    targetAchieved: 100
  }
];

const ResellerManagerCommissionPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('2024-01');

  const filteredCommission = commissionData.filter(commission => {
    const matchesSearch = commission.reseller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.resellerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || commission.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPeriod = periodFilter === 'all' || commission.period === periodFilter;
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const totalCommission = commissionData.reduce((sum, commission) => 
    sum + parseInt(commission.commissionEarned.replace(/[₹,]/g, '')), 0
  );

  const paidCommission = commissionData
    .filter(c => c.status === 'Paid')
    .reduce((sum, commission) => sum + parseInt(commission.commissionEarned.replace(/[₹,]/g, '')), 0);

  const pendingCommission = commissionData
    .filter(c => c.status === 'Pending' || c.status === 'Processing')
    .reduce((sum, commission) => sum + parseInt(commission.commissionEarned.replace(/[₹,]/g, '')), 0);

  const handleExportCommission = () => {
    console.log('Export commission data');
  };

  const handleCalculateCommission = () => {
    console.log('Calculate commission for period');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Hold':
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
              <Percent className="h-3 w-3 mr-1" />
              COMMISSION MANAGEMENT
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCommission}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" onClick={handleCalculateCommission}>
              <Calculator className="h-4 w-4 mr-1" />
              Calculate
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
            Commission Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage reseller commission payments
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
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Commission</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{totalCommission.toLocaleString()}</span>
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
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Paid Commission</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{paidCommission.toLocaleString()}</span>
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
                  <Users className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Pending Commission</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{pendingCommission.toLocaleString()}</span>
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
                  <Percent className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Avg Rate</span>
                </div>
                <span className="text-2xl font-bold text-foreground">16.4%</span>
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
                placeholder="Search by reseller name or ID..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="2024-01">January 2024</SelectItem>
                <SelectItem value="2023-12">December 2023</SelectItem>
                <SelectItem value="2023-11">November 2023</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              More Filters
            </Button>
          </div>
        </motion.div>

        {/* Commission Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Commission Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commission ID</TableHead>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Commission Earned</TableHead>
                    <TableHead>Sales Count</TableHead>
                    <TableHead>Target Achievement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommission.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-mono text-sm">{commission.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{commission.reseller}</div>
                          <div className="text-sm text-muted-foreground">{commission.resellerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{commission.period}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{commission.totalSales}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{commission.commissionRate}</Badge>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">{commission.commissionEarned}</TableCell>
                      <TableCell>{commission.salesCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(commission.targetAchieved, 100)} className="w-16" />
                          <span className="text-sm">{commission.targetAchieved}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{commission.paidDate}</TableCell>
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

export default ResellerManagerCommissionPage;
