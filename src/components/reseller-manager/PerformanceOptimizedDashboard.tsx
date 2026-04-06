// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard, 
  Activity,
  Zap,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useResellerManagerState } from '@/hooks/useResellerManagerState';
import { useResellerManagerPerformance } from '@/hooks/useResellerManagerPerformance';

interface PerformanceDashboardProps {
  onRunFinalTest?: () => void;
}

const PerformanceOptimizedDashboard: React.FC<PerformanceDashboardProps> = ({ 
  onRunFinalTest 
}) => {
  const { state } = useResellerManagerState();
  const {
    getPerformanceMetrics,
    getSecurityMetrics,
    simulateLoadTest,
    lazyLoadComponent,
    optimizedDataFetch,
    validateSecurity,
    validateSession,
    virtualizeList,
    debouncedSearch,
  } = useResellerManagerPerformance();

  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [loadTestResults, setLoadTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized expensive calculations
  const dashboardStats = useMemo(() => {
    const startTime = performance.now();
    
    const stats = {
      totalResellers: state.resellers.length,
      activeResellers: state.resellers.filter(r => r.status === 'active').length,
      pendingResellers: state.resellers.filter(r => r.status === 'pending').length,
      totalProducts: state.products.length,
      activeLicenses: state.licenses.filter(l => l.status === 'active').length,
      totalSales: state.sales.reduce((sum, sale) => sum + sale.amount, 0),
      totalCommission: state.commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0),
      pendingPayouts: state.payouts.filter(p => p.status === 'requested' || p.status === 'approved').length,
      unpaidInvoices: state.invoices.filter(i => i.status !== 'paid').length,
    };
    
    const endTime = performance.now();
    console.log(`Dashboard stats calculated in ${(endTime - startTime).toFixed(2)}ms`);
    
    return stats;
  }, [state.resellers, state.products, state.licenses, state.sales, state.commissions, state.payouts, state.invoices]);

  // Virtualized list for large datasets
  const virtualizedResellers = useMemo(() => {
    const allResellers = state.resellers;
    const filteredResellers = searchQuery 
      ? allResellers.filter(r => 
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allResellers;
    
    return virtualizeList(filteredResellers, 60, 300);
  }, [state.resellers, searchQuery, virtualizeList]);

  // Debounced search function
  const handleSearch = useCallback(
    debouncedSearch((query: string) => {
      setSearchQuery(query);
    }),
    [debouncedSearch]
  );

  // Load performance metrics
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const perfMetrics = getPerformanceMetrics();
        const secMetrics = getSecurityMetrics();
        
        setPerformanceMetrics(perfMetrics);
        setSecurityMetrics(secMetrics);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getPerformanceMetrics, getSecurityMetrics]);

  // Run load test
  const runLoadTest = useCallback(async () => {
    setIsRunningTest(true);
    try {
      const results = await simulateLoadTest(10000, 5000);
      setLoadTestResults(results);
    } catch (error) {
      console.error('Load test failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  }, [simulateLoadTest]);

  // Lazy load components
  useEffect(() => {
    const loadComponents = async () => {
      try {
        await lazyLoadComponent('DashboardStats');
        await lazyLoadComponent('RecentActivity');
        await lazyLoadComponent('PerformanceMetrics');
      } catch (error) {
        console.error('Failed to lazy load components:', error);
      }
    };

    loadComponents();
  }, [lazyLoadComponent]);

  // Optimized data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        await optimizedDataFetch('dashboard_stats');
        await optimizedDataFetch('recent_activity');
        await optimizedDataFetch('performance_data');
      } catch (error) {
        console.error('Failed to fetch optimized data:', error);
      }
    };

    fetchData();
  }, [optimizedDataFetch]);

  // Security validation
  useEffect(() => {
    const validateSystem = async () => {
      try {
        const userRole = localStorage.getItem('userRole') || 'reseller_manager';
        const isSecure = validateSecurity(userRole, 'reseller-manager');
        const isSessionValid = validateSession();
        
        if (!isSecure || !isSessionValid) {
          console.warn('Security validation failed');
        }
      } catch (error) {
        console.error('Security validation error:', error);
      }
    };

    validateSystem();
  }, [validateSecurity, validateSession]);

  // Performance indicators
  const getPerformanceStatus = (metric: number, threshold: number) => {
    if (metric < threshold) return { status: 'good', color: 'text-green-600', icon: CheckCircle };
    if (metric < threshold * 2) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'critical', color: 'text-red-600', icon: AlertTriangle };
  };

  const renderPerformanceStatus = () => {
    if (!performanceMetrics) return null;

    const renderTimeStatus = getPerformanceStatus(performanceMetrics.averageRenderTime, 50);
    const memoryStatus = getPerformanceStatus(performanceMetrics.memoryUsage / 1024, 10); // MB

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <renderTimeStatus.icon className={`h-4 w-4 ${renderTimeStatus.color}`} />
          <span className="text-sm">Render: {performanceMetrics.averageRenderTime.toFixed(2)}ms</span>
        </div>
        <div className="flex items-center space-x-2">
          <memoryStatus.icon className={`h-4 w-4 ${memoryStatus.color}`} />
          <span className="text-sm">Memory: {(performanceMetrics.memoryUsage / 1024).toFixed(2)}MB</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Performance Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance monitoring and optimization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={runLoadTest} disabled={isRunningTest}>
            {isRunningTest ? 'Running Test...' : 'Run Load Test'}
          </Button>
          <Button onClick={onRunFinalTest} variant="outline">
            Run Final Test
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Render Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics?.averageRenderTime.toFixed(2) || '0'}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average render time
            </p>
            {renderPerformanceStatus()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics ? (performanceMetrics.memoryUsage / 1024).toFixed(2) : '0'}MB
            </div>
            <p className="text-xs text-muted-foreground">
              Current memory usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Checks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityMetrics?.roleValidationCount || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Role validations performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Component Loads</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics?.renderCount || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total component renders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Load Test Results */}
      {loadTestResults && (
        <Card>
          <CardHeader>
            <CardTitle>Load Test Results</CardTitle>
            <CardDescription>
              Performance under high load (10K resellers, 5K transactions)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Resellers Processed</p>
                <p className="text-2xl font-bold">{loadTestResults.resellerCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Transactions Processed</p>
                <p className="text-2xl font-bold">{loadTestResults.transactionCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Processing Time</p>
                <p className="text-2xl font-bold">{loadTestResults.processingTime.toFixed(2)}ms</p>
              </div>
              <div>
                <p className="text-sm font-medium">Throughput</p>
                <p className="text-2xl font-bold">{loadTestResults.throughput.toFixed(2)} tx/sec</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Error Rate</p>
              <Progress value={loadTestResults.errorRate} className="w-full" />
              <p className="text-xs text-muted-foreground mt-1">
                {loadTestResults.errorRate.toFixed(2)}% error rate
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimized Reseller List */}
      <Card>
        <CardHeader>
          <CardTitle>Virtualized Reseller List</CardTitle>
          <CardDescription>
            Optimized rendering for large datasets (showing {virtualizedResellers.visibleItems.length} of {virtualizedResellers.totalCount})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search resellers..."
              className="w-full p-2 border rounded-md"
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {virtualizedResellers.visibleItems.map((reseller: any, index: number) => (
                <div key={reseller.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{reseller.name}</p>
                    <p className="text-sm text-muted-foreground">{reseller.email}</p>
                  </div>
                  <Badge variant={reseller.status === 'active' ? 'default' : 'secondary'}>
                    {reseller.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Active Resellers</p>
                <p className="text-2xl font-bold">{dashboardStats.activeResellers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Licenses</p>
                <p className="text-2xl font-bold">{dashboardStats.activeLicenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total Sales</p>
                <p className="text-2xl font-bold">₹{(dashboardStats.totalSales / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Pending Payouts</p>
                <p className="text-2xl font-bold">{dashboardStats.pendingPayouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceOptimizedDashboard;
