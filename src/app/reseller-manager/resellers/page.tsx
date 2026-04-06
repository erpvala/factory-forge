// @ts-nocheck
import React from 'react';
import { RMActiveResellers } from '@/components/reseller-manager/RMActiveResellers';
import { motion } from 'framer-motion';
import { Users, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ResellerManagerResellersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              <Users className="h-3 w-3 mr-1" />
              ACTIVE RESELLERS
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Export
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
            Active Resellers
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor all active reseller accounts
          </p>
        </motion.div>

        {/* Active Resellers Component */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RMActiveResellers />
        </motion.div>
      </div>
    </div>
  );
};

export default ResellerManagerResellersPage;
