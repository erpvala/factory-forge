// @ts-nocheck
import { useState, useEffect, useContext, createContext } from 'react';

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
}

interface Earning {
  id: string;
  source: string;
  type: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  subject: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'draft';
  dueDate: string;
}

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
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  customerName: string;
  status: 'open' | 'pending' | 'closed' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  replies: number;
}

interface ResellerState {
  products: Product[];
  licenses: License[];
  sales: Sale[];
  earnings: Earning[];
  invoices: Invoice[];
  customers: Customer[];
  supportTickets: SupportTicket[];
  isLoading: boolean;
  error: string | null;
}

interface StateContextType {
  state: ResellerState;
  refreshData: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createSale: (sale: Omit<Sale, 'id' | 'invoiceNumber'>) => Promise<void>;
  generateLicense: (license: Omit<License, 'id' | 'licenseKey'>) => Promise<void>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  createSupportTicket: (ticket: Omit<SupportTicket, 'id'>) => Promise<void>;
}

const ResellerStateContext = createContext<StateContextType | undefined>(undefined);

export const useResellerDashboardState = () => {
  const context = useContext(ResellerStateContext);
  if (!context) {
    throw new Error('useResellerDashboardState must be used within ResellerStateProvider');
  }
  return context;
};

// Demo data generators
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
  },
  {
    id: 'prod-003',
    name: 'Security Shield',
    description: 'Advanced cybersecurity protection',
    price: 7999,
    category: 'Security',
    status: 'active',
    commission: 18,
    activeLicenses: 28
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
    expiryDate: '2025-01-15'
  },
  {
    id: 'lic-002',
    licenseKey: 'LIC-2024-DEF-456-UVW',
    customerName: 'Tech Solutions Inc',
    productName: 'Cloud Storage Pro',
    status: 'active',
    createdAt: '2024-02-20',
    expiryDate: '2025-02-20'
  },
  {
    id: 'lic-003',
    licenseKey: 'LIC-2024-GHI-789-RST',
    customerName: 'Global Systems',
    productName: 'Security Shield',
    status: 'expired',
    createdAt: '2023-12-10',
    expiryDate: '2024-12-10'
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
    date: '2024-01-15'
  },
  {
    id: 'sale-002',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Tech Solutions Inc',
    productName: 'Cloud Storage Pro',
    amount: 4999,
    commission: 999,
    status: 'completed',
    date: '2024-02-20'
  },
  {
    id: 'sale-003',
    invoiceNumber: 'INV-2024-003',
    customerName: 'Global Systems',
    productName: 'Security Shield',
    amount: 7999,
    commission: 1439,
    status: 'pending',
    date: '2024-03-10'
  }
];

const generateDemoEarnings = (): Earning[] => [
  {
    id: 'earn-001',
    source: 'Premium Software Suite',
    type: 'Commission',
    amount: 1499,
    status: 'paid',
    date: '2024-01-15'
  },
  {
    id: 'earn-002',
    source: 'Cloud Storage Pro',
    type: 'Commission',
    amount: 999,
    status: 'paid',
    date: '2024-02-20'
  },
  {
    id: 'earn-003',
    source: 'Security Shield',
    type: 'Commission',
    amount: 1439,
    status: 'pending',
    date: '2024-03-10'
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
    dueDate: '2024-02-15'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Tech Solutions Inc',
    subject: 'Cloud Storage Pro Subscription',
    amount: 4999,
    status: 'paid',
    dueDate: '2024-03-20'
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2024-003',
    customerName: 'Global Systems',
    subject: 'Security Shield License',
    amount: 7999,
    status: 'unpaid',
    dueDate: '2024-04-10'
  }
];

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
    activeLicenses: 1
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
    activeLicenses: 1
  },
  {
    id: 'cust-003',
    name: 'Global Systems',
    email: 'admin@globalsystems.com',
    phone: '+1 555-0103',
    company: 'Global Systems',
    location: 'London, UK',
    status: 'inactive',
    joinDate: '2023-12-10',
    totalSpent: 7999,
    activeLicenses: 0
  }
];

