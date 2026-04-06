// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign, Download, Search, Filter, Plus, Eye, Edit, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Demo data
const invoiceData = [
  {
    id: 'INV-001',
    reseller: 'John Doe',
    resellerId: 'RES-001',
    invoiceNumber: 'INV-2024-001',
    amount: '₹3,749',
    dueDate: '2024-02-15',
    status: 'Paid',
    issueDate: '2024-02-01',
    description: 'Commission for January 2024',
    items: [
      { name: 'Software Vala Basic - Commission', quantity: 10, price: '₹375' }
    ]
  },
  {
    id: 'INV-002',
    reseller: 'Jane Smith',
    resellerId: 'RES-002',
    invoiceNumber: 'INV-2024-002',
    amount: '₹9,998',
    dueDate: '2024-02-15',
    status: 'Pending',
    issueDate: '2024-02-01',
    description: 'Commission for January 2024',
    items: [
      { name: 'Software Vala Pro - Commission', quantity: 10, price: '₹1,000' }
    ]
  },
  {
    id: 'INV-003',
    reseller: 'Mike Johnson',
    resellerId: 'RES-003',
    invoiceNumber: 'INV-2024-003',
    amount: '₹24,998',
    dueDate: '2024-02-15',
    status: 'Overdue',
    issueDate: '2024-02-01',
    description: 'Commission for January 2024',
    items: [
      { name: 'Software Vala Enterprise - Commission', quantity: 10, price: '₹2,500' }
    ]
  },
  {
    id: 'INV-004',
    reseller: 'Sarah Wilson',
    resellerId: 'RES-004',
    invoiceNumber: 'INV-2024-004',
    amount: '₹999',
    dueDate: '2024-02-10',
    status: 'Paid',
    issueDate: '2024-02-01',
    description: 'Commission for January 2024',
    items: [
      { name: 'Mobile App License - Commission', quantity: 10, price: '₹100' }
    ]
  },
  {
    id: 'INV-005',
    reseller: 'Tom Brown',
    resellerId: 'RES-005',
    invoiceNumber: 'INV-2024-005',
    amount: '₹2,399',
    dueDate: '2024-02-20',
    status: 'Draft',
    issueDate: '2024-02-05',
    description: 'Commission for January 2024',
    items: [
      { name: 'API Access Token - Commission', quantity: 10, price: '₹240' }
    ]
  }
];

const ResellerManagerInvoicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const filteredInvoices = invoiceData.filter(invoice => {
    const matchesSearch = invoice.reseller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.resellerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const totalInvoiceAmount = invoiceData
    .filter(i => i.status !== 'Draft')
    .reduce((sum, invoice) => sum + parseInt(invoice.amount.replace(/[₹,]/g, '')), 0);

  const paidInvoices = invoiceData.filter(i => i.status === 'Paid').length;
  const pendingInvoices = invoiceData.filter(i => i.status === 'Pending').length;
  const overdueInvoices = invoiceData.filter(i => i.status === 'Overdue').length;

  const handleCreateInvoice = () => {
    console.log('Create new invoice');
  };

  const handleSendInvoice = (invoiceId: string) => {
    console.log('Send invoice:', invoiceId);
  };

  const handleEditInvoice = (invoiceId: string) => {
    console.log('Edit invoice:', invoiceId);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Download invoice:', invoiceId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
              <FileText className="h-3 w-3 mr-1" />
              INVOICE MANAGEMENT
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCreateInvoice}>
              <Plus className="h-4 w-4 mr-1" />
              Create Invoice
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
            Invoice Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage reseller commission invoices
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
                  <span className="text-sm text-muted-foreground">Total Invoiced</span>
                </div>
                <span className="text-2xl font-bold text-foreground">₹{totalInvoiceAmount.toLocaleString()}</span>
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
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Paid Invoices</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{paidInvoices}</span>
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
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{pendingInvoices}</span>
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
                  <Edit className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Overdue</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{overdueInvoices}</span>
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
                placeholder="Search by reseller, invoice number..."
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
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              More Filters
            </Button>
          </div>
        </motion.div>

        {/* Invoices Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Commission Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.reseller}</div>
                          <div className="text-sm text-muted-foreground">{invoice.resellerId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{invoice.amount}</TableCell>
                      <TableCell>{invoice.issueDate}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {invoice.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Invoice Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Invoice Number</label>
                                    <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Reseller</label>
                                    <p className="text-sm text-muted-foreground">{invoice.reseller}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Amount</label>
                                    <p className="text-sm font-medium">{invoice.amount}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge className={getStatusColor(invoice.status)}>
                                      {invoice.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Issue Date</label>
                                    <p className="text-sm text-muted-foreground">{invoice.issueDate}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Due Date</label>
                                    <p className="text-sm text-muted-foreground">{invoice.dueDate}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Description</label>
                                  <p className="text-sm text-muted-foreground">{invoice.description}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Items</label>
                                  <div className="space-y-2 mt-2">
                                    {invoice.items.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSendInvoice(invoice.id)}>
                                    <Send className="h-3 w-3 mr-1" />
                                    Send
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleEditInvoice(invoice.id)}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(invoice.id)}>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="h-3 w-3" />
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

export default ResellerManagerInvoicesPage;
