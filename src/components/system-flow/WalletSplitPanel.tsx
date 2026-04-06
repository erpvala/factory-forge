// @ts-nocheck
/**
 * Wallet Split Panel
 * Shows all 4 wallet types + live split breakdown per sale
 */

import { motion } from 'framer-motion';
import { useSystemFlowStore } from '@/stores/systemFlowStore';
import { Wallet, TrendingUp, Crown, User, Building2, ArrowRightLeft, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { WalletEntry, WalletSplit } from '@/services/systemFlowEngine';
import { DEFAULT_COMMISSION_RATES } from '@/services/systemFlowEngine';

const WALLET_META: Record<string, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  user:      { label: 'User Wallet',      icon: User,      color: 'text-sky-400',    bg: 'from-sky-500 to-blue-600' },
  reseller:  { label: 'Reseller Wallet',  icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500 to-violet-600' },
  franchise: { label: 'Franchise Wallet', icon: Building2, color: 'text-orange-400', bg: 'from-orange-500 to-amber-600' },
  boss:      { label: 'Boss Wallet',      icon: Crown,     color: 'text-yellow-400', bg: 'from-yellow-500 to-amber-500' },
};

const SPLIT_ORDER: Array<'reseller' | 'franchise' | 'boss'> = ['reseller', 'franchise', 'boss'];

function WalletCard({ wallet }: { wallet: WalletEntry }) {
  const meta = WALLET_META[wallet.ownerType] ?? WALLET_META['user'];
  const Icon = meta.icon;
  const utilisation = wallet.totalEarned > 0 ? (wallet.balance / wallet.totalEarned) * 100 : 0;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br', meta.bg)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{meta.label}</p>
            <p className="text-xs text-slate-400">{wallet.ownerType.toUpperCase()}</p>
          </div>
        </div>
        <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>
      </div>

      <div>
        <p className="text-2xl font-bold text-white">
          ${wallet.balance.toLocaleString()}
        </p>
        <p className="text-xs text-slate-400">Available balance</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Utilisation</span>
          <span>{utilisation.toFixed(0)}%</span>
        </div>
        <Progress value={utilisation} className="h-1.5" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-slate-400">Pending</p>
          <p className="text-yellow-400 font-semibold">${wallet.pendingBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-slate-400">Total Earned</p>
          <p className="text-green-400 font-semibold">${wallet.totalEarned.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}

function SplitRow({ split }: { split: WalletSplit }) {
  const { splits, totalAmount } = split;
  const rows = [
    { label: 'Reseller',  amount: splits.resellerAmount,  pct: splits.resellerPercent,  color: 'bg-purple-400' },
    { label: 'Franchise', amount: splits.franchiseAmount, pct: splits.franchisePercent, color: 'bg-orange-400' },
    { label: 'Boss',      amount: splits.bossAmount,      pct: splits.bossPercent,      color: 'bg-yellow-400' },
    { label: 'Platform',  amount: splits.platformAmount,  pct: splits.platformPercent,  color: 'bg-slate-400' },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Split #{split.splitId.slice(-6)}</span>
        </div>
        <span className="text-sm font-bold text-green-400">${totalAmount.toLocaleString()}</span>
      </div>

      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">{row.label}</span>
              <span className="text-white font-medium">${row.amount.toFixed(2)} <span className="text-slate-400">({row.pct}%)</span></span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className={cn('h-1.5 rounded-full', row.color)} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WalletSplitPanel() {
  const wallets = useSystemFlowStore(s => s.wallets);
  const splits = useSystemFlowStore(s => s.splits);
  const kpis = useSystemFlowStore(s => s.kpis);

  const walletList = Object.values(wallets);
  const splitList = Object.values(splits).slice(0, 5);

  const totalBalance = walletList.reduce((s, w) => s + w.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-400" />
            Wallet System — Central Finance Core
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Multi-wallet, real-time split, zero float loss</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-400">${totalBalance.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Combined balance</p>
        </div>
      </div>

      {/* Split Rates Banner */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Reseller Split', value: `${DEFAULT_COMMISSION_RATES.reseller}%`, color: 'text-purple-400' },
          { label: 'Franchise Split', value: `${DEFAULT_COMMISSION_RATES.franchise}%`, color: 'text-orange-400' },
          { label: 'Boss Split', value: `${DEFAULT_COMMISSION_RATES.boss}%`, color: 'text-yellow-400' },
          { label: 'Platform Fee', value: `${DEFAULT_COMMISSION_RATES.platform}%`, color: 'text-slate-300' },
        ].map(r => (
          <div key={r.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className={cn('text-xl font-bold', r.color)}>{r.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Wallets */}
      {walletList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {walletList.map(w => <WalletCard key={w.walletId} wallet={w} />)}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8 text-sm">
          No wallets yet — run the pipeline to create wallets.
        </div>
      )}

      {/* Recent Splits */}
      {splitList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            Recent Payment Splits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {splitList.map(sp => <SplitRow key={sp.splitId} split={sp} />)}
          </div>
        </div>
      )}
    </div>
  );
}
