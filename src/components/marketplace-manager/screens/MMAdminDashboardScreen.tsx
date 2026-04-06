// @ts-nocheck
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketplaceManagerAdminStore } from '@/stores/marketplaceManagerAdminStore';

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function MMAdminDashboardScreen() {
  const { products, getDashboardMetrics } = useMarketplaceManagerAdminStore();
  const metrics = getDashboardMetrics();

  return (
    <div className="p-6 space-y-4">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-2xl font-semibold text-white">Marketplace Admin Dashboard</h1>
        <p className="text-sm text-slate-400">All products controlled, all flows connected, zero isolation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-300">Total Products</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-white">{metrics.totalProducts}</CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-300">Active Products</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-400">{metrics.activeProducts}</CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-300">Total Sales</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-cyan-300">{metrics.totalSales}</CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700 md:col-span-2 xl:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-300">Total Revenue</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-amber-300">{money(metrics.totalRevenue)}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader><CardTitle className="text-base text-white">Top Products</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {metrics.topProducts.length === 0 && <p className="text-sm text-slate-500">No product data yet.</p>}
            {metrics.topProducts.map((item) => (
              <div key={item.productId} className="rounded-lg border border-slate-700 p-2">
                <p className="text-sm text-white">{item.name}</p>
                <p className="text-xs text-slate-400">Sales {item.sales} | Revenue {money(item.revenue)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader><CardTitle className="text-base text-white">Low Conversion Products</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {metrics.lowConversion.length === 0 && <p className="text-sm text-slate-500">No low conversion signal yet.</p>}
            {metrics.lowConversion.map((item) => (
              <div key={item.productId} className="rounded-lg border border-slate-700 p-2 flex items-center justify-between">
                <p className="text-sm text-white">{item.name}</p>
                <Badge variant="outline" className="text-red-300 border-red-500/30">{item.conversionRate.toFixed(2)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader><CardTitle className="text-base text-white">Status Distribution</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {['DRAFT', 'PENDING', 'READY', 'ACTIVE', 'INACTIVE'].map((status) => (
            <Badge key={status} variant="secondary" className="bg-slate-800 text-slate-200">
              {status}: {products.filter((item) => item.status === status).length}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
