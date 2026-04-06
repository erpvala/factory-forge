// @ts-nocheck
import { Reseller, Product, License, SalesRecord, Commission, Payout, Invoice } from '@/hooks/useResellerManagerState';

// Demo Data - Real SaaS Simulation
export const demoProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Software Vala Basic',
    price: 2499,
    commissionRate: 15,
    category: 'Software',
    description: 'Basic software package for small businesses',
    isActive: true,
  },
  {
    id: 'prod-002',
    name: 'Software Vala Pro',
    price: 4999,
    commissionRate: 20,
    category: 'Software',
    description: 'Professional software package with advanced features',
    isActive: true,
  },
  {
    id: 'prod-003',
    name: 'Software Vala Enterprise',
    price: 9999,
    commissionRate: 25,
    category: 'Software',
    description: 'Enterprise software solution with full support',
    isActive: true,
  },
  {
    id: 'prod-004',
    name: 'Mobile App License',
    price: 999,
    commissionRate: 10,
    category: 'Mobile',
    description: 'Mobile application license for resellers',
    isActive: true,
  },
  {
    id: 'prod-005',
    name: 'API Access Token',
    price: 1999,
    commissionRate: 12,
    category: 'API',
    description: 'API access for developers and integrators',
    isActive: true,
  },
];

export const demoResellers: Reseller[] = [
  {
    id: 'res-001',
    name: 'TechSolutions India',
    email: 'contact@techsolutions.in',
    status: 'active',
    joinDate: '2024-01-15',
    totalSales: 124750,
    commissionEarned: 24950,
    productsAssigned: ['prod-001', 'prod-002', 'prod-004'],
  },
  {
    id: 'res-002',
    name: 'Digital Services Pvt Ltd',
    email: 'info@digitalservices.com',
    status: 'active',
    joinDate: '2024-02-20',
    totalSales: 89950,
    commissionEarned: 17990,
    productsAssigned: ['prod-002', 'prod-003', 'prod-005'],
  },
  {
    id: 'res-003',
    name: 'CloudTech Solutions',
    email: 'sales@cloudtech.com',
    status: 'pending',
    joinDate: '2024-03-10',
    totalSales: 0,
    commissionEarned: 0,
    productsAssigned: [],
  },
  {
    id: 'res-004',
    name: 'InnoSoft Systems',
    email: 'business@innosoft.com',
    status: 'active',
    joinDate: '2024-01-25',
    totalSales: 149975,
    commissionEarned: 29995,
    productsAssigned: ['prod-001', 'prod-003', 'prod-004', 'prod-005'],
  },
  {
    id: 'res-005',
    name: 'NextGen Technologies',
    email: 'partner@nextgen.tech',
    status: 'suspended',
    joinDate: '2024-02-05',
    totalSales: 34975,
    commissionEarned: 6995,
    productsAssigned: ['prod-001'],
  },
];

export const demoLicenses: License[] = [
  {
    id: 'lic-001',
    resellerId: 'res-001',
    productId: 'prod-001',
    clientId: 'client-001',
    licenseKey: 'SV-BASIC-2024-001-ABC123',
    status: 'active',
    generatedDate: '2024-01-20',
    expiryDate: '2025-01-20',
    usageCount: 245,
  },
  {
    id: 'lic-002',
    resellerId: 'res-001',
    productId: 'prod-002',
    clientId: 'client-002',
    licenseKey: 'SV-PRO-2024-002-DEF456',
    status: 'active',
    generatedDate: '2024-02-15',
    expiryDate: '2025-02-15',
    usageCount: 189,
  },
  {
    id: 'lic-003',
    resellerId: 'res-002',
    productId: 'prod-003',
    clientId: 'client-003',
    licenseKey: 'SV-ENT-2024-003-GHI789',
    status: 'active',
    generatedDate: '2024-03-01',
    expiryDate: '2025-03-01',
    usageCount: 412,
  },
  {
    id: 'lic-004',
    resellerId: 'res-004',
    productId: 'prod-004',
    clientId: 'client-004',
    licenseKey: 'MOB-APP-2024-004-JKL012',
    status: 'expired',
    generatedDate: '2024-01-10',
    expiryDate: '2024-04-10',
    usageCount: 567,
  },
  {
    id: 'lic-005',
    resellerId: 'res-004',
    productId: 'prod-005',
    clientId: 'client-005',
    licenseKey: 'API-TKN-2024-005-MNO345',
    status: 'active',
    generatedDate: '2024-02-28',
    expiryDate: '2025-02-28',
    usageCount: 89,
  },
];

export const demoSales: SalesRecord[] = [
  {
    id: 'sale-001',
    resellerId: 'res-001',
    productId: 'prod-001',
    amount: 2499,
    commissionAmount: 374.85,
    date: '2024-03-15',
    status: 'completed',
    clientEmail: 'client1@example.com',
  },
  {
    id: 'sale-002',
    resellerId: 'res-001',
    productId: 'prod-002',
    amount: 4999,
    commissionAmount: 999.80,
    date: '2024-03-18',
    status: 'completed',
    clientEmail: 'client2@example.com',
  },
  {
    id: 'sale-003',
    resellerId: 'res-002',
    productId: 'prod-003',
    amount: 9999,
    commissionAmount: 2499.75,
    date: '2024-03-20',
    status: 'completed',
    clientEmail: 'client3@example.com',
  },
  {
    id: 'sale-004',
    resellerId: 'res-004',
    productId: 'prod-001',
    amount: 2499,
    commissionAmount: 374.85,
    date: '2024-03-22',
    status: 'pending',
    clientEmail: 'client4@example.com',
  },
  {
    id: 'sale-005',
    resellerId: 'res-004',
    productId: 'prod-003',
    amount: 9999,
    commissionAmount: 2499.75,
    date: '2024-03-25',
    status: 'completed',
    clientEmail: 'client5@example.com',
  },
];