const generateDemoSupportTickets = (): SupportTicket[] => [
  {
    id: 'ticket-001',
    subject: 'License Activation Issue',
    message: 'Customer unable to activate their license key',
    customerName: 'Acme Corporation',
    status: 'open',
    priority: 'high',
    createdAt: '2024-03-15',
    replies: 2
  },
  {
    id: 'ticket-002',
    subject: 'Billing Inquiry',
    message: 'Question about invoice payment methods',
    customerName: 'Tech Solutions Inc',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-03-14',
    replies: 1
  },
  {
    id: 'ticket-003',
    subject: 'Feature Request',
    message: 'Request for additional features in software',
    customerName: 'Global Systems',
    status: 'closed',
    priority: 'low',
    createdAt: '2024-03-10',
    replies: 3
  }
];

interface ResellerStateProviderProps {
  children: React.ReactNode;
}

export const ResellerStateProvider: React.FC<ResellerStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<ResellerState>({
    products: [],
    licenses: [],
    sales: [],
    earnings: [],
    invoices: [],
    customers: [],
    supportTickets: [],
    isLoading: false,
    error: null
  });

  const refreshData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setState({
        products: generateDemoProducts(),
        licenses: generateDemoLicenses(),
        sales: generateDemoSales(),
        earnings: generateDemoEarnings(),
        invoices: generateDemoInvoices(),
        customers: generateDemoCustomers(),
        supportTickets: generateDemoSupportTickets(),
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load data'
      }));
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct: Product = {
        ...product,
        id: `prod-${Date.now()}`
      };
      
      setState(prev => ({
        ...prev,
        products: [...prev.products, newProduct]
      }));
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.id === id ? { ...p, ...product } : p
        )
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const createSale = async (sale: Omit<Sale, 'id' | 'invoiceNumber'>) => {
    try {
      const newSale: Sale = {
        ...sale,
        id: `sale-${Date.now()}`,
        invoiceNumber: `INV-2024-${Date.now()}`
      };
      
      setState(prev => ({
        ...prev,
        sales: [...prev.sales, newSale]
      }));
    } catch (error) {
      console.error('Failed to create sale:', error);
      throw error;
    }
  };

  const generateLicense = async (license: Omit<License, 'id' | 'licenseKey'>) => {
    try {
      const newLicense: License = {
        ...license,
        id: `lic-${Date.now()}`,
        licenseKey: `LIC-${Date.now()}-ABC-123-XYZ`
      };
      
      setState(prev => ({
        ...prev,
        licenses: [...prev.licenses, newLicense]
      }));
    } catch (error) {
      console.error('Failed to generate license:', error);
      throw error;
    }
  };

  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    try {
      const newInvoice: Invoice = {
        ...invoice,
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-2024-${Date.now()}`
      };
      
      setState(prev => ({
        ...prev,
        invoices: [...prev.invoices, newInvoice]
      }));
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      const newCustomer: Customer = {
        ...customer,
        id: `cust-${Date.now()}`
      };
      
      setState(prev => ({
        ...prev,
        customers: [...prev.customers, newCustomer]
      }));
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  };

  const createSupportTicket = async (ticket: Omit<SupportTicket, 'id'>) => {
    try {
      const newTicket: SupportTicket = {
        ...ticket,
        id: `ticket-${Date.now()}`
      };
      
      setState(prev => ({
        ...prev,
        supportTickets: [...prev.supportTickets, newTicket]
      }));
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      throw error;
    }
  };

  const value: StateContextType = {
    state,
    refreshData,
    addProduct,
    updateProduct,
    deleteProduct,
    createSale,
    generateLicense,
    createInvoice,
    addCustomer,
    createSupportTicket
  };

  return (
    <ResellerStateContext.Provider value={value}>
      {children}
    </ResellerStateContext.Provider>
  );
};

export default ResellerStateProvider;
