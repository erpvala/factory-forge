// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMarketplaceManagerAdminStore } from '@/stores/marketplaceManagerAdminStore';

export function MMProductControlScreen() {
  const { user } = useAuth();
  const userId = user?.id || 'marketplace-manager';

  const {
    products,
    categories,
    createProduct,
    configureProduct,
    publishProduct,
    updateProduct,
    setProductControl,
    cloneProduct,
    requestApproval,
    approveProduct,
    autoSaveDraft,
    rollbackProductVersion,
    bulkAction,
    setRegionLock,
    setFeatureFlag,
    setABTest,
    setDependency,
    setPlanLimit,
  } = useMarketplaceManagerAdminStore();

  const [form, setForm] = useState({ name: '', categoryId: categories[0]?.id || '', description: '', basePrice: 999, features: 'analytics,automation' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bulkIds, setBulkIds] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');

  const selectedProduct = useMemo(() => products.find((item) => item.productId === selectedProductId) || products[0], [products, selectedProductId]);

  return (
    <div className="p-6 space-y-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader><CardTitle className="text-white">Create Product (Draft)</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={form.categoryId} onValueChange={(value) => setForm((v) => ({ ...v, categoryId: value }))}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Base Price</Label>
            <Input type="number" value={form.basePrice} onChange={(e) => setForm((v) => ({ ...v, basePrice: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1">
            <Label>Features</Label>
            <Input value={form.features} onChange={(e) => setForm((v) => ({ ...v, features: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={() => {
              const created = createProduct({
                name: form.name,
                categoryId: form.categoryId,
                description: form.description,
                basePrice: Number(form.basePrice),
                features: form.features.split(',').map((item) => item.trim()).filter(Boolean),
                userId,
              });
              if (created.ok && created.product) {
                setSelectedProductId(created.product.productId);
              }
            }}>Create Draft</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader><CardTitle className="text-white">Product Lifecycle and Control</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Selected Product</Label>
              <Select value={selectedProduct?.productId || ''} onValueChange={setSelectedProductId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map((item) => <SelectItem key={item.productId} value={item.productId}>{item.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => selectedProduct && autoSaveDraft(selectedProduct.productId, { description: `${selectedProduct.description} [autosave]` }, userId)}>Auto Save</Button>
              <Button size="sm" variant="outline" onClick={() => selectedProduct && configureProduct(selectedProduct.productId, { licenseRequired: true }, userId)}>Configure</Button>
              <Button size="sm" variant="outline" onClick={() => selectedProduct && publishProduct(selectedProduct.productId, { visibility: 'public', tags: ['featured'], keywords: ['ai', 'marketplace'] }, userId)}>Publish Request</Button>
              <Button size="sm" variant="outline" onClick={() => selectedProduct && requestApproval(selectedProduct.productId, userId)}>Request Approval</Button>
              <Button size="sm" onClick={() => selectedProduct && approveProduct(selectedProduct.productId, userId)}>Approve Live</Button>
            </div>
          </div>

          {selectedProduct && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Status {selectedProduct.status}</Badge>
                <Badge variant="secondary">Enabled {selectedProduct.enabled ? 'Yes' : 'No'}</Badge>
                <Badge variant="secondary">Version {selectedProduct.productVersionId}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => cloneProduct(selectedProduct.productId, userId)}>Clone</Button>
                <Button size="sm" variant="outline" onClick={() => setProductControl(selectedProduct.productId, { enabled: !selectedProduct.enabled }, userId)}>{selectedProduct.enabled ? 'Disable' : 'Enable'}</Button>
                <Button size="sm" variant="outline" onClick={() => setProductControl(selectedProduct.productId, { basePrice: selectedProduct.basePrice + 100 }, userId)}>Price +100</Button>
                <Button size="sm" variant="outline" onClick={() => updateProduct(selectedProduct.productId, { discountPercent: 20 }, userId)}>Discount 20%</Button>
                <Button size="sm" variant="outline" onClick={() => setRegionLock(selectedProduct.productId, ['IN', 'US'], userId)}>Region Lock IN/US</Button>
                <Button size="sm" variant="outline" onClick={() => setFeatureFlag(selectedProduct.productId, 'beta_checkout', true, userId)}>Feature Flag</Button>
                <Button size="sm" variant="outline" onClick={() => setABTest(selectedProduct.productId, { enabled: true, variantA: selectedProduct.basePrice, variantB: selectedProduct.basePrice - 200, splitPercent: 50 }, userId)}>A/B Pricing</Button>
                <Button size="sm" variant="outline" onClick={() => setDependency(selectedProduct.productId, products.filter((item) => item.productId !== selectedProduct.productId).slice(0, 2).map((item) => item.productId), userId)}>Set Dependency</Button>
                <Button size="sm" variant="outline" onClick={() => setPlanLimit(selectedProduct.productId, 'enterprise', { apiCalls: 2000000 }, userId)}>Set Limit</Button>
              </div>
              <div className="space-y-1">
                <Label>Rollback Version</Label>
                <Select onValueChange={(versionId) => rollbackProductVersion(selectedProduct.productId, versionId, userId)}>
                  <SelectTrigger><SelectValue placeholder="Pick version to rollback" /></SelectTrigger>
                  <SelectContent>{selectedProduct.versions.map((version) => <SelectItem key={version.productVersionId} value={version.productVersionId}>{version.productVersionId}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader><CardTitle className="text-white">Bulk Action Control</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input value={bulkIds} onChange={(e) => setBulkIds(e.target.value)} placeholder="PRD-1, PRD-2" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkAction({ productIds: bulkIds.split(',').map((item) => item.trim()).filter(Boolean), action: 'enable', userId })}>Bulk Enable</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction({ productIds: bulkIds.split(',').map((item) => item.trim()).filter(Boolean), action: 'disable', userId })}>Bulk Disable</Button>
            <Input className="w-40" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} placeholder="Price" />
            <Button size="sm" onClick={() => bulkAction({ productIds: bulkIds.split(',').map((item) => item.trim()).filter(Boolean), action: 'price_update', value: Number(bulkPrice), userId })}>Bulk Price</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
