// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, Shield, Users, UserCheck,
  Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDemoRoleAccounts } from '@/services/demoRoleRegistry';

// ============================================
// DEMO LOGIN PAGE - ONE-CLICK TESTING
// ============================================

interface DemoAccount {
  id: string;
  role: string;
  email: string;
  password: string;
  icon: typeof Crown;
  color: string;
  description: string;
  redirectPath: string;
  tier: 'master' | 'admin' | 'manager' | 'staff';
}

const TIER_ICON: Record<DemoAccount['tier'], typeof Crown> = {
  master: Crown,
  admin: Shield,
  manager: Users,
  staff: UserCheck,
};

const TIER_COLOR: Record<DemoAccount['tier'], string> = {
  master: 'from-purple-500 to-purple-700',
  admin: 'from-amber-500 to-orange-600',
  manager: 'from-blue-500 to-blue-700',
  staff: 'from-emerald-500 to-emerald-700',
};

const DEMO_ACCOUNTS: DemoAccount[] = getDemoRoleAccounts().map((account) => ({
  ...account,
  icon: TIER_ICON[account.tier],
  color: TIER_COLOR[account.tier],
}));

const DemoLogin = () => {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleDemoLogin = async (account: DemoAccount) => {
    setLoadingId(account.id);
    
    try {
      // Sign out first to clear any existing session
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error(`Demo account not created yet. Please create: ${account.email}`);
        } else {
          toast.error(error.message);
        }
        setLoadingId(null);
        return;
      }

      setSuccessId(account.id);
      toast.success(`Logged in as ${account.role}`);
      
      setTimeout(() => {
        navigate(account.redirectPath);
      }, 500);
    } catch (err) {
      toast.error('Login failed');
      setLoadingId(null);
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'master': return { label: 'ROOT', color: 'bg-purple-500/20 text-purple-400' };
      case 'admin': return { label: 'ADMIN', color: 'bg-amber-500/20 text-amber-400' };
      case 'manager': return { label: 'MANAGER', color: 'bg-blue-500/20 text-blue-400' };
      case 'staff': return { label: 'STAFF', color: 'bg-emerald-500/20 text-emerald-400' };
      default: return { label: 'USER', color: 'bg-muted text-muted-foreground' };
    }
  };

  const groupedAccounts = {
    master: DEMO_ACCOUNTS.filter(a => a.tier === 'master'),
    admin: DEMO_ACCOUNTS.filter(a => a.tier === 'admin'),
    manager: DEMO_ACCOUNTS.filter(a => a.tier === 'manager'),
    staff: DEMO_ACCOUNTS.filter(a => a.tier === 'staff'),
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Demo Login Portal</h1>
          <p className="text-muted-foreground">
            One-click login for testing all role dashboards
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-3 text-amber-400">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Demo Accounts Required</p>
              <p className="text-sm text-amber-400/80">
                You need to create these accounts in your backend first. Use the emails and passwords shown below.
              </p>
            </div>
          </div>
        </div>

        {/* Account Groups */}
        <div className="space-y-8">
          {/* Master Tier */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              Root Authority
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAccounts.master.map((account, index) => (
                <DemoAccountCard
                  key={account.id}
                  account={account}
                  index={index}
                  loading={loadingId === account.id}
                  success={successId === account.id}
                  onLogin={() => handleDemoLogin(account)}
                  tierInfo={getTierLabel(account.tier)}
                />
              ))}
            </div>
          </div>

          {/* Admin Tier */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Administrative
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAccounts.admin.map((account, index) => (
                <DemoAccountCard
                  key={account.id}
                  account={account}
                  index={index}
                  loading={loadingId === account.id}
                  success={successId === account.id}
                  onLogin={() => handleDemoLogin(account)}
                  tierInfo={getTierLabel(account.tier)}
                />
              ))}
            </div>
          </div>

          {/* Manager Tier */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAccounts.manager.map((account, index) => (
                <DemoAccountCard
                  key={account.id}
                  account={account}
                  index={index}
                  loading={loadingId === account.id}
                  success={successId === account.id}
                  onLogin={() => handleDemoLogin(account)}
                  tierInfo={getTierLabel(account.tier)}
                />
              ))}
            </div>
          </div>

          {/* Staff Tier */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Staff & Operations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedAccounts.staff.map((account, index) => (
                <DemoAccountCard
                  key={account.id}
                  account={account}
                  index={index}
                  loading={loadingId === account.id}
                  success={successId === account.id}
                  onLogin={() => handleDemoLogin(account)}
                  tierInfo={getTierLabel(account.tier)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Credentials Reference */}
        <Card className="mt-8 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">All Demo Credentials</CardTitle>
            <CardDescription>Copy these to create accounts in your backend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Password</th>
                    <th className="text-left p-2">Dashboard</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ACCOUNTS.map((account) => (
                    <tr key={account.id} className="border-b border-border/30">
                      <td className="p-2 font-medium">{account.role}</td>
                      <td className="p-2 font-mono text-xs">{account.email}</td>
                      <td className="p-2 font-mono text-xs">{account.password}</td>
                      <td className="p-2 font-mono text-xs text-primary">{account.redirectPath}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface DemoAccountCardProps {
  account: DemoAccount;
  index: number;
  loading: boolean;
  success: boolean;
  onLogin: () => void;
  tierInfo: { label: string; color: string };
}

const DemoAccountCard = ({ account, index, loading, success, onLogin, tierInfo }: DemoAccountCardProps) => {
  const Icon = account.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{account.role}</h3>
                <Badge variant="outline" className={tierInfo.color}>
                  {tierInfo.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {account.description}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={onLogin}
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Success!
                  </>
                ) : (
                  'Login as ' + account.role
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DemoLogin;
