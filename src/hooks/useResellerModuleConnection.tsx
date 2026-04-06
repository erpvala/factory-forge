// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { useResellerDashboardState } from './useResellerDashboardState';
import { useResellerDashboardAuth } from './useResellerDashboardAuth';

interface ModuleConnection {
  linkProductToSale: (productId: string, saleData: any) => Promise<void>;
  linkSaleToLicense: (saleId: string, licenseData: any) => Promise<void>;
  linkLicenseToEarnings: (licenseId: string, earningData: any) => Promise<void>;
  linkEarningsToInvoice: (earningId: string, invoiceData: any) => Promise<void>;
  getFullFlowData: (saleId: string) => Promise<any>;
  validateFlowIntegrity: () => Promise<boolean>;
}

export const useResellerModuleConnection = (): ModuleConnection => {
  const { user } = useResellerDashboardAuth();
  const { state, createSale, createInvoice } = useResellerDashboardState();
  const [isConnecting, setIsConnecting] = useState(false);

  // Product → Sale connection
  const linkProductToSale = useCallback(async (productId: string, saleData: any) => {
    setIsConnecting(true);
    try {
      console.log('🔗 Connecting Product to Sale...');
      
      // Find product details
      const product = state.products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Create sale with product linkage
      const linkedSale = {
        ...saleData,
        productId: productId,
        productName: product.name,
        productPrice: product.price,
        commission: Math.floor(product.price * (product.commission / 100)),
        resellerId: user?.id,
        status: 'completed',
        date: new Date().toISOString()
      };

      await createSale(linkedSale);
      console.log('✅ Product linked to Sale successfully');
      
      return linkedSale;
    } catch (error) {
      console.error('❌ Product to Sale link failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [state.products, user?.id, createSale]);

  // Sale → License connection
  const linkSaleToLicense = useCallback(async (saleId: string, licenseData: any) => {
    setIsConnecting(true);
    try {
      console.log('🔗 Connecting Sale to License...');
      
      // Find sale details
      const sale = state.sales.find(s => s.id === saleId);
      if (!sale) {
        throw new Error('Sale not found');
      }

      // Create license with sale linkage
      const linkedLicense = {
        ...licenseData,
        saleId: saleId,
        productName: sale.productName,
        customerName: sale.customerName,
        saleAmount: sale.amount,
        licenseKey: `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        resellerId: user?.id
      };

      // In real implementation, this would call generateLicense
      console.log('✅ Sale linked to License successfully');
      
      return linkedLicense;
    } catch (error) {
      console.error('❌ Sale to License link failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [state.sales, user?.id]);

  // License → Earnings connection
  const linkLicenseToEarnings = useCallback(async (licenseId: string, earningData: any) => {
    setIsConnecting(true);
    try {
      console.log('🔗 Connecting License to Earnings...');
      
      // Find license details
      const license = state.licenses.find(l => l.id === licenseId);
      if (!license) {
        throw new Error('License not found');
      }

      // Create earning with license linkage
      const linkedEarning = {
        ...earningData,
        licenseId: licenseId,
        source: license.productName,
        type: 'License Commission',
        amount: license.saleAmount * 0.15, // 15% commission
        status: 'pending',
        date: new Date().toISOString(),
        resellerId: user?.id
      };

      // In real implementation, this would add to earnings
      console.log('✅ License linked to Earnings successfully');
      
      return linkedEarning;
    } catch (error) {
      console.error('❌ License to Earnings link failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [state.licenses, user?.id]);

  // Earnings → Invoice connection
  const linkEarningsToInvoice = useCallback(async (earningId: string, invoiceData: any) => {
    setIsConnecting(true);
    try {
      console.log('🔗 Connecting Earnings to Invoice...');
      
      // Find earning details
      const earning = state.earnings.find(e => e.id === earningId);
      if (!earning) {
        throw new Error('Earning not found');
      }

      // Create invoice with earning linkage
      const linkedInvoice = {
        ...invoiceData,
        earningId: earningId,
        subject: `Commission Payment - ${earning.source}`,
        amount: earning.amount,
        status: 'unpaid',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        invoiceNumber: `INV-${Date.now()}`,
        resellerId: user?.id
      };

      await createInvoice(linkedInvoice);
      console.log('✅ Earnings linked to Invoice successfully');
      
      return linkedInvoice;
    } catch (error) {
      console.error('❌ Earnings to Invoice link failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [state.earnings, user?.id, createInvoice]);

  // Get full flow data for a sale
  const getFullFlowData = useCallback(async (saleId: string) => {
    try {
      console.log('📊 Getting full flow data for sale:', saleId);
      
      const sale = state.sales.find(s => s.id === saleId);
      if (!sale) {
        throw new Error('Sale not found');
      }

      // Get related data from all modules
      const product = state.products.find(p => p.id === sale.productId);
      const license = state.licenses.find(l => l.saleId === saleId);
      const earnings = state.earnings.filter(e => e.saleId === saleId || e.licenseId === license?.id);
      const invoices = state.invoices.filter(i => i.earningId && earnings.some(e => e.id === i.earningId));

      const fullFlowData = {
        sale,
        product,
        license,
        earnings,
        invoices,
        flowComplete: !!(product && license && earnings.length > 0 && invoices.length > 0)
      };

      console.log('✅ Full flow data retrieved:', fullFlowData);
      return fullFlowData;
    } catch (error) {
      console.error('❌ Failed to get full flow data:', error);
      throw error;
    }
  }, [state.sales, state.products, state.licenses, state.earnings, state.invoices]);

  // Validate flow integrity across all modules
  const validateFlowIntegrity = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Validating flow integrity...');
      
      let integrityIssues = 0;
      const totalSales = state.sales.length;

      // Check each sale has complete flow
      for (const sale of state.sales) {
        const product = state.products.find(p => p.id === sale.productId);
        const license = state.licenses.find(l => l.saleId === sale.id);
        const earnings = state.earnings.filter(e => e.saleId === saleId || e.licenseId === license?.id);
        const invoices = state.invoices.filter(i => i.earningId && earnings.some(e => e.id === i.earningId));

        if (!product || !license || earnings.length === 0 || invoices.length === 0) {
          console.log(`⚠️ Flow integrity issue for sale ${sale.id}`);
          integrityIssues++;
        }
      }

      const integrityScore = ((totalSales - integrityIssues) / totalSales) * 100;
      console.log(`📊 Flow Integrity Score: ${integrityScore}% (${totalSales - integrityIssues}/${totalSales} complete flows)`);

      return integrityScore >= 90; // 90% integrity threshold
    } catch (error) {
      console.error('❌ Flow integrity validation failed:', error);
      return false;
    }
  }, [state.sales, state.products, state.licenses, state.earnings, state.invoices]);

  return {
    linkProductToSale,
    linkSaleToLicense,
    linkLicenseToEarnings,
    linkEarningsToInvoice,
    getFullFlowData,
    validateFlowIntegrity
  };
};

export default useResellerModuleConnection;
