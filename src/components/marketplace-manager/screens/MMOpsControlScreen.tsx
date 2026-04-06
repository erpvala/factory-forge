// @ts-nocheck
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarketplaceManagerAdminStore } from '@/stores/marketplaceManagerAdminStore';

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function MMOpsControlScreen() {
  const { user } = useAuth();
  const userId = user?.id || 'marketplace-manager';

  const {
    products,
    orders,
    offers,
    audits,
    notifications,
    aiSignals,
    createOrderMock,
    approveRefund,
    setOffer,
    runAICeo,
    createLeadSignal,
    createSupportSignal,
    sendSeoSignal,
  } = useMarketplaceManagerAdminStore();

  const targetProduct = products[0];
  const totalRevenue = products.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="p-6 space-y-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader><CardTitle className="text-white">Order Monitoring and Revenue Control</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300">Total Revenue: {money(totalRevenue)}</p>
          {targetProduct && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => createOrderMock({ productId: targetProduct.productId, amount: targetProduct.basePrice, status: 'paid' })}>Mock Paid</Button>
              <Button size="sm" variant="outline" onClick={() => createOrderMock({ productId: targetProduct.productId, amount: targetProduct.basePrice, status: 'pending' })}>Mock Pending</Button>
              <Button size="sm" variant="outline" onClick={() => sendSeoSignal(targetProduct.productId)}>Send SEO Signal</Button>
              <Button size="sm" variant="outline" onClick={() => createLeadSignal(targetProduct.productId, 'product_view')}>Create Lead</Button>
              <Button size="sm" variant="outline" onClick={() => createSupportSignal(targetProduct.productId, 'Sample product issue')}>Create Support Ticket</Button>
            </div>
          )}
          <div className="space-y-2">
            {orders.slice(0, 10).map((order) => (
              <div key={order.orderId} className="rounded-lg border border-slate-700 p-2 flex items-center justify-between">
                <p className="text-xs text-slate-300">{order.orderId} | {order.productId} | {order.status} | {money(order.amount)}</p>
                {order.status !== 'refund' && (
                  <Button size="sm" onClick={() => approveRefund(order.orderId, userId)}>Approve Refund</Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader><CardTitle className="text-white">Offer and Discount Engine</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2 items-end flex-wrap">
            <div className="space-y-1">
              <Label>Global Discount %</Label>
              <Input className="w-32" type="number" defaultValue={offers.globalDiscountPercent} onBlur={(e) => setOffer({ globalDiscountPercent: Number(e.target.value), userId })} />
            </div>
            <Button size="sm" variant="outline" onClick={() => setOffer({ country: 'IN', percent: 40, userId })}>Festival IN 40%</Button>
            <Button size="sm" variant="outline" onClick={() => setOffer({ country: 'US', percent: 20, userId })}>US 20%</Button>
          </div>
          <p className="text-xs text-slate-400">Country offers: {Object.keys(offers.countryDiscount).map((key) => `${key}:${offers.countryDiscount[key]}%`).join(', ') || 'none'}</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader><CardTitle className="text-white">AI CEO and Final Control Loop</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button size="sm" onClick={() => runAICeo()}>Run AI Optimization</Button>
          {aiSignals.slice(0, 8).map((signal) => (
            <div key={signal.id} className="rounded-lg border border-slate-700 p-2">
              <p className="text-sm text-white">{signal.type.toUpperCase()} | {signal.productId}</p>
              <p className="text-xs text-slate-400">{signal.suggestion}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader><CardTitle className="text-white">Audit Log</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {audits.slice(0, 10).map((entry) => (
              <div key={entry.id} className="text-xs text-slate-300 border border-slate-700 rounded p-2">
                {entry.action} | {entry.userId} | {new Date(entry.timestamp).toLocaleString()}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader><CardTitle className="text-white">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {notifications.slice(0, 10).map((entry) => (
              <div key={entry.id} className="text-xs text-slate-300 border border-slate-700 rounded p-2">
                <p>{entry.title}</p>
                <p className="text-slate-500">{entry.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
