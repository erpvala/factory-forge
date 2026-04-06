// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, Calendar, Search, Filter, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Demo data
const payoutData = [
  {
    id: 'PAY-001',
    reseller: 'John Doe',
    resellerId: 'RES-001',
    amount: '₹3,749',
    commissionPeriod: '2024-01',
    requestDate: '2024-02-01',
    status: 'Approved',
    processedDate: '2024-02-05',
    paymentMethod: 'Bank Transfer',
    transactionId: 'TXN-20240205-001',
    bankAccount: '****1234'
  },
  {
    id: 'PAY-002',
    reseller: 'Jane Smith',
    resellerId: 'RES-002',
    amount: '₹9,998',
    commissionPeriod: '2024-01',
    requestDate: '2024-02-01',
    status: 'Pending',
    processedDate: '-',
    paymentMethod: 'Bank Transfer',
    transactionId: '-',
    bankAccount: '****5678'
  },
  {
    id: 'PAY-003',
    reseller: 'Mike Johnson',
    resellerId: 'RES-003',
    amount: '₹24,998',
    commissionPeriod: '2024-01',
    requestDate: '2024-02-01',
    status: 'Processing',
    processedDate: '-',
    paymentMethod: 'Bank Transfer',
    transactionId: '-',
    bankAccount: '****9012'
  },
  {
    id: 'PAY-004',
    reseller: 'Sarah Wilson',
    resellerId: 'RES-004',
    amount: '₹999',
    commissionPeriod: '2024-01',
    requestDate: '2024-02-01',
    status: 'Rejected',
    processedDate: '2024-02-04',
    paymentMethod: 'Bank Transfer',
    transactionId: '-',
    bankAccount: '****3456'
  },
  {
    id: 'PAY-005',
    reseller: 'Tom Brown',
    resellerId: 'RES-005',
    amount: '₹2,399',
    commissionPeriod: '2024-01',
    requestDate: '2024-02-01',
    status: 'Pending',
    processedDate: '-',
    paymentMethod: 'Bank Transfer',
    transactionId: '-',
    bankAccount: '****7890'
  }
];

const ResellerManagerPayoutPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  const filteredPayouts = payoutData.filter(payout => {
    const matchesSearch = payout.reseller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.resellerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const totalPayoutAmount = payoutData
    .filter(p => p.status === 'Approved')
    .reduce((sum, payout) => sum + parseInt(payout.amount.replace(/[₹,]/g, '')), 0);

  const pendingPayoutAmount = payoutData
    .filter(p => p.status === 'Pending' || p.status === 'Processing')
    .reduce((sum, payout) => sum + parseInt(payout.amount.replace(/[₹,]/g, '')), 0);

  const handleApprovePayout = (payoutId: string) => {
    console.log('Approve payout:', payoutId);
  };

  const handleRejectPayout = (payoutId: string) => {
    console.log('Reject payout:', payoutId);
  };

  const handleProcessPayout = (payoutId: string) => {
    console.log('Process payout:', payoutId);
  };

  const handleExportPayouts = () => {
    console.log('Export payout data');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Processing':
        return <CreditCard className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              <CreditCard className="h-3 w-3 mr-1" />
              PAYOUT MANAGEMENT
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportPayouts}>
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
            Payout Management
          </h1>
          <p className="text-muted-foreground">
            Process and manage reseller commission payouts
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
                  <span className="text-sm text-muted-foreground">Total Payouts</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{totalPayoutAmount.toLocaleString()}</span>
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
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{pendingPayoutAmount.toLocaleString()}</span>
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
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Approved</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {payoutData.filter(p => p.status === 'Approved').length}
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
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Rejected</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {payoutData.filter(p => p.status === 'Rejected').length}
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
                placeholder="Search by reseller, transaction ID..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              More Filters
            </Button>
          </div>
        </motion.div>

        {/* Payouts Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission Period</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-sm">{payout.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.reseller}</div>
                          <div className="text-sm text-muted-foreground">{payout.resellerId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{payout.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payout.commissionPeriod}</Badge>
                      </TableCell>
                      <TableCell>{payout.requestDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{payout.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(payout.status)}
                            <span>{payout.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{payout.processedDate}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPayout(payout)}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Payout Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Payout ID</label>
                                    <p className="text-sm text-muted-foreground">{payout.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Reseller</label>
                                    <p className="text-sm text-muted-foreground">{payout.reseller}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Amount</label>
                                    <p className="text-sm font-medium">{payout.amount}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge className={getStatusColor(payout.status)}>
                                      {payout.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Bank Account</label>
                                  <p className="text-sm text-muted-foreground">{payout.bankAccount}</p>
                                </div>
                                {payout.transactionId !== '-' && (
                                  <div>
                                    <label className="text-sm font-medium">Transaction ID</label>
                                    <p className="text-sm font-mono text-muted-foreground">{payout.transactionId}</p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  {payout.status === 'Pending' && (
                                    <>
                                      <Button size="sm" onClick={() => handleApprovePayout(payout.id)}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Approve
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => handleRejectPayout(payout.id)}>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {payout.status === 'Approved' && (
                                    <Button size="sm" onClick={() => handleProcessPayout(payout.id)}>
                                      <CreditCard className="h-3 w-3 mr-1" />
                                      Process
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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

export default ResellerManagerPayoutPage;
