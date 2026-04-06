// @ts-nocheck
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplaceManagerAdminStore } from '@/stores/marketplaceManagerAdminStore';

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

const MarketplaceManagerDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id || 'marketplace-manager';

  const {
    products,
    categories,
    orders,
    audits,
    notifications,
    aiSignals,
    offers,
    createProduct,
    autoSaveDraft,
    configureProduct,
    publishProduct,
    updateProduct,
    setProductControl,
    cloneProduct,
    requestApproval,
    approveProduct,
    rollbackProductVersion,
    bulkAction,
    setInventory,
    setRegionLock,
    setFeatureFlag,
    setABTest,
    setDependency,
    setPlanLimit,
    createOrderMock,
    approveRefund,
    runAICeo,
    setOffer,
    getDashboardMetrics,
  } = useMarketplaceManagerAdminStore();

  const [form, setForm] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    description: '',
    basePrice: 999,
    features: 'analytics,automation,support',
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [bulkIds, setBulkIds] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');

  const metrics = getDashboardMetrics();

  const selectedProduct = useMemo(() => {
    return products.find((entry) => entry.productId === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const handleCreate = () => {
    const result = createProduct({
      name: form.name,
      categoryId: form.categoryId,
      description: form.description,
      basePrice: Number(form.basePrice),
      features: form.features.split(',').map((item) => item.trim()).filter(Boolean),
      userId,
    });
    if (result.ok && result.product) {
      setSelectedProductId(result.product.productId);
      setForm((prev) => ({ ...prev, name: '', description: '' }));
    }
  };

  const productIdsForBulk = bulkIds.split(',').map((item) => item.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marketplace Manager Admin Core</h1>
              <p className="text-sm text-slate-600">Enterprise lifecycle: draft, approval, launch, optimization, refund governance, and AI control loop.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Products {metrics.totalProducts}</Badge>
              <Badge variant="outline">Active {metrics.activeProducts}</Badge>
              <Badge variant="outline">Sales {metrics.totalSales}</Badge>
              <Badge variant="secondary">Revenue {money(metrics.totalRevenue)}</Badge>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Top Revenue Product</CardTitle></CardHeader>
            <CardContent className="text-lg font-semibold">{metrics.topProducts[0]?.name || 'No data yet'}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Low Conversion Alert</CardTitle></CardHeader>
            <CardContent className="text-lg font-semibold">{metrics.lowConversion[0]?.name || 'No alert'}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Approvals</CardTitle></CardHeader>
            <CardContent className="text-lg font-semibold">{products.filter((entry) => entry.status === 'PENDING').length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Refund Queue</CardTitle></CardHeader>
            <CardContent className="text-lg font-semibold">{orders.filter((entry) => entry.status === 'pending').length}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 h-auto">
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="ops">Ops</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Create Product</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="AI Sales Optimizer" />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}>
                    <SelectTrigger><SelectValue placeholder="Pick category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-1">
                  <Label>Base Price</Label>
                  <Input type="number" value={form.basePrice} onChange={(e) => setForm((prev) => ({ ...prev, basePrice: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Features (comma separated)</Label>
                  <Input value={form.features} onChange={(e) => setForm((prev) => ({ ...prev, features: e.target.value }))} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={handleCreate}>Create Draft Product</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Products</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {products.length === 0 && <p className="text-sm text-slate-500">No products yet.</p>}
                {products.map((product) => (
                  <div key={product.productId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.productId} • {product.status} • {money(product.basePrice)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedProductId(product.productId)}>Select</Button>
                      <Button size="sm" variant="outline" onClick={() => cloneProduct(product.productId, userId)}>Clone</Button>
                      <Button size="sm" onClick={() => setProductControl(product.productId, { enabled: !product.enabled }, userId)}>{product.enabled ? 'Disable' : 'Enable'}</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Selected Product Lifecycle</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedProduct ? (
                  <>
                    <p className="text-sm">{selectedProduct.name} ({selectedProduct.productId})</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => autoSaveDraft(selectedProduct.productId, { description: `${selectedProduct.description} [autosaved]` }, userId)}>Auto Save Draft</Button>
                      <Button size="sm" variant="outline" onClick={() => configureProduct(selectedProduct.productId, { licenseRequired: true }, userId)}>Configure</Button>
                      <Button size="sm" variant="outline" onClick={() => publishProduct(selectedProduct.productId, { visibility: 'public', tags: ['featured'], keywords: ['ai', 'automation'] }, userId)}>Publish Request</Button>
                      <Button size="sm" variant="outline" onClick={() => requestApproval(selectedProduct.productId, userId)}>Request Approval</Button>
                      <Button size="sm" onClick={() => approveProduct(selectedProduct.productId, userId)}>Boss Approve</Button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <Button size="sm" variant="outline" onClick={() => updateProduct(selectedProduct.productId, { discountPercent: 10 }, userId)}>Edit: Discount 10%</Button>
                      <Button size="sm" variant="outline" onClick={() => setInventory(selectedProduct.productId, { stockLimited: true, stock: 50, userId })}>Set Inventory 50</Button>
                    </div>

                    <div className="space-y-1">
                      <Label>Rollback</Label>
                      <Select onValueChange={(versionId) => rollbackProductVersion(selectedProduct.productId, versionId, userId)}>
                        <SelectTrigger><SelectValue placeholder="Select product version" /></SelectTrigger>
                        <SelectContent>
                          {selectedProduct.versions.map((version) => (
                            <SelectItem key={version.productVersionId} value={version.productVersionId}>{version.productVersionId}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a product to manage lifecycle.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enterprise" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Advanced Enterprise Controls</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedProduct ? (
                  <>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      <Button size="sm" variant="outline" onClick={() => setRegionLock(selectedProduct.productId, ['IN', 'AE'], userId)}>Region Lock IN/AE</Button>
                      <Button size="sm" variant="outline" onClick={() => setFeatureFlag(selectedProduct.productId, 'beta_checkout', true, userId)}>Enable Feature Flag</Button>
                      <Button size="sm" variant="outline" onClick={() => setABTest(selectedProduct.productId, { enabled: true, variantA: selectedProduct.basePrice, variantB: selectedProduct.basePrice - 100, splitPercent: 50 }, userId)}>Enable A/B Price Test</Button>
                      <Button size="sm" variant="outline" onClick={() => setDependency(selectedProduct.productId, products.filter((item) => item.productId !== selectedProduct.productId).slice(0, 2).map((item) => item.productId), userId)}>Set Dependency Bundle</Button>
                      <Button size="sm" variant="outline" onClick={() => setPlanLimit(selectedProduct.productId, 'pro', { apiCalls: 250000, projects: 300 }, userId)}>Set Plan Limits</Button>
                      <Button size="sm" onClick={() => setProductControl(selectedProduct.productId, { basePrice: selectedProduct.basePrice + 50 }, userId)}>Controlled Price +50</Button>
                    </div>

                    <div className="space-y-1">
                      <Label>Bulk Product IDs (comma separated)</Label>
                      <Input value={bulkIds} onChange={(e) => setBulkIds(e.target.value)} placeholder="PRD-abc, PRD-def" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => bulkAction({ productIds: productIdsForBulk, action: 'enable', userId })}>Bulk Enable</Button>
                      <Button size="sm" variant="outline" onClick={() => bulkAction({ productIds: productIdsForBulk, action: 'disable', userId })}>Bulk Disable</Button>
                      <Input className="w-40" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} placeholder="Bulk price" />
                      <Button size="sm" onClick={() => bulkAction({ productIds: productIdsForBulk, action: 'price_update', value: Number(bulkPrice), userId })}>Bulk Price Update</Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a product first.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Orders, Revenue, Refund + Reverse Commission</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedProduct && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => createOrderMock({ productId: selectedProduct.productId, amount: selectedProduct.basePrice, status: 'paid' })}>Mock Paid Order</Button>
                    <Button size="sm" variant="outline" onClick={() => createOrderMock({ productId: selectedProduct.productId, amount: selectedProduct.basePrice, status: 'pending' })}>Mock Pending Order</Button>
                  </div>
                )}
                <div className="space-y-2">
                  {orders.slice(0, 10).map((order) => (
                    <div key={order.orderId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                      <p>{order.orderId} • {order.productId} • {order.status} • {money(order.amount)}</p>
                      {order.status !== 'refund' && <Button size="sm" variant="outline" onClick={() => approveRefund(order.orderId, userId)}>Approve Refund</Button>}
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Discount and Offer Engine</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label>Global Discount %</Label>
                    <Input className="w-32" type="number" defaultValue={offers.globalDiscountPercent} onBlur={(e) => setOffer({ globalDiscountPercent: Number(e.target.value), userId })} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setOffer({ country: 'IN', percent: 15, userId })}>Country Offer IN 15%</Button>
                  <Button size="sm" variant="outline" onClick={() => setOffer({ country: 'AE', percent: 8, userId })}>Country Offer AE 8%</Button>
                </div>
                <p className="text-sm text-slate-600">Global: {offers.globalDiscountPercent}% | Country: {Object.keys(offers.countryDiscount).map((key) => `${key}:${offers.countryDiscount[key]}%`).join(', ') || 'none'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>SEO, Lead, Support, AI CEO Optimization</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => runAICeo()}>Run AI CEO Loop</Button>
                </div>
                <div className="space-y-2">
                  {aiSignals.slice(0, 8).map((signal) => (
                    <div key={signal.id} className="rounded-lg border p-2 text-sm">
                      <p className="font-medium">{signal.type.toUpperCase()} • {signal.productId}</p>
                      <p className="text-slate-600">{signal.suggestion}</p>
                    </div>
                  ))}
                  {aiSignals.length === 0 && <p className="text-sm text-slate-500">No AI signals yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Audit Trail and Notifications</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Recent Audits</h3>
                  {audits.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-2 text-xs">
                      <p className="font-medium">{entry.action}</p>
                      <p>{entry.entityId || 'global'} • {new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Recent Notifications</h3>
                  {notifications.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-2 text-xs">
                      <p className="font-medium">{entry.title}</p>
                      <p>{entry.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ops" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Final Operations Optimization Loop</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>1. Product changes increase cache version and trigger notification events.</p>
                <p>2. Pending approvals lock public exposure until boss-level approval promotes ACTIVE state.</p>
                <p>3. Refund approvals reduce revenue and reverse commission impact from the product ledger.</p>
                <p>4. AI loop reviews conversion quality and emits optimization suggestions.</p>
                <p>5. Region locks, feature flags, A/B tests, dependencies, and plan limits enforce enterprise controls.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketplaceManagerDashboard;
