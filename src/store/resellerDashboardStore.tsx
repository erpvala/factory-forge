// @ts-nocheck
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for state management
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  status: 'active' | 'inactive';
  joinDate: string;
  totalSpent: number;
  activeLicenses: number;
  resellerId: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'inactive';
  commission: number;
  activeLicenses: number;
}

interface License {
  id: string;
  licenseKey: string;
  customerName: string;
  productName: string;
  status: 'active' | 'expired' | 'suspended' | 'pending';
  createdAt: string;
  expiryDate: string;
  saleId?: string;
  resellerId: string;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  productName: string;
  amount: number;
  commission: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  productId?: string;
  resellerId: string;
}

interface Earning {
  id: string;
  source: string;
  type: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
  saleId?: string;
  licenseId?: string;
  resellerId: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  subject: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'draft';
  dueDate: string;
  earningId?: string;
  resellerId: string;
}

interface ResellerDashboardState {
  // Core States
  customers: Customer[];
  products: Product[];
  licenses: License[];
  sales: Sale[];
  earnings: Earning[];
  invoices: Invoice[];
  
  // UI States
  loading: boolean;
  error: string | null;
  
  // Actions - Immutable updates only
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  setLicenses: (licenses: License[]) => void;
  addLicense: (license: Omit<License, 'id'>) => void;
  updateLicense: (id: string, updates: Partial<License>) => void;
  deleteLicense: (id: string) => void;
  
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  
  setEarnings: (earnings: Earning[]) => void;
  addEarning: (earning: Omit<Earning, 'id'>) => void;
  updateEarning: (id: string, updates: Partial<Earning>) => void;
  deleteEarning: (id: string) => void;
  
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  
  // Global state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Sync actions - One update → all modules refresh
  refreshAllData: () => Promise<void>;
  resetStore: () => void;
}

// Demo data generators
const generateDemoCustomers = (): Customer[] => [
  {
    id: 'cust-001',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 555-0101',
    company: 'Acme Corporation',
    location: 'New York, USA',
    status: 'active',
    joinDate: '2024-01-15',
    totalSpent: 9999,
    activeLicenses: 1,
    resellerId: 'reseller-001'
  },
  {
    id: 'cust-002',
    name: 'Tech Solutions Inc',
    email: 'info@techsolutions.com',
    phone: '+1 555-0102',
    company: 'Tech Solutions Inc',
    location: 'San Francisco, USA',
    status: 'active',
    joinDate: '2024-02-20',
    totalSpent: 4999,
    activeLicenses: 1,
    resellerId: 'reseller-001'
  }
];

const generateDemoProducts = (): Product[] => [
  {
    id: 'prod-001',
    name: 'Premium Software Suite',
    description: 'Complete software solution for businesses',
    price: 9999,
    category: 'Software',
    status: 'active',
    commission: 15,
    activeLicenses: 45
  },
  {
    id: 'prod-002',
    name: 'Cloud Storage Pro',
    description: 'Professional cloud storage solution',
    price: 4999,
    category: 'Storage',
    status: 'active',
    commission: 20,
    activeLicenses: 32
  }
];

const generateDemoLicenses = (): License[] => [
  {
    id: 'lic-001',
    licenseKey: 'LIC-2024-ABC-123-XYZ',
    customerName: 'Acme Corporation',
    productName: 'Premium Software Suite',
    status: 'active',
    createdAt: '2024-01-15',
    expiryDate: '2025-01-15',
    saleId: 'sale-001',
    resellerId: 'reseller-001'
  },
  {
    id: 'lic-002',
    licenseKey: 'LIC-2024-DEF-456-UVW',
    customerName: 'Tech Solutions Inc',
    productName: 'Cloud Storage Pro',
    status: 'active',
    createdAt: '2024-02-20',
    expiryDate: '2025-02-20',
    saleId: 'sale-002',
    resellerId: 'reseller-001'
  }
];

const generateDemoSales = (): Sale[] => [
  {
    id: 'sale-001',
    invoiceNumber: 'INV-2024-001',
    customerName: 'Acme Corporation',
    productName: 'Premium Software Suite',
    amount: 9999,
    commission: 1499,
    status: 'completed',
    date: '2024-01-15',
    productId: 'prod-001',
    resellerId: 'reseller-001'
  },
  {
    id: 'sale-002',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Tech Solutions Inc',
    productName: 'Cloud Storage Pro',
    amount: 4999,
    commission: 999,
    status: 'completed',
    date: '2024-02-20',
    productId: 'prod-002',
    resellerId: 'reseller-001'
  }
];

const generateDemoEarnings = (): Earning[] => [
  {
    id: 'earn-001',
    source: 'Premium Software Suite',
    type: 'Commission',
    amount: 1499,
    status: 'paid',
    date: '2024-01-15',
    saleId: 'sale-001',
    resellerId: 'reseller-001'
  },
  {
    id: 'earn-002',
    source: 'Cloud Storage Pro',
    type: 'Commission',
    amount: 999,
    status: 'paid',
    date: '2024-02-20',
    saleId: 'sale-002',
    resellerId: 'reseller-001'
  }
];

