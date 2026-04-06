// @ts-nocheck
import { useResellerDashboardStore } from '@/store/resellerDashboardStore';

// Demo data service for real SaaS-like simulation
interface DemoDataService {
  initializeDemoData: (resellerId: string) => Promise<void>;
  generateCustomer: (resellerId: string) => Promise<any>;
  generateSale: (resellerId: string, customerId: string, productId: string) => Promise<any>;
  generateLicense: (resellerId: string, saleId: string) => Promise<any>;
  generateEarning: (resellerId: string, saleId: string) => Promise<any>;
  generateInvoice: (resellerId: string, customerId: string, amount: number) => Promise<any>;
  simulateRealTimeUpdates: (resellerId: string) => void;
}

export const useResellerDemoDataService = (): DemoDataService => {
  const {
    customers,
    products,
    licenses,
    sales,
    earnings,
    invoices,
    addCustomer,
    addSale,
    addLicense,
    addEarning,
    addInvoice,
    updateSale,
    updateLicense,
    updateEarning,
    updateInvoice,
    setLoading,
    setError
  } = useResellerDashboardStore();

  // Initialize demo data for a reseller
  const initializeDemoData = async (resellerId: string) => {
    setLoading(true);
    try {
      console.log('🔄 Initializing demo data for reseller:', resellerId);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate initial demo data
      const demoCustomers = [
        {
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+1 555-0101',
          company: 'Acme Corporation',
          location: 'New York, USA',
          status: 'active' as const,
          joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          totalSpent: 9999,
          activeLicenses: 1,
          resellerId
        },
        {
          name: 'Tech Solutions Inc',
          email: 'info@techsolutions.com',
          phone: '+1 555-0102',
          company: 'Tech Solutions Inc',
          location: 'San Francisco, USA',
          status: 'active' as const,
          joinDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          totalSpent: 14998,
          activeLicenses: 2,
          resellerId
        },
        {
          name: 'Global Systems',
          email: 'admin@globalsystems.com',
          phone: '+1 555-0103',
          company: 'Global Systems',
          location: 'London, UK',
          status: 'inactive' as const,
          joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          totalSpent: 7999,
          activeLicenses: 0,
          resellerId
        }
      ];

      const demoProducts = [
        {
          name: 'Premium Software Suite',
          description: 'Complete software solution for businesses with advanced features',
          price: 9999,
          category: 'Software',
          status: 'active' as const,
          commission: 15,
          activeLicenses: 45
        },
        {
          name: 'Cloud Storage Pro',
          description: 'Professional cloud storage solution with unlimited bandwidth',
          price: 4999,
          category: 'Storage',
          status: 'active' as const,
          commission: 20,
          activeLicenses: 32
        },
        {
          name: 'Security Shield',
          description: 'Advanced cybersecurity protection for enterprise systems',
          price: 7999,
          category: 'Security',
          status: 'active' as const,
          commission: 18,
          activeLicenses: 28
        }
      ];

      // Add demo customers
      for (const customer of demoCustomers) {
        await addCustomer(customer);
      }

      // Add demo products (products are global, not reseller-specific)
      for (const product of demoProducts) {
        // Products would be managed globally in a real system
        console.log('✅ Product available:', product.name);
      }

      console.log('✅ Demo data initialized successfully');
    } catch (error) {
      setError('Failed to initialize demo data');
      console.error('❌ Demo data initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate a new customer with dynamic behavior
  const generateCustomer = async (resellerId: string) => {
    const customerNames = [
      'Innovation Labs', 'Digital Dynamics', 'Future Systems', 'Smart Solutions',
      'Tech Ventures', 'Cloud Nine', 'Data Masters', 'Cyber Security Pro'
    ];
    
    const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const randomDomain = randomName.toLowerCase().replace(/\s+/g, '');
    
    const newCustomer = {
      name: randomName,
      email: `contact@${randomDomain}.com`,
      phone: `+1 555-${Math.floor(Math.random() * 9000) + 1000}`,
      company: randomName,
      location: ['New York, USA', 'San Francisco, USA', 'London, UK', 'Tokyo, Japan'][Math.floor(Math.random() * 4)],
      status: 'active' as const,
      joinDate: new Date().toISOString(),
      totalSpent: 0,
      activeLicenses: 0,
      resellerId
    };

    await addCustomer(newCustomer);
    console.log('✅ New customer generated:', newCustomer.name);
    return newCustomer;
  };

  // Generate a new sale with dynamic values
  const generateSale = async (resellerId: string, customerId: string, productId: string) => {
    const customer = customers.find(c => c.id === customerId);
    const productPrices = { 'prod-001': 9999, 'prod-002': 4999, 'prod-003': 7999 };
    const productNames = { 'prod-001': 'Premium Software Suite', 'prod-002': 'Cloud Storage Pro', 'prod-003': 'Security Shield' };
    const commissions = { 'prod-001': 15, 'prod-002': 20, 'prod-003': 18 };

    const price = productPrices[productId as keyof typeof productPrices] || 9999;
    const commission = Math.floor(price * (commissions[productId as keyof typeof commissions] / 100));

    const newSale = {
      customerName: customer?.name || 'Unknown Customer',
      productName: productNames[productId as keyof typeof productNames] || 'Unknown Product',
      amount: price,
      commission,
      status: 'completed' as const,
      date: new Date().toISOString(),
      productId,
      resellerId
    };

    const sale = await addSale(newSale);
    
    // Update customer total spent
    if (customer) {
      const updatedTotalSpent = customer.totalSpent + price;
      const updatedActiveLicenses = customer.activeLicenses + 1;
      
      // In a real implementation, this would update the customer
      console.log('✅ Customer updated:', customer.name, 'Total spent:', updatedTotalSpent);
    }

    console.log('✅ New sale generated:', newSale.productName, 'Amount:', newSale.amount);
    return newSale;
  };

  // Generate a new license with dynamic behavior
  const generateLicense = async (resellerId: string, saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    
    const newLicense = {
      customerName: sale?.customerName || 'Unknown Customer',
      productName: sale?.productName || 'Unknown Product',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      saleId,
      resellerId
    };

    const license = await addLicense(newLicense);
    console.log('✅ New license generated:', newLicense.productName);
    return newLicense;
  };

  // Generate new earnings with dynamic values
  const generateEarning = async (resellerId: string, saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    
    const newEarning = {
      source: sale?.productName || 'Unknown Product',
      type: 'Commission',
      amount: sale?.commission || 0,
      status: 'pending' as const,
      date: new Date().toISOString(),
      saleId,
      resellerId
    };

    const earning = await addEarning(newEarning);
    
    // Simulate earning status change after delay
    setTimeout(() => {
      updateEarning(earning.id, { status: 'paid' });
      console.log('✅ Earning marked as paid:', earning.source);
    }, 5000);

    console.log('✅ New earning generated:', newEarning.source, 'Amount:', newEarning.amount);
    return newEarning;
  };

  // Generate new invoice with dynamic behavior
  const generateInvoice = async (resellerId: string, customerId: string, amount: number) => {
    const customer = customers.find(c => c.id === customerId);
    
    const newInvoice = {
      customerName: customer?.name || 'Unknown Customer',
      subject: `Payment for services`,
      amount,
      status: 'unpaid' as const,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      resellerId
    };

    const invoice = await addInvoice(newInvoice);
    
    // Simulate invoice status changes
    setTimeout(() => {
      updateInvoice(invoice.id, { status: 'paid' });
      console.log('✅ Invoice marked as paid:', invoice.invoiceNumber);
    }, 8000);

    console.log('✅ New invoice generated:', invoice.invoiceNumber, 'Amount:', invoice.amount);
    return newInvoice;
  };

  // Simulate real-time updates
  const simulateRealTimeUpdates = (resellerId: string) => {
    console.log('🔄 Starting real-time simulation...');

    // Simulate periodic updates
    setInterval(() => {
      const randomAction = Math.random();
      
      if (randomAction < 0.3) {
        // 30% chance of new customer
        generateCustomer(resellerId);
      } else if (randomAction < 0.6) {
        // 30% chance of new sale
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        const randomProductId = ['prod-001', 'prod-002', 'prod-003'][Math.floor(Math.random() * 3)];
        if (randomCustomer) {
          generateSale(resellerId, randomCustomer.id, randomProductId);
        }
      } else if (randomAction < 0.8) {
        // 20% chance of earning status update
        const pendingEarnings = earnings.filter(e => e.status === 'pending');
        if (pendingEarnings.length > 0) {
          const randomEarning = pendingEarnings[Math.floor(Math.random() * pendingEarnings.length)];
          updateEarning(randomEarning.id, { status: 'paid' });
          console.log('✅ Real-time: Earning paid:', randomEarning.source);
        }
      } else {
        // 20% chance of invoice status update
        const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
        if (unpaidInvoices.length > 0) {
          const randomInvoice = unpaidInvoices[Math.floor(Math.random() * unpaidInvoices.length)];
          updateInvoice(randomInvoice.id, { status: 'paid' });
          console.log('✅ Real-time: Invoice paid:', randomInvoice.invoiceNumber);
        }
      }
    }, 15000); // Every 15 seconds
  };

  return {
    initializeDemoData,
    generateCustomer,
    generateSale,
    generateLicense,
    generateEarning,
    generateInvoice,
    simulateRealTimeUpdates
  };
};

export default useResellerDemoDataService;
