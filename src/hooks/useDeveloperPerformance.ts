// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// Performance metrics types
export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
  requestCount: number;
  averageResponseTime: number;
  timestamp: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export interface PerformanceConfig {
  enableCaching: boolean;
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  maxCacheSize: number;
  defaultTTL: number;
  batchSize: number;
  debounceMs: number;
  enablePerformanceMonitoring: boolean;
}

interface UseDeveloperPerformanceProps {
  config?: Partial<PerformanceConfig>;
}

// Default configuration
const defaultConfig: PerformanceConfig = {
  enableCaching: true,
  enableLazyLoading: true,
  enableVirtualization: true,
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  batchSize: 50,
  debounceMs: 300,
  enablePerformanceMonitoring: true
};

// Performance hook
const useDeveloperPerformance = ({
  config = {}
}: UseDeveloperPerformanceProps = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    loadTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    errorRate: 0,
    requestCount: 0,
    averageResponseTime: 0,
    timestamp: new Date().toISOString()
  });
  
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map());
  const [isVirtualScrollEnabled, setIsVirtualScrollEnabled] = useState(finalConfig.enableVirtualization);
  const [performanceAlerts, setPerformanceAlerts] = useState<string[]>([]);

  // Performance monitoring
  useEffect(() => {
    if (!finalConfig.enablePerformanceMonitoring) return;

    const monitor = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const currentMetrics: PerformanceMetrics = {
        renderTime: performance.now(),
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
        memoryUsage: memory?.usedJSHeapSize || 0,
        cacheHitRate: calculateCacheHitRate(),
        errorRate: calculateErrorRate(),
        requestCount: getRequestCount(),
        averageResponseTime: getAverageResponseTime(),
        timestamp: new Date().toISOString()
      };

      setMetrics(currentMetrics);
      checkPerformanceThresholds(currentMetrics);
    };

    const interval = setInterval(monitor, 5000); // Monitor every 5 seconds
    return () => clearInterval(interval);
  }, [finalConfig.enablePerformanceMonitoring]);

  // Cache management
  const getCachedData = useCallback(<T>(key: string): T | null => {
    if (!finalConfig.enableCaching) return null;
    
    const entry = cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    setCache(new Map(cache));
    
    return entry.data;
  }, [cache, finalConfig.enableCaching]);

  const setCachedData = useCallback(<T>(key: string, data: T, ttl?: number): void => {
    if (!finalConfig.enableCaching) return;
    
    const size = JSON.stringify(data).length;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || finalConfig.defaultTTL,
      hits: 0,
      size
    };
    
    // Check cache size limit
    const currentSize = Array.from(cache.values()).reduce((total, e) => total + e.size, 0);
    if (currentSize + size > finalConfig.maxCacheSize) {
      evictOldestEntries(size);
    }
    
    setCache(prev => new Map(prev.set(key, entry)));
  }, [cache, finalConfig.enableCaching, finalConfig.maxCacheSize, finalConfig.defaultTTL]);

  const evictOldestEntries = useCallback((requiredSize: number) => {
    const entries = Array.from(cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    let freedSize = 0;
    for (const [key, entry] of entries) {
      cache.delete(key);
      freedSize += entry.size;
      if (freedSize >= requiredSize) break;
    }
    
    setCache(new Map(cache));
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Lazy loading utilities
  const useLazyLoad = useCallback((items: any[], threshold = 0.1) => {
    if (!finalConfig.enableLazyLoading) return { visibleItems: items, loadMore: () => {} };
    
    const [visibleCount, setVisibleCount] = useState(finalConfig.batchSize);
    
    const visibleItems = items.slice(0, visibleCount);
    const hasMore = items.length > visibleCount;
    
    const loadMore = useCallback(() => {
      setVisibleCount(prev => Math.min(prev + finalConfig.batchSize, items.length));
    }, [items.length, finalConfig.batchSize]);
    
    return { visibleItems, hasMore, loadMore };
  }, [finalConfig.enableLazyLoading, finalConfig.batchSize]);

  // Virtual scrolling utilities
  const useVirtualScroll = useCallback((
    items: any[],
    itemHeight: number,
    containerHeight: number
  ) => {
    if (!isVirtualScrollEnabled) return { visibleItems: items, scrollTop: 0, setScrollTop: () => {} };
    
    const [scrollTop, setScrollTop] = useState(0);
    
    const visibleItems = useMemo(() => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
      );
      
      return items.slice(startIndex, endIndex).map((item, index) => ({
        item,
        index: startIndex + index,
        top: (startIndex + index) * itemHeight
      }));
    }, [items, scrollTop, itemHeight, containerHeight]);
    
    return { visibleItems, scrollTop, setScrollTop };
  }, [isVirtualScrollEnabled]);

  // Debouncing utility
  const useDebounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number = finalConfig.debounceMs
  ): T => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }, [finalConfig.debounceMs]);

  // Performance optimization for data fetching
  const optimizedFetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const startTime = performance.now();
    
    // Try cache first
    const cached = getCachedData<T>(key);
    if (cached) {
      const duration = performance.now() - startTime;
      updateRequestMetrics(duration, true);
      return cached;
    }
    
    try {
      const data = await fetcher();
      setCachedData(key, data, ttl);
      
      const duration = performance.now() - startTime;
      updateRequestMetrics(duration, false);
      
      return data;
    } catch (error) {
      updateErrorMetrics();
      throw error;
    }
  }, [getCachedData, setCachedData]);

  // Batch processing utility
  const processBatch = useCallback(async <T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = finalConfig.batchSize
  ): Promise<R[]> => {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Allow UI to breathe between batches
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }, [finalConfig.batchSize]);

  // Memory optimization
  const optimizeMemory = useCallback(() => {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
      }
    }
    setCache(new Map(cache));
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }, [cache]);

  // Performance metrics calculations
  const calculateCacheHitRate = useCallback((): number => {
    const entries = Array.from(cache.values());
    if (entries.length === 0) return 0;
    
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = entries.reduce((sum, entry) => sum + entry.hits + 1, 0);
    
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }, [cache]);

  const calculateErrorRate = useCallback((): number => {
    // This would be calculated from actual error tracking
    return 0; // Placeholder
  }, []);

  const getRequestCount = useCallback((): number => {
    // This would be calculated from actual request tracking
    return 0; // Placeholder
  }, []);

  const getAverageResponseTime = useCallback((): number => {
    // This would be calculated from actual response time tracking
    return 0; // Placeholder
  }, []);

  const updateRequestMetrics = useCallback((duration: number, fromCache: boolean) => {
    // Update request metrics
    setMetrics(prev => ({
      ...prev,
      requestCount: prev.requestCount + 1,
      averageResponseTime: (prev.averageResponseTime * prev.requestCount + duration) / (prev.requestCount + 1)
    }));
  }, []);

  const updateErrorMetrics = useCallback(() => {
    // Update error metrics
    setMetrics(prev => ({
      ...prev,
      errorRate: Math.min(prev.errorRate + 1, 100)
    }));
  }, []);

  const checkPerformanceThresholds = useCallback((currentMetrics: PerformanceMetrics) => {
    const alerts: string[] = [];
    
    if (currentMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      alerts.push('High memory usage detected');
    }
    
    if (currentMetrics.averageResponseTime > 1000) { // 1 second
      alerts.push('Slow response times detected');
    }
    
    if (currentMetrics.errorRate > 5) { // 5% error rate
      alerts.push('High error rate detected');
    }
    
    if (currentMetrics.cacheHitRate < 50) { // 50% cache hit rate
      alerts.push('Low cache hit rate');
    }
    
    setPerformanceAlerts(alerts);
  }, []);

  // Security utilities
  const sanitizeInput = useCallback((input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }, []);

  const validateAccess = useCallback((resource: string, action: string): boolean => {
    // Simple role-based access check
    const session = localStorage.getItem('developer_session');
    if (!session) return false;
    
    try {
      const parsed = JSON.parse(session);
      const permissions = parsed.permissions || [];
      return permissions.includes(`${resource}:${action}`);
    } catch {
      return false;
    }
  }, []);

  const encryptSensitiveData = useCallback((data: any): string => {
    // Simple encryption - in production, use proper encryption
    return btoa(JSON.stringify(data));
  }, []);

  const decryptSensitiveData = useCallback<(encrypted: string) => any>((encrypted: string) => {
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }, []);

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    const data = {
      metrics,
      cacheStats: {
        size: cache.size,
        totalSize: Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0),
        hitRate: calculateCacheHitRate()
      },
      alerts: performanceAlerts,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, cache, performanceAlerts, calculateCacheHitRate]);

  return {
    // State
    metrics,
    performanceAlerts,
    cacheSize: cache.size,
    
    // Cache utilities
    getCachedData,
    setCachedData,
    clearCache,
    
    // Performance utilities
    useLazyLoad,
    useVirtualScroll,
    useDebounce,
    optimizedFetch,
    processBatch,
    optimizeMemory,
    
    // Security utilities
    sanitizeInput,
    validateAccess,
    encryptSensitiveData,
    decryptSensitiveData,
    
    // Configuration
    isVirtualScrollEnabled,
    setIsVirtualScrollEnabled,
    
    // Export
    exportPerformanceData
  };
};

export default useDeveloperPerformance;
