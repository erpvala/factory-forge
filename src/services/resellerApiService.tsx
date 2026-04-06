// @ts-nocheck
import { useResellerDashboardStore } from '@/store/resellerDashboardStore';

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API simulation layer for backend-like interaction
interface ResellerApiService {
  // Customer APIs
  getCustomers: (resellerId: string, page?: number, limit?: number) => Promise<PaginatedResponse<any>>;
  getCustomer: (customerId: string) => Promise<ApiResponse<any>>;
  createCustomer: (customerData: any) => Promise<ApiResponse<any>>;
  updateCustomer: (customerId: string, updates: any) => Promise<ApiResponse<any>>;
  deleteCustomer: (customerId: string) => Promise<ApiResponse<any>>;

  // Product APIs
  getProducts: (page?: number, limit?: number) => Promise<PaginatedResponse<any>>;
  getProduct: (productId: string) => Promise<ApiResponse<any>>;
  createProduct: (productData: any) => Promise<ApiResponse<any>>;
  updateProduct: (productId: string, updates: any) => Promise<ApiResponse<any>>;
  deleteProduct: (productId: string) => Promise<ApiResponse<any>>;

  // License APIs
  getLicenses: (resellerId: string, page?: number, limit?: number) => Promise<PaginatedResponse<any>>;
  getLicense: (licenseId: string) => Promise<ApiResponse<any>>;
  createLicense: (licenseData: any) => Promise<ApiResponse<any>>;
  updateLicense: (licenseId: string, updates: any) => Promise<ApiResponse<any>>;
  deleteLicense: (licenseId: string) => Promise<ApiResponse<any>>;
  renewLicense: (licenseId: string) => Promise<ApiResponse<any>>;
  revokeLicense: (licenseId: string) => Promise<ApiResponse<any>>;

  // Sale APIs
  getSales: (resellerId: string, page?: number, limit?: number) => Promise<PaginatedResponse<any>>;
  getSale: (saleId: string) => Promise<ApiResponse<any>>;
  createSale: (saleData: any) => Promise<ApiResponse<any>>;
  updateSale: (saleId: string, updates: any) => Promise<ApiResponse<any>>;
  deleteSale: (saleId: string) => Promise<ApiResponse<any>>;

  // Earnings APIs
  getEarnings: (resellerId: string, page?: number, limit?: number) => Promise<PaginatedResponse<any>>;
  getEarning: (earningId: string) => Promise<ApiResponse<any>>;
  createEarning: (earningData: any) => Promise<ApiResponse<any>>;
  updateEarning: (earningId: string, updates: any) => Promise<ApiResponse<any>>;
  deleteEarning: (earningId: string) => Promise<ApiResponse<any>>;
  requestPayout: (earningIds: string[]) => Promise<ApiResponse<any>>;

  // Invoice APIs
  getInvoices: (resellerId: string, page?: number, limit?: number) => Promise<PaginatedResponse<any>>;
  getInvoice: (invoiceId: string) => Promise<ApiResponse<any>>;
  createInvoice: (invoiceData: any) => Promise<ApiResponse<any>>;
  updateInvoice: (invoiceId: string, updates: any) => Promise<ApiResponse<any>>;
  deleteInvoice: (invoiceId: string) => Promise<ApiResponse<any>>;
  sendInvoice: (invoiceId: string) => Promise<ApiResponse<any>>;
  downloadInvoice: (invoiceId: string) => Promise<ApiResponse<Blob>>;
}

