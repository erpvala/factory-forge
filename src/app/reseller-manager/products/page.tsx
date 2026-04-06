// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Demo data
const products = [
  {
    id: 'PROD-001',
    name: 'Software Vala Basic',
    type: 'License',
    price: '₹2,499',
    commission: '15%',
    status: 'Active',
    assignedResellers: 45,
    totalSales: 234
  },
  {
    id: 'PROD-002',
    name: 'Software Vala Pro',
    type: 'License',
    price: '₹4,999',
    commission: '20%',
    status: 'Active',
    assignedResellers: 32,
    totalSales: 156
  },
  {
    id: 'PROD-003',
    name: 'Software Vala Enterprise',
    type: 'License',
    price: '₹9,999',
    commission: '25%',
    status: 'Active',
    assignedResellers: 18,
    totalSales: 89
  },
  {
    id: 'PROD-004',
    name: 'Mobile App License',
    type: 'Add-on',
    price: '₹999',
    commission: '10%',
    status: 'Active',
    assignedResellers: 67,
    totalSales: 412
  },
  {
    id: 'PROD-005',
    name: 'API Access Token',
    type: 'Service',
    price: '₹1,999',
    commission: '12%',
    status: 'Pending',
    assignedResellers: 0,
    totalSales: 0
  }
];

const ResellerManagerProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignProduct = (productId: string) => {
    // Handle product assignment logic
    console.log('Assign product:', productId);
  };

  const handleEditProduct = (productId: string) => {
    // Handle product edit logic
    console.log('Edit product:', productId);
  };

  const handleDeleteProduct = (productId: string) => {
    // Handle product deletion logic
    console.log('Delete product:', productId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              <Package className="h-3 w-3 mr-1" />
              PRODUCT MANAGEMENT
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
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
            Product Management
          </h1>
          <p className="text-muted-foreground">
            Manage products available for reseller distribution
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
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Products</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{products.length}</span>
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
                  <Plus className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Active Products</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {products.filter(p => p.status === 'Active').length}
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
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {products.reduce((sum, p) => sum + p.totalSales, 0)}
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
                  <Filter className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Avg Commission</span>
                </div>
                <span className="text-2xl font-bold text-foreground">16.4%</span>
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
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Products Available for Resellers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.id}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.type}</Badge>
                      </TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.commission}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.status === 'Active' ? 'default' : 'secondary'}
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.assignedResellers}</TableCell>
                      <TableCell>{product.totalSales}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignProduct(product.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProduct(product.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProduct(product.id)}
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

export default ResellerManagerProductsPage;
