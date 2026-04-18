// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';

export interface CEOProductPerf {
  product_name: string;
  category: string;
  total_sales: number;
  total_revenue: number;
  status: string;
}

export interface CEORegionPerf {
  region_name: string;
  total_users: number;
  active_franchises: number;
  risk_level: string;
}

export interface CEOSystemHealth {
  metric_name: string;
  score: number;
  benchmark: number;
  status: string;
}

export interface CEOScanResult {
  modules_scanned: number;
  issues_found: number;
  critical_issues: number;
  scan_duration_ms: number;
  scan_results: Record<string, number>;
  status: string;
}

export function useCEODashboard() {
  const [productPerformance, setProductPerformance] = useState<CEOProductPerf[]>([]);
  const [regionPerformance, setRegionPerformance] = useState<CEORegionPerf[]>([]);
  const [systemHealth, setSystemHealth] = useState<CEOSystemHealth[]>([]);
  const [scanResult, setScanResult] = useState<CEOScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const callEndpoint = useCallback(async (endpoint: string, params?: any) => {
    try {
      const response = await fetch('/api/v1/ceo-dashboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: endpoint, payload: params || {} }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data?.error || 'ceo_dashboard_request_failed');
      return data;
    } catch (err) {
      console.error(`[CEO] ${endpoint} error:`, err);
      return null;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    const data = await callEndpoint('products');
    if (data?.products) setProductPerformance(data.products);
  }, [callEndpoint]);

  const fetchRegions = useCallback(async () => {
    const data = await callEndpoint('regions');
    if (data?.regions) setRegionPerformance(data.regions);
  }, [callEndpoint]);

  const fetchSystemHealth = useCallback(async () => {
    const data = await callEndpoint('system-health');
    if (data?.health) setSystemHealth(data.health);
  }, [callEndpoint]);

  const runScan = useCallback(async (scanType = 'full') => {
    setLoading(true);
    const data = await callEndpoint('scan', { scan_type: scanType });
    if (data) setScanResult(data);
    setLoading(false);
    return data;
  }, [callEndpoint]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchRegions(), fetchSystemHealth()]);
    setLoading(false);
  }, [fetchProducts, fetchRegions, fetchSystemHealth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    productPerformance,
    regionPerformance,
    systemHealth,
    scanResult,
    loading,
    fetchProducts,
    fetchRegions,
    fetchSystemHealth,
    runScan,
    fetchAll,
  };
}
