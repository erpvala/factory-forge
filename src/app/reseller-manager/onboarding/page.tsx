// @ts-nocheck
import React from 'react';
import { RMApplicationsQueue } from '@/components/reseller-manager/RMApplicationsQueue';
import { motion } from 'framer-motion';
import { UserPlus, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ResellerManagerOnboardingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              <UserPlus className="h-3 w-3 mr-1" />
              ONBOARDING QUEUE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <TrendingUp className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Reseller Onboarding
          </h1>
          <p className="text-muted-foreground">
            Review and approve new reseller applications
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
            <span className="text-2xl font-bold text-foreground">7</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Approved Today</span>
            </div>
            <span className="text-2xl font-bold text-foreground">3</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Approval Rate</span>
            </div>
            <span className="text-2xl font-bold text-foreground">68%</span>
          </motion.div>
        </div>

        {/* Applications Queue Component */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RMApplicationsQueue />
        </motion.div>
      </div>
    </div>
  );
};

export default ResellerManagerOnboardingPage;
