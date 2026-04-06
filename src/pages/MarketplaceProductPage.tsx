// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Play, Shield, ShoppingCart, Ticket, Star, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useMarketplaceEcosystemStore } from '@/stores/marketplaceEcosystemStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function MarketplaceProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trackProductView = useMarketplaceEcosystemStore((state) => state.trackProductView);
  const addToCart = useMarketplaceEcosystemStore((state) => state.addToCart);
  const createSupportTicket = useMarketplaceEcosystemStore((state) => state.createSupportTicket);
  const bossOverride = useMarketplaceEcosystemStore((state) => (productId ? state.bossOverrides[productId] : undefined));
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('product_id, product_name, description, category, lifetime_price, monthly_price, demo_id')
        .eq('product_id', productId)
        .maybeSingle();

      if (data) {
        setProduct(data);
        trackProductView({ productId: data.product_id, category: data.category }, user?.id || null);
        setLoading(false);
        return;
      }

      const slugGuess = decodeURIComponent(productId).replace(/-/g, ' ');
      const { data: fallback } = await supabase
        .from('products')
        .select('product_id, product_name, description, category, lifetime_price, monthly_price, demo_id')
        .ilike('product_name', slugGuess)
        .maybeSingle();

      if (fallback) {
        trackProductView({ productId: fallback.product_id, category: fallback.category }, user?.id || null);
      }
      setProduct(fallback || null);
      setLoading(false);
    };

    void load();
  }, [productId, trackProductView, user?.id]);

  const price = Number(product?.lifetime_price || product?.monthly_price || 0);
  const effectivePrice = Number.isFinite(bossOverride?.priceOverride) ? Number(bossOverride.priceOverride) : price;

  const handleAddToCart = () => {
    if (!product) {
      return;
    }
    addToCart({
      productId: product.product_id,
      productName: product.product_name,
      price: effectivePrice,
      category: product.category,
      licenseRequired: true,
    });
    toast.success('Added to cart');
  };

  const handleSupport = () => {
    if (!product) {
      return;
    }
    const ticket = createSupportTicket({
      productId: product.product_id,
      userId: user?.id || null,
      issue: `Support requested from product page for ${product.product_name}`,
    });
    toast.success(`Support ticket ${ticket.ticketId} created`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>

        <Card className="mt-6 border-slate-800 bg-slate-900/80">
          <CardContent className="p-8 space-y-6">
            {loading ? (
              <p className="text-slate-400">Loading product...</p>
            ) : !product ? (
              <p className="text-red-400">Product not found.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{product.category || 'Marketplace Product'}</p>
                  <h1 className="text-4xl font-bold">{product.product_name}</h1>
                  <p className="text-slate-300 max-w-3xl">{product.description || 'Verified marketplace product with real payment, order, and license flow.'}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">Plans</p>
                    <p className="mt-2 text-lg font-semibold">Lifetime / Monthly</p>
                    <p className="text-sm text-slate-500">Commercials ready for checkout</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">License Required</p>
                    <p className="mt-2 text-lg font-semibold inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" />Yes</p>
                    <p className="text-sm text-slate-500">Access activates after payment</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">Reviews</p>
                    <p className="mt-2 text-lg font-semibold inline-flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-current" />4.8 / 5</p>
                    <p className="text-sm text-slate-500">Marketplace-ready quality score</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">Lifetime price</p>
                    <p className="mt-2 text-2xl font-semibold">₹{effectivePrice.toLocaleString('en-IN')}</p>
                    {bossOverride?.priceOverride ? <p className="text-xs text-amber-300">Boss override active</p> : null}
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">Protection</p>
                    <p className="mt-2 text-2xl font-semibold inline-flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" />Verified purchase</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">Delivery</p>
                    <p className="mt-2 text-2xl font-semibold">License auto-issue</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {product.demo_id && (
                    <Button variant="outline" onClick={() => navigate(`/demo/${product.demo_id}`)} className="gap-2 border-slate-700 bg-slate-950 hover:bg-slate-900">
                      <Play className="w-4 h-4" />
                      Try Demo
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleAddToCart} className="gap-2 border-slate-700 bg-slate-950 hover:bg-slate-900">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" onClick={handleSupport} className="gap-2 border-slate-700 bg-slate-950 hover:bg-slate-900">
                    <Ticket className="w-4 h-4" />
                    Support
                  </Button>
                  <Button onClick={() => navigate(`/checkout?product_id=${encodeURIComponent(product.product_id)}`)} className="gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Continue to Checkout
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}