export const demoCommissions: Commission[] = [
  {
    id: 'comm-001',
    resellerId: 'res-001',
    period: '2024-03',
    totalSales: 7498,
    commissionRate: 17.5,
    commissionAmount: 1312.15,
    status: 'calculated',
    calculatedDate: '2024-04-01',
    paidDate: undefined,
  },
  {
    id: 'comm-002',
    resellerId: 'res-002',
    period: '2024-03',
    totalSales: 9999,
    commissionRate: 25,
    commissionAmount: 2499.75,
    status: 'paid',
    calculatedDate: '2024-04-01',
    paidDate: '2024-04-05',
  },
  {
    id: 'comm-003',
    resellerId: 'res-004',
    period: '2024-03',
    totalSales: 12498,
    commissionRate: 22.5,
    commissionAmount: 2812.05,
    status: 'pending',
    calculatedDate: '2024-04-01',
    paidDate: undefined,
  },
];

export const demoPayouts: Payout[] = [
  {
    id: 'payout-001',
    resellerId: 'res-001',
    amount: 1312.15,
    commissionIds: ['comm-001'],
    status: 'requested',
    requestedDate: '2024-04-10',
    processedDate: undefined,
    method: 'Bank Transfer',
  },
  {
    id: 'payout-002',
    resellerId: 'res-002',
    amount: 2499.75,
    commissionIds: ['comm-002'],
    status: 'approved',
    requestedDate: '2024-04-08',
    processedDate: undefined,
    method: 'PayPal',
  },
  {
    id: 'payout-003',
    resellerId: 'res-004',
    amount: 2812.05,
    commissionIds: ['comm-003'],
    status: 'processed',
    requestedDate: '2024-04-05',
    processedDate: '2024-04-12',
    method: 'Bank Transfer',
  },
];

export const demoInvoices: Invoice[] = [
  {
    id: 'inv-001',
    resellerId: 'res-001',
    amount: 1312.15,
    description: 'Commission payout for March 2024',
    status: 'sent',
    createdDate: '2024-04-10',
    dueDate: '2024-04-25',
    paidDate: undefined,
  },
  {
    id: 'inv-002',
    resellerId: 'res-002',
    amount: 2499.75,
    description: 'Commission payout for March 2024',
    status: 'paid',
    createdDate: '2024-04-08',
    dueDate: '2024-04-23',
    paidDate: '2024-04-20',
  },
  {
    id: 'inv-003',
    resellerId: 'res-004',
    amount: 2812.05,
    description: 'Commission payout for March 2024',
    status: 'draft',
    createdDate: '2024-04-12',
    dueDate: '2024-04-27',
    paidDate: undefined,
  },
  {
    id: 'inv-004',
    resellerId: 'res-001',
    amount: 500.00,
    description: 'Annual reseller fee',
    status: 'overdue',
    createdDate: '2024-03-01',
    dueDate: '2024-03-31',
    paidDate: undefined,
  },
];

// Dynamic Data Generator - Action → Instant Update
export const generateDynamicData = {
  // Generate new reseller
  generateReseller: (name: string, email: string): Reseller => ({
    id: `res-${Date.now()}`,
    name,
    email,
    status: 'pending',
    joinDate: new Date().toISOString().split('T')[0],
    totalSales: 0,
    commissionEarned: 0,
    productsAssigned: [],
  }),

  // Generate new license
  generateLicense: (resellerId: string, productId: string, clientId: string): License => {
    const product = demoProducts.find(p => p.id === productId);
    const prefix = product?.name.split(' ')[0].toUpperCase() || 'LIC';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return {
      id: `lic-${Date.now()}`,
      resellerId,
      productId,
      clientId,
      licenseKey: `${prefix}-${new Date().getFullYear()}-${random}`,
      status: 'active',
      generatedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageCount: 0,
    };
  },

  // Generate new sale
  generateSale: (resellerId: string, productId: string, clientEmail: string): SalesRecord => {
    const product = demoProducts.find(p => p.id === productId);
    const amount = product?.price || 0;
    const commissionAmount = amount * (product?.commissionRate || 0) / 100;
    
    return {
      id: `sale-${Date.now()}`,
      resellerId,
      productId,
      amount,
      commissionAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      clientEmail,
    };
  },

  // Generate new commission
  generateCommission: (resellerId: string, period: string, totalSales: number, commissionRate: number): Commission => ({
    id: `comm-${Date.now()}`,
    resellerId,
    period,
    totalSales,
    commissionRate,
    commissionAmount: totalSales * commissionRate / 100,
    status: 'calculated',
    calculatedDate: new Date().toISOString().split('T')[0],
    paidDate: undefined,
  }),

  // Generate new payout
  generatePayout: (resellerId: string, amount: number, commissionIds: string[]): Payout => ({
    id: `payout-${Date.now()}`,
    resellerId,
    amount,
    commissionIds,
    status: 'requested',
    requestedDate: new Date().toISOString().split('T')[0],
    processedDate: undefined,
    method: 'Bank Transfer',
  }),

  // Generate new invoice
  generateInvoice: (resellerId: string, amount: number, description: string): Invoice => ({
    id: `inv-${Date.now()}`,
    resellerId,
    amount,
    description,
    status: 'draft',
    createdDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paidDate: undefined,
  }),
};

// Export all demo data
export const allDemoData = {
  resellers: demoResellers,
  products: demoProducts,
  licenses: demoLicenses,
  sales: demoSales,
  commissions: demoCommissions,
  payouts: demoPayouts,
  invoices: demoInvoices,
};

export default allDemoData;
