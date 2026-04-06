// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useMarketplaceEcosystemStore } from '@/stores/marketplaceEcosystemStore';
import { useAuth } from '@/hooks/useAuth';
import { hasMarketplacePermission } from '@/marketplace/access';
import { create_uuid, queue_async_job, track_marketplace_event, validate_checkout_payload } from '@/marketplace/workflow';
import { toast } from 'sonner';

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export default function MarketplaceCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, approvedRoles } = useAuth();
  const { products, createOrder, isSubmittingOrder } = useMarketplace();
  const cart = useMarketplaceEcosystemStore((state) => state.cart);
  const createSupportTicket = useMarketplaceEcosystemStore((state) => state.createSupportTicket);
  const sendNotification = useMarketplaceEcosystemStore((state) => state.sendNotification);

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'upi' | 'bank' | 'crypto'>('wallet');
  const [planId] = useState(create_uuid());
  const [clientDomain, setClientDomain] = useState('');
  const [requirements, setRequirements] = useState('');

  const queryProductId = searchParams.get('product_id');
  const directProduct = products.find((item) => item.product_id === queryProductId);
  const effectiveItems = useMemo(() => {
    if (directProduct) {
      const price = Number(directProduct.lifetime_price || directProduct.monthly_price || 0);
      return [{ product_id: directProduct.product_id, product_name: directProduct.product_name, price }];
    }
    return cart.map((item) => ({ product_id: item.productId, product_name: item.productName, price: item.price * item.quantity }));
  }, [cart, directProduct]);

  const total = useMemo(() => effectiveItems.reduce((sum, item) => sum + item.price, 0), [effectiveItems]);
  const canBuy = hasMarketplacePermission(approvedRoles, 'buy');

  const selectedPrimary = effectiveItems[0] || null;

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!canBuy) {
      toast.error('Your role cannot buy marketplace products');
      return;
    }

    if (!selectedPrimary) {
      toast.error('No product selected for checkout');
      return;
    }

    const validation = validate_checkout_payload({
      product_id: selectedPrimary.product_id,
      plan_id: planId,
      price: selectedPrimary.price,
      payment_method: paymentMethod,
    });

    if (!validation.valid) {
      toast.error(validation.errors[0] || 'Checkout validation failed');
      return;
    }

    track_marketplace_event({
      event_type: 'buy',
      product_id: selectedPrimary.product_id,
      user_id: user.id,
      metadata: { total, payment_method: paymentMethod },
    });

    queue_async_job('notification', {
      type: 'order',
      product_id: selectedPrimary.product_id,
      user_id: user.id,
      total,
    });

    queue_async_job('email', {
      template: 'order_checkout_started',
      product_id: selectedPrimary.product_id,
      user_id: user.id,
    });

    const result = await createOrder({
      productId: selectedPrimary.product_id,
      paymentMethod,
      clientDomain,
      requirements,
      externalReference: planId,
    });

    if (!result) {
      return;
    }

    sendNotification({
      type: 'in_app',
      subject: 'Checkout Submitted',
      message: `Order ${result.order_id} created for ${selectedPrimary.product_name}`,
      userId: user.id,
    });

    if (requirements.trim()) {
      createSupportTicket({
        productId: selectedPrimary.product_id,
        userId: user.id,
        issue: `Checkout note: ${requirements.trim()}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Link to="/cart" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to cart
        </Link>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader>
              <CardTitle>Marketplace Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                  <SelectTrigger className="border-slate-700 bg-slate-950"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-white">
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan ID (UUID strict)</Label>
                <Input value={planId} readOnly className="border-slate-700 bg-slate-950" />
              </div>
              <div className="space-y-2">
                <Label>Client domain</Label>
                <Input value={clientDomain} onChange={(e) => setClientDomain(e.target.value)} placeholder="example.com" className="border-slate-700 bg-slate-950" />
              </div>
              <div className="space-y-2">
                <Label>Requirements</Label>
                <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} className="border-slate-700 bg-slate-950" placeholder="Implementation or delivery notes" />
              </div>
              <Button className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => void handleCheckout()} disabled={isSubmittingOrder || !canBuy || !selectedPrimary}>
                {isSubmittingOrder ? 'Processing...' : 'Create order and continue payment'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {effectiveItems.length === 0 ? <p className="text-slate-400 text-sm">No checkout items.</p> : null}
              {effectiveItems.map((item) => (
                <div key={item.product_id} className="rounded-lg border border-slate-700 p-3">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-xs text-slate-500">product_id: {item.product_id}</p>
                  <p className="text-sm text-emerald-300 mt-1">{money(item.price)}</p>
                </div>
              ))}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-xs text-slate-300">Total</p>
                <p className="text-2xl font-semibold">{money(total)}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300 inline-flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-cyan-300" />
                Auth, role permission, checkout validation, audit event, and async queue hooks are active.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
