// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Package, ShoppingCart, CreditCard, Award,
  TrendingUp, AlertCircle, ExternalLink, BarChart2, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketplaceManagerAdminStore } from '@/stores/marketplaceManagerAdminStore';
import { useMarketplaceEcosystemStore } from '@/stores/marketplaceEcosystemStore';

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  refund: 'bg-red-100 text-red-800',
  open: 'bg-blue-100 text-blue-800',
  resolved: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-800',
  revoked: 'bg-red-100 text-red-800',
};

export default function MarketplaceManager() {
  const navigate = useNavigate();

  const { getDashboardMetrics, orders, aiSignals, runAICeo, products } =
    useMarketplaceManagerAdminStore();

  const { analytics, licenses, supportTickets } = useMarketplaceEcosystemStore();

  const metrics = getDashboardMetrics();

  const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentLicenses = [...licenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const openTickets = supportTickets.filter((t) => t.status === 'open');

  const cartAddEvents = analytics.filter((e) => e.type === 'add_cart').length;
  const checkoutEvents = analytics.filter((e) => e.type === 'checkout').length;
  const paymentSuccessEvents = analytics.filter((e) => e.type === 'payment_success').length;
  const licenseIssuedEvents = analytics.filter((e) => e.type === 'license_issued').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketplace Manager</h1>
            <p className="text-sm text-muted-foreground">Products, orders, licenses, and flow analytics</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => navigate('/marketplace-manager/dashboard')}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Full Manager
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/marketplace')}>
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
            View Marketplace
          </Button>
          <Button size="sm" onClick={runAICeo}>
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Run AI CEO
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalProducts}</p>
            <p className="text-xs text-muted-foreground">{metrics.activeProducts} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalSales}</p>
            <p className="text-xs text-muted-foreground">{orders.length} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{money(metrics.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">{paymentSuccessEvents} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{licenseIssuedEvents || licenses.length}</p>
            <p className="text-xs text-muted-foreground">{openTickets.length} open tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Flow Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Marketplace Flow Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xl font-bold">{analytics.filter((e) => e.type === 'product_view').length}</p>
              <p className="text-xs text-muted-foreground">Product Views</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{cartAddEvents}</p>
              <p className="text-xs text-muted-foreground">Cart Adds</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{checkoutEvents}</p>
              <p className="text-xs text-muted-foreground">Checkouts</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{paymentSuccessEvents}</p>
              <p className="text-xs text-muted-foreground">Payments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No orders yet. Use the Full Manager to create orders.</p>
            ) : (
              <ul className="space-y-2">
                {recentOrders.map((order) => (
                  <li key={order.orderId} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">{order.orderId}</span>
                    <span className="text-xs">{money(order.amount)}</span>
                    <Badge className={`text-xs ${STATUS_COLORS[order.status] || ''}`}>{order.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Licenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4" /> Recent Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLicenses.length === 0 ? (
              <p className="text-xs text-muted-foreground">No licenses issued yet. Complete a checkout to generate a license.</p>
            ) : (
              <ul className="space-y-2">
                {recentLicenses.map((lic) => (
                  <li key={lic.licenseId} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">{lic.licenseId}</span>
                    <Badge className={`text-xs ${STATUS_COLORS[lic.accessStatus] || ''}`}>{lic.accessStatus}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sales recorded. Add products in the Full Manager.</p>
            ) : (
              <ul className="space-y-2">
                {metrics.topProducts.slice(0, 5).map((p) => (
                  <li key={p.productId} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[160px]">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.sales} sales · {money(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* AI Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> AI Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiSignals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No AI signals yet. Click "Run AI CEO" to generate.</p>
            ) : (
              <ul className="space-y-2">
                {aiSignals.slice(0, 5).map((sig) => (
                  <li key={sig.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{sig.type}</Badge>
                      <span className="text-muted-foreground">{sig.productId}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{sig.suggestion}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
