// @ts-nocheck
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ResellerLayout, { ResellerLayoutWithProviders } from './layout';
import ResellerDashboardPage from './dashboard/page';
import ResellerProductsPage from './products/page';
import ResellerLicensesPage from './licenses/page';
import ResellerSalesPage from './sales/page';
import ResellerEarningsPage from './earnings/page';
import ResellerInvoicesPage from './invoices/page';
import ResellerCustomersPage from './customers/page';
import ResellerSupportPage from './support/page';
import ResellerSettingsPage from './settings/page';

const ResellerAppRouter: React.FC = () => {
  return (
    <ResellerLayoutWithProviders>
      <Routes>
        <Route element={<ResellerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ResellerDashboardPage />} />
          <Route path="products" element={<ResellerProductsPage />} />
          <Route path="licenses" element={<ResellerLicensesPage />} />
          <Route path="sales" element={<ResellerSalesPage />} />
          <Route path="earnings" element={<ResellerEarningsPage />} />
          <Route path="invoices" element={<ResellerInvoicesPage />} />
          <Route path="customers" element={<ResellerCustomersPage />} />
          <Route path="support" element={<ResellerSupportPage />} />
          <Route path="settings" element={<ResellerSettingsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </ResellerLayoutWithProviders>
  );
};

export default ResellerAppRouter;