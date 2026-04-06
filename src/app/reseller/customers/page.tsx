// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  Calendar, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useResellerState } from '@/hooks/useResellerState';
import { useResellerFormValidation } from '@/hooks/useResellerFormValidation';
import { useResellerSearchFilter } from '@/hooks/useResellerSearchFilter';
import { useResellerLoggingNotification, useResellerActionLogger } from '@/hooks/useResellerLoggingNotification';
import { useResellerWorkflowAutomation } from '@/hooks/useResellerWorkflowAutomation';
import { useResellerPerformanceSecurity } from '@/hooks/useResellerPerformanceSecurity';
import { useResellerEventFlow } from '@/hooks/useResellerEventFlow';
import { useResellerDashboardStore } from '@/store/resellerDashboardStore';
import { useResellerApiService } from '@/services/resellerApiService';
import { useResellerFormValidation, ResellerFormValidationRules } from '@/hooks/useResellerFormValidation';
import { useResellerErrorHandling } from '@/hooks/useResellerErrorHandling';

const ResellerCustomersPage: React.FC = () => {
  const { user, isAuthenticated } = useResellerDashboardAuth();
  const { customers, loading, error } = useResellerDashboardStore();
  const { filteredData } = useResellerRoleAuth();
  const { customerAdd } = useResellerEventFlow();
  const { createCustomer, getCustomers } = useResellerApiService();
  const { handleRuntimeError, handleValidationError, safeAsyncAction, clearCurrentError } = useResellerErrorHandling();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form validation setup
  const formValidation = useResellerFormValidation(
    {
      name: '',
      email: '',
      phone: '',
      company: '',
      location: ''
    },
    ResellerFormValidationRules.customer
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      // Load customers via API service
      getCustomers(user.id);
    }
  }, [isAuthenticated, user, getCustomers]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your customers.</p>
        </div>
      </div>
    );
  }

  const filteredCustomers = filteredData(customers).filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddCustomer = async () => {
    setShowAddModal(true);
  };

  const handleCustomerFormSubmit = async () => {
    if (!formValidation.validateForm()) {
      handleValidationError('Please fix the validation errors before submitting');
      return;
    }

    const result = await safeAsyncAction(async () => {
      const response = await createCustomer(formValidation.formData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create customer');
      }
      
      console.log('✅ Customer created successfully via API');
      
      // Also trigger event flow for additional processing
      await customerAdd(formValidation.formData);
      
      // Refresh customer list
      if (user) {
        await getCustomers(user.id);
      }
      
      return response;
    }, 'create-customer');

    if (result) {
      // Success - close modal and reset form
      setShowAddModal(false);
      formValidation.resetForm();
      clearCurrentError();
    }
  };

  const handleViewCustomer = (customerId: string) => {
    // Navigate to customer details
    console.log('View customer:', customerId);
  };

  const handleEditCustomer = (customerId: string) => {
    // Navigate to edit customer form
    console.log('Edit customer:', customerId);
  };

  const handleEmailCustomer = (customerId: string) => {
    // Send email to customer
    console.log('Email customer:', customerId);
  };

  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const newCustomersThisMonth = customers.filter(c => {
    const joinDate = new Date(c.joinDate);
    const currentDate = new Date();
    return joinDate.getMonth() === currentDate.getMonth() && 
           joinDate.getFullYear() === currentDate.getFullYear();
  }).length;

  const totalCustomerValue = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);
  const averageCustomerValue = customers.length > 0 ? totalCustomerValue / customers.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formValidation.formData.name as string}
                  onChange={(e) => formValidation.handleFieldChange('name', e.target.value)}
                  onBlur={() => formValidation.handleFieldBlur('name')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formValidation.errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Customer name"
                />
                {formValidation.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{formValidation.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formValidation.formData.email as string}
                  onChange={(e) => formValidation.handleFieldChange('email', e.target.value)}
                  onBlur={() => formValidation.handleFieldBlur('email')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formValidation.errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="customer@example.com"
                />
                {formValidation.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{formValidation.errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formValidation.formData.phone as string}
                  onChange={(e) => formValidation.handleFieldChange('phone', e.target.value)}
                  onBlur={() => formValidation.handleFieldBlur('phone')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formValidation.errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 555-0101"
                />
                {formValidation.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formValidation.errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formValidation.formData.company as string}
                  onChange={(e) => formValidation.handleFieldChange('company', e.target.value)}
                  onBlur={() => formValidation.handleFieldBlur('company')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formValidation.errors.company ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Company name"
                />
                {formValidation.errors.company && (
                  <p className="text-red-500 text-sm mt-1">{formValidation.errors.company}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formValidation.formData.location as string}
                  onChange={(e) => formValidation.handleFieldChange('location', e.target.value)}
                  onBlur={() => formValidation.handleFieldBlur('location')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formValidation.errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="City, Country"
                />
                {formValidation.errors.location && (
                  <p className="text-red-500 text-sm mt-1">{formValidation.errors.location}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCustomerFormSubmit}
                disabled={formValidation.isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formValidation.isSubmitting ? 'Creating...' : 'Create Customer'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  formValidation.resetForm();
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <Button onClick={handleAddCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} active customers
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+{newCustomersThisMonth} this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Currently engaged
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="default" className="text-green-600">
                {((activeCustomers / state.customers.length) * 100).toFixed(1)}% active rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageCustomerValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per customer lifetime
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+12.5% growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalCustomerValue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+18.3% growth</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
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
        <Button variant="outline" onClick={() => setFilterStatus('inactive')}>
          Inactive
        </Button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer: any) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    {customer.company && (
                      <p className="text-sm text-muted-foreground">{customer.company}</p>
                    )}
                  </div>
                </div>
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
                {customer.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {new Date(customer.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Total Spent:</span>
                  <span className="font-semibold">₹{(customer.totalSpent || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Licenses:</span>
                  <span className="text-sm">{customer.activeLicenses || 0}</span>
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleViewCustomer(customer.id)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleEditCustomer(customer.id)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEmailCustomer(customer.id)}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Add your first customer to get started'}
            </p>
            <Button onClick={handleAddCustomer}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default ResellerCustomersPage;
