// @ts-nocheck
import { createContext, useContext, useReducer, ReactNode } from 'react';

// State Interfaces
interface Reseller {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  joinDate: string;
  totalSales: number;
  commissionEarned: number;
  productsAssigned: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  category: string;
  description: string;
  isActive: boolean;
}

interface License {
  id: string;
  resellerId: string;
  productId: string;
  clientId: string;
  licenseKey: string;
  status: 'active' | 'expired' | 'suspended';
  generatedDate: string;
  expiryDate: string;
  usageCount: number;
}

interface SalesRecord {
  id: string;
  resellerId: string;
  productId: string;
  amount: number;
  commissionAmount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  clientEmail: string;
}

interface Commission {
  id: string;
  resellerId: string;
  period: string;
  totalSales: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'calculated' | 'paid';
  calculatedDate: string;
  paidDate?: string;
}

interface Payout {
  id: string;
  resellerId: string;
  amount: number;
  commissionIds: string[];
  status: 'requested' | 'approved' | 'processed' | 'failed';
  requestedDate: string;
  processedDate?: string;
  method: string;
}

interface Invoice {
  id: string;
  resellerId: string;
  amount: number;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdDate: string;
  dueDate: string;
  paidDate?: string;
}

// State Shape
interface ResellerManagerState {
  resellers: Reseller[];
  products: Product[];
  licenses: License[];
  sales: SalesRecord[];
  commissions: Commission[];
  payouts: Payout[];
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

// Action Types
type ResellerManagerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESELLERS'; payload: Reseller[] }
  | { type: 'ADD_RESELLER'; payload: Reseller }
  | { type: 'UPDATE_RESELLER'; payload: { id: string; updates: Partial<Reseller> } }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; updates: Partial<Product> } }
  | { type: 'SET_LICENSES'; payload: License[] }
  | { type: 'ADD_LICENSE'; payload: License }
  | { type: 'UPDATE_LICENSE'; payload: { id: string; updates: Partial<License> } }
  | { type: 'SET_SALES'; payload: SalesRecord[] }
  | { type: 'ADD_SALE'; payload: SalesRecord }
  | { type: 'SET_COMMISSIONS'; payload: Commission[] }
  | { type: 'UPDATE_COMMISSION'; payload: { id: string; updates: Partial<Commission> } }
  | { type: 'SET_PAYOUTS'; payload: Payout[] }
  | { type: 'UPDATE_PAYOUT'; payload: { id: string; updates: Partial<Payout> } }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: { id: string; updates: Partial<Invoice> } };

// Initial State
const initialState: ResellerManagerState = {
  resellers: [],
  products: [],
  licenses: [],
  sales: [],
  commissions: [],
  payouts: [],
  invoices: [],
  loading: false,
  error: null,
};

// Reducer - Immutable Updates Only
const resellerManagerReducer = (
  state: ResellerManagerState,
  action: ResellerManagerAction
): ResellerManagerState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_RESELLERS':
      return { ...state, resellers: action.payload };

    case 'ADD_RESELLER':
      return { ...state, resellers: [...state.resellers, action.payload] };

    case 'UPDATE_RESELLER':
      return {
        ...state,
        resellers: state.resellers.map(reseller =>
          reseller.id === action.payload.id
            ? { ...reseller, ...action.payload.updates }
            : reseller
        ),
      };

    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id
            ? { ...product, ...action.payload.updates }
            : product
        ),
      };

    case 'SET_LICENSES':
      return { ...state, licenses: action.payload };

    case 'ADD_LICENSE':
      return { ...state, licenses: [...state.licenses, action.payload] };

    case 'UPDATE_LICENSE':
      return {
        ...state,
        licenses: state.licenses.map(license =>
          license.id === action.payload.id
            ? { ...license, ...action.payload.updates }
            : license
        ),
      };

    case 'SET_SALES':
      return { ...state, sales: action.payload };

    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };

    case 'SET_COMMISSIONS':
      return { ...state, commissions: action.payload };

    case 'UPDATE_COMMISSION':
      return {
        ...state,
        commissions: state.commissions.map(commission =>
          commission.id === action.payload.id
            ? { ...commission, ...action.payload.updates }
            : commission
        ),
      };

    case 'SET_PAYOUTS':
      return { ...state, payouts: action.payload };

    case 'UPDATE_PAYOUT':
      return {
        ...state,
        payouts: state.payouts.map(payout =>
          payout.id === action.payload.id
            ? { ...payout, ...action.payload.updates }
            : payout
        ),
      };

    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };

    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };

    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id
            ? { ...invoice, ...action.payload.updates }
            : invoice
        ),
      };

    default:
      return state;
  }
};

// Context
const ResellerManagerContext = createContext<{
  state: ResellerManagerState;
  dispatch: React.Dispatch<ResellerManagerAction>;
} | null>(null);

// Provider Component
interface ResellerManagerProviderProps {
  children: ReactNode;
}

export const ResellerManagerProvider: React.FC<ResellerManagerProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(resellerManagerReducer, initialState);

  return (
    <ResellerManagerContext.Provider value={{ state, dispatch }}>
      {children}
    </ResellerManagerContext.Provider>
  );
};

// Hook to use the context
export const useResellerManagerState = () => {
  const context = useContext(ResellerManagerContext);
  if (!context) {
    throw new Error('useResellerManagerState must be used within ResellerManagerProvider');
  }
  return context;
};

// Selectors - Computed values
export const useResellerManagerSelectors = () => {
  const { state } = useResellerManagerState();

  const activeResellers = state.resellers.filter(r => r.status === 'active');
  const pendingResellers = state.resellers.filter(r => r.status === 'pending');
  const activeLicenses = state.licenses.filter(l => l.status === 'active');
  const pendingPayouts = state.payouts.filter(p => p.status === 'requested' || p.status === 'approved');
  const unpaidInvoices = state.invoices.filter(i => i.status !== 'paid');

  const totalSales = state.sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCommission = state.commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);
  const totalPayouts = state.payouts
    .filter(p => p.status === 'processed')
    .reduce((sum, payout) => sum + payout.amount, 0);

  const getResellerById = (id: string) => state.resellers.find(r => r.id === id);
  const getProductById = (id: string) => state.products.find(p => p.id === id);
  const getLicensesByReseller = (resellerId: string) => state.licenses.filter(l => l.resellerId === resellerId);
  const getSalesByReseller = (resellerId: string) => state.sales.filter(s => s.resellerId === resellerId);
  const getCommissionsByReseller = (resellerId: string) => state.commissions.filter(c => c.resellerId === resellerId);
  const getPayoutsByReseller = (resellerId: string) => state.payouts.filter(p => p.resellerId === resellerId);
  const getInvoicesByReseller = (resellerId: string) => state.invoices.filter(i => i.resellerId === resellerId);

  return {
    // Computed values
    activeResellers,
    pendingResellers,
    activeLicenses,
    pendingPayouts,
    unpaidInvoices,
    totalSales,
    totalCommission,
    totalPayouts,

    // Getters
    getResellerById,
    getProductById,
    getLicensesByReseller,
    getSalesByReseller,
    getCommissionsByReseller,
    getPayoutsByReseller,
    getInvoicesByReseller,
  };
};

export default useResellerManagerState;