export const useResellerApiService = (): ResellerApiService => {
  const {
    customers,
    products,
    licenses,
    sales,
    earnings,
    invoices,
    addCustomer,
    updateCustomer: storeUpdateCustomer,
    deleteCustomer: storeDeleteCustomer,
    addProduct,
    updateProduct: storeUpdateProduct,
    deleteProduct: storeDeleteProduct,
    addLicense,
    updateLicense: storeUpdateLicense,
    deleteLicense: storeDeleteLicense,
    addSale,
    updateSale: storeUpdateSale,
    deleteSale: storeDeleteSale,
    addEarning,
    updateEarning: storeUpdateEarning,
    deleteEarning: storeDeleteEarning,
    addInvoice,
    updateInvoice: storeUpdateInvoice,
    deleteInvoice: storeDeleteInvoice
  } = useResellerDashboardStore();

  // Simulate API delay and random errors
  const simulateApiCall = async <T,>(
    success: boolean = true,
    data?: T,
    error?: string,
    delay: number = 800
  ): Promise<ApiResponse<T>> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 400));

    // Simulate random errors (5% chance)
    if (!success || Math.random() < 0.05) {
      return {
        success: false,
        error: error || 'Simulated API error occurred'
      };
    }

    return {
      success: true,
      data,
      message: 'Operation completed successfully'
    };
  };

  // Simulate pagination
  const paginateResults = <T,>(data: T[], page: number = 1, limit: number = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit)
      }
    };
  };

  // Customer APIs
  const getCustomers = async (resellerId: string, page: number = 1, limit: number = 10) => {
    const filteredCustomers = customers.filter(c => c.resellerId === resellerId);
    return paginateResults(filteredCustomers, page, limit);
  };

  const getCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return await simulateApiCall(false, undefined, 'Customer not found');
    }
    return await simulateApiCall(true, customer);
  };

  const createCustomer = async (customerData: any) => {
    try {
      const newCustomer = {
        ...customerData,
        id: `cust-${Date.now()}`,
        joinDate: new Date().toISOString(),
        totalSpent: 0,
        activeLicenses: 0
      };
      
      await addCustomer(newCustomer);
      return await simulateApiCall(true, newCustomer);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to create customer');
    }
  };

  const updateCustomer = async (customerId: string, updates: any) => {
    try {
      await storeUpdateCustomer(customerId, updates);
      const updatedCustomer = customers.find(c => c.id === customerId);
      return await simulateApiCall(true, updatedCustomer);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to update customer');
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      await storeDeleteCustomer(customerId);
      return await simulateApiCall(true, { id: customerId });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to delete customer');
    }
  };

  // Product APIs
  const getProducts = async (page: number = 1, limit: number = 10) => {
    return paginateResults(products, page, limit);
  };

  const getProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      return await simulateApiCall(false, undefined, 'Product not found');
    }
    return await simulateApiCall(true, product);
  };

  const createProduct = async (productData: any) => {
    try {
      const newProduct = {
        ...productData,
        id: `prod-${Date.now()}`,
        activeLicenses: 0
      };
      
      await addProduct(newProduct);
      return await simulateApiCall(true, newProduct);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to create product');
    }
  };

  const updateProduct = async (productId: string, updates: any) => {
    try {
      await storeUpdateProduct(productId, updates);
      const updatedProduct = products.find(p => p.id === productId);
      return await simulateApiCall(true, updatedProduct);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to update product');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await storeDeleteProduct(productId);
      return await simulateApiCall(true, { id: productId });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to delete product');
    }
  };

  // License APIs
  const getLicenses = async (resellerId: string, page: number = 1, limit: number = 10) => {
    const filteredLicenses = licenses.filter(l => l.resellerId === resellerId);
    return paginateResults(filteredLicenses, page, limit);
  };

  const getLicense = async (licenseId: string) => {
    const license = licenses.find(l => l.id === licenseId);
    if (!license) {
      return await simulateApiCall(false, undefined, 'License not found');
    }
    return await simulateApiCall(true, license);
  };

  const createLicense = async (licenseData: any) => {
    try {
      const newLicense = {
        ...licenseData,
        id: `lic-${Date.now()}`,
        licenseKey: `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString()
      };
      
      await addLicense(newLicense);
      return await simulateApiCall(true, newLicense);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to create license');
    }
  };

  const updateLicense = async (licenseId: string, updates: any) => {
    try {
      await storeUpdateLicense(licenseId, updates);
      const updatedLicense = licenses.find(l => l.id === licenseId);
      return await simulateApiCall(true, updatedLicense);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to update license');
    }
  };

  const deleteLicense = async (licenseId: string) => {
    try {
      await storeDeleteLicense(licenseId);
      return await simulateApiCall(true, { id: licenseId });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to delete license');
    }
  };

  const renewLicense = async (licenseId: string) => {
    try {
      const newExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await storeUpdateLicense(licenseId, { 
        status: 'active', 
        expiryDate: newExpiryDate 
      });
      const updatedLicense = licenses.find(l => l.id === licenseId);
      return await simulateApiCall(true, updatedLicense);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to renew license');
    }
  };

  const revokeLicense = async (licenseId: string) => {
    try {
      await storeUpdateLicense(licenseId, { status: 'suspended' });
      const updatedLicense = licenses.find(l => l.id === licenseId);
      return await simulateApiCall(true, updatedLicense);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to revoke license');
    }
  };

  // Sale APIs
  const getSales = async (resellerId: string, page: number = 1, limit: number = 10) => {
    const filteredSales = sales.filter(s => s.resellerId === resellerId);
    return paginateResults(filteredSales, page, limit);
  };

  const getSale = async (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
      return await simulateApiCall(false, undefined, 'Sale not found');
    }
    return await simulateApiCall(true, sale);
  };

  const createSale = async (saleData: any) => {
    try {
      const newSale = {
        ...saleData,
        id: `sale-${Date.now()}`,
        invoiceNumber: `INV-${Date.now()}`,
        date: new Date().toISOString()
      };
      
      await addSale(newSale);
      return await simulateApiCall(true, newSale);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to create sale');
    }
  };

  const updateSale = async (saleId: string, updates: any) => {
    try {
      await storeUpdateSale(saleId, updates);
      const updatedSale = sales.find(s => s.id === saleId);
      return await simulateApiCall(true, updatedSale);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to update sale');
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      await storeDeleteSale(saleId);
      return await simulateApiCall(true, { id: saleId });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to delete sale');
    }
  };

  // Earnings APIs
  const getEarnings = async (resellerId: string, page: number = 1, limit: number = 10) => {
    const filteredEarnings = earnings.filter(e => e.resellerId === resellerId);
    return paginateResults(filteredEarnings, page, limit);
  };

  const getEarning = async (earningId: string) => {
    const earning = earnings.find(e => e.id === earningId);
    if (!earning) {
      return await simulateApiCall(false, undefined, 'Earning not found');
    }
    return await simulateApiCall(true, earning);
  };

  const createEarning = async (earningData: any) => {
    try {
      const newEarning = {
        ...earningData,
        id: `earn-${Date.now()}`,
        date: new Date().toISOString()
      };
      
      await addEarning(newEarning);
      return await simulateApiCall(true, newEarning);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to create earning');
    }
  };

  const updateEarning = async (earningId: string, updates: any) => {
    try {
      await storeUpdateEarning(earningId, updates);
      const updatedEarning = earnings.find(e => e.id === earningId);
      return await simulateApiCall(true, updatedEarning);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to update earning');
    }
  };

  const deleteEarning = async (earningId: string) => {
    try {
      await storeDeleteEarning(earningId);
      return await simulateApiCall(true, { id: earningId });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to delete earning');
    }
  };

  const requestPayout = async (earningIds: string[]) => {
    try {
      // Mark earnings as paid
      for (const earningId of earningIds) {
        await storeUpdateEarning(earningId, { status: 'paid' });
      }
      return await simulateApiCall(true, { 
        payoutId: `payout-${Date.now()}`,
        amount: earningIds.length * 1000, // Simulated amount
        status: 'processed'
      });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to process payout');
    }
  };

  // Invoice APIs
  const getInvoices = async (resellerId: string, page: number = 1, limit: number = 10) => {
    const filteredInvoices = invoices.filter(i => i.resellerId === resellerId);
    return paginateResults(filteredInvoices, page, limit);
  };

  const getInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) {
      return await simulateApiCall(false, undefined, 'Invoice not found');
    }
    return await simulateApiCall(true, invoice);
  };

  const createInvoice = async (invoiceData: any) => {
    try {
      const newInvoice = {
        ...invoiceData,
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-${Date.now()}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      await addInvoice(newInvoice);
      return await simulateApiCall(true, newInvoice);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to create invoice');
    }
  };

  const updateInvoice = async (invoiceId: string, updates: any) => {
    try {
      await storeUpdateInvoice(invoiceId, updates);
      const updatedInvoice = invoices.find(i => i.id === invoiceId);
      return await simulateApiCall(true, updatedInvoice);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to update invoice');
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      await storeDeleteInvoice(invoiceId);
      return await simulateApiCall(true, { id: invoiceId });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to delete invoice');
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    try {
      await storeUpdateInvoice(invoiceId, { status: 'sent' });
      const updatedInvoice = invoices.find(i => i.id === invoiceId);
      return await simulateApiCall(true, { 
        ...updatedInvoice,
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to send invoice');
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) {
        return await simulateApiCall(false, undefined, 'Invoice not found');
      }
      
      // Simulate PDF generation
      const pdfContent = `Invoice: ${invoice.invoiceNumber}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      
      return await simulateApiCall(true, blob);
    } catch (error) {
      return await simulateApiCall(false, undefined, 'Failed to download invoice');
    }
  };

  return {
    // Customer APIs
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,

    // Product APIs
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,

    // License APIs
    getLicenses,
    getLicense,
    createLicense,
    updateLicense,
    deleteLicense,
    renewLicense,
    revokeLicense,

    // Sale APIs
    getSales,
    getSale,
    createSale,
    updateSale,
    deleteSale,

    // Earnings APIs
    getEarnings,
    getEarning,
    createEarning,
    updateEarning,
    deleteEarning,
    requestPayout,

    // Invoice APIs
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    downloadInvoice
  };
};

export default useResellerApiService;
