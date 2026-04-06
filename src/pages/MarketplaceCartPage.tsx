// @ts-nocheck
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketplaceEcosystemStore } from '@/stores/marketplaceEcosystemStore';
import { useAuth } from '@/hooks/useAuth';
import { hasMarketplacePermission } from '@/marketplace/access';

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export default function MarketplaceCartPage() {
  const navigate = useNavigate();
  const { approvedRoles } = useAuth();
  const cart = useMarketplaceEcosystemStore((state) => state.cart);
  const removeFromCart = useMarketplaceEcosystemStore((state) => state.removeFromCart);
  const clearCart = useMarketplaceEcosystemStore((state) => state.clearCart);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const canBuy = hasMarketplacePermission(approvedRoles, 'buy');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>

        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Marketplace Cart</CardTitle>
            <Button variant="outline" className="border-slate-700 bg-slate-950" onClick={() => clearCart()} disabled={cart.length === 0}>Clear cart</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 && <p className="text-slate-400">Cart is empty.</p>}
            {cart.map((item) => (
              <div key={item.productId} className="rounded-xl border border-slate-800 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-slate-500">Qty {item.quantity} • {money(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-300">{money(item.price * item.quantity)}</p>
                  <Button size="icon" variant="outline" className="h-8 w-8 border-slate-700 bg-slate-950" onClick={() => removeFromCart(item.productId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80">
          <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Total</p>
              <p className="text-2xl font-semibold text-emerald-300">{money(total)}</p>
            </div>
            <Button
              disabled={cart.length === 0 || !canBuy}
              onClick={() => navigate('/checkout')}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Continue to checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
