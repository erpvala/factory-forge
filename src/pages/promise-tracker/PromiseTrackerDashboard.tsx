// @ts-nocheck
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PTFullLayout from '@/components/promise-tracker/PTFullLayout';

const PromiseTrackerDashboard = () => {
  return (
    <DashboardLayout>
      <PTFullLayout />
    </DashboardLayout>
  );
};

export default PromiseTrackerDashboard;