const generateDemoInvoices = (): Invoice[] => [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-001',
    customerName: 'Acme Corporation',
    subject: 'Premium Software Suite License',
    amount: 9999,
    status: 'paid',
    dueDate: '2024-02-15',
    resellerId: 'reseller-001'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Tech Solutions Inc',
    subject: 'Cloud Storage Pro Subscription',
    amount: 4999,
    status: 'paid',
    dueDate: '2024-03-20',
    resellerId: 'reseller-001'
  }
];

// Create the store
export const useResellerDashboardStore = create<ResellerDashboardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      customers: [],
      products: [],
      licenses: [],
      sales: [],
      earnings: [],
      invoices: [],
      loading: false,
      error: null,

      // Customer actions - Immutable updates
      setCustomers: (customers) => set({ customers }, false, 'setCustomers'),
      
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, { ...customer, id: `cust-${Date.now()}` }]
      }), false, 'addCustomer'),

      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(customer =>
          customer.id === id ? { ...customer, ...updates } : customer
        )
      }), false, 'updateCustomer'),

      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(customer => customer.id !== id)
      }), false, 'deleteCustomer'),

      // Product actions - Immutable updates
      setProducts: (products) => set({ products }, false, 'setProducts'),
      
      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: `prod-${Date.now()}` }]
      }), false, 'addProduct'),

      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map(product =>
          product.id === id ? { ...product, ...updates } : product
        )
      }), false, 'updateProduct'),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(product => product.id !== id)
      }), false, 'deleteProduct'),

      // License actions - Immutable updates
      setLicenses: (licenses) => set({ licenses }, false, 'setLicenses'),
      
      addLicense: (license) => set((state) => ({
        licenses: [...state.licenses, { ...license, id: `lic-${Date.now()}` }]
      }), false, 'addLicense'),

      updateLicense: (id, updates) => set((state) => ({
        licenses: state.licenses.map(license =>
          license.id === id ? { ...license, ...updates } : license
        )
      }), false, 'updateLicense'),

      deleteLicense: (id) => set((state) => ({
        licenses: state.licenses.filter(license => license.id !== id)
      }), false, 'deleteLicense'),

      // Sale actions - Immutable updates
      setSales: (sales) => set({ sales }, false, 'setSales'),
      
      addSale: (sale) => set((state) => ({
        sales: [...state.sales, { ...sale, id: `sale-${Date.now()}`, invoiceNumber: `INV-${Date.now()}` }]
      }), false, 'addSale'),

      updateSale: (id, updates) => set((state) => ({
        sales: state.sales.map(sale =>
          sale.id === id ? { ...sale, ...updates } : sale
        )
      }), false, 'updateSale'),

      deleteSale: (id) => set((state) => ({
        sales: state.sales.filter(sale => sale.id !== id)
      }), false, 'deleteSale'),

      // Earning actions - Immutable updates
      setEarnings: (earnings) => set({ earnings }, false, 'setEarnings'),
      
      addEarning: (earning) => set((state) => ({
        earnings: [...state.earnings, { ...earning, id: `earn-${Date.now()}` }]
      }), false, 'addEarning'),

      updateEarning: (id, updates) => set((state) => ({
        earnings: state.earnings.map(earning =>
          earning.id === id ? { ...earning, ...updates } : earning
        )
      }), false, 'updateEarning'),

      deleteEarning: (id) => set((state) => ({
        earnings: state.earnings.filter(earning => earning.id !== id)
      }), false, 'deleteEarning'),

      // Invoice actions - Immutable updates
      setInvoices: (invoices) => set({ invoices }, false, 'setInvoices'),
      
      addInvoice: (invoice) => set((state) => ({
        invoices: [...state.invoices, { ...invoice, id: `inv-${Date.now()}`, invoiceNumber: `INV-${Date.now()}` }]
      }), false, 'addInvoice'),

      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map(invoice =>
          invoice.id === id ? { ...invoice, ...updates } : invoice
        )
      }), false, 'updateInvoice'),

      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(invoice => invoice.id !== id)
      }), false, 'deleteInvoice'),

      // Global state actions
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearError: () => set({ error: null }, false, 'clearError'),

      // Sync actions - One update → all modules refresh
      refreshAllData: async () => {
        set({ loading: true, error: null }, false, 'refreshAllData_start');
        
        try {
          // Simulate API calls
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Load all demo data
          set({
            customers: generateDemoCustomers(),
            products: generateDemoProducts(),
            licenses: generateDemoLicenses(),
            sales: generateDemoSales(),
            earnings: generateDemoEarnings(),
            invoices: generateDemoInvoices(),
            loading: false,
            error: null
          }, false, 'refreshAllData_complete');
          
          console.log('✅ All data refreshed successfully');
        } catch (error) {
          set({ 
            loading: false, 
            error: 'Failed to refresh data' 
          }, false, 'refreshAllData_error');
        }
      },

      resetStore: () => set({
        customers: [],
        products: [],
        licenses: [],
        sales: [],
        earnings: [],
        invoices: [],
        loading: false,
        error: null
      }, false, 'resetStore')
    }),
    {
      name: 'reseller-dashboard-store'
    }
  )
);

export default useResellerDashboardStore;
