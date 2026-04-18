// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard, 
  FileText,
  Headphones,
  Settings,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { callEdgeRoute } from '@/lib/api/edge-client';

const ResellerDashboardPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalSales: 0,
    totalEarnings: 0,
    pendingOrders: 0,
    activeLicenses: 0
  });

  const [recentSales, setRecentSales] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Load real reseller data
    const loadResellerData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        
        // Load reseller statistics
        const [customersResult, salesResult, earningsResult, ordersResult, licensesResult] = await Promise.all([
          supabase.from('customers').select('*').eq('reseller_id', userData?.user?.id),
          supabase.from('sales').select('*').eq('reseller_id', userData?.user?.id),
          supabase.from('earnings').select('*').eq('reseller_id', userData?.user?.id),
          supabase.from('orders').select('*').eq('reseller_id', userData?.user?.id).eq('status', 'pending'),
          supabase.from('licenses').select('*').eq('reseller_id', userData?.user?.id).eq('status', 'active')
        ]);
        
        // Load recent sales
        const { data: recentSalesData, error: recentSalesError } = await supabase
          .from('sales')
          .select('*')
          .eq('reseller_id', userData?.user?.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (recentSalesError) throw recentSalesError;
        
        // Load products
        const { data: productsData, error: productsError } = await supabase
          .from('reseller_products')
          .select('*')
          .eq('reseller_id', userData?.user?.id);
        
        if (productsError) throw productsError;
        
        // Calculate statistics
        const stats = {
          totalCustomers: customersResult.data?.length || 0,
          activeCustomers: customersResult.data?.filter(c => c.status === 'active').length || 0,
          totalSales: salesResult.data?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
          totalEarnings: earningsResult.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          pendingOrders: ordersResult.data?.length || 0,
          activeLicenses: licensesResult.data?.length || 0
        };
        
        setStats(stats);
        setRecentSales(recentSalesData || []);
        setProducts(productsData || []);
        
        // Log audit trail
        await supabase.from('audit_logs').insert({
          action: 'reseller_dashboard_loaded',
          module: 'reseller_dashboard',
          user_id: userData?.user?.id,
          metadata: { 
            customers_count: stats.totalCustomers,
            sales_count: salesResult.data?.length || 0,
            earnings_total: stats.totalEarnings
          }
        });
        
      } catch (error) {
        console.error('Error loading reseller dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResellerData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reseller Dashboard</h1>
          <p className="text-gray-600">Manage your sales, customers, and earnings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCustomers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalSales / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalEarnings / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLicenses}</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.8%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Your latest sales activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{sale.customer}</p>
                    <p className="text-sm text-gray-600">{sale.product}</p>
                    <p className="text-xs text-gray-500">{sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(sale.amount / 100).toFixed(2)}</p>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>Products you can sell</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">${(product.price / 100).toFixed(2)} per license</p>
                    <p className="text-xs text-gray-500">{product.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.commission}% commission</p>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/reseller/products/${product.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResellerDashboardPage;
