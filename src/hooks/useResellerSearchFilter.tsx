// @ts-nocheck
import { useState, useCallback, useMemo } from 'react';

interface SearchFilterOptions {
  search: string;
  status: string;
  dateRange: {
    start: string;
    end: string;
  };
  type: string;
  page: number;
  limit: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search, Filter, and Pagination Hook
export const useResellerSearchFilter = <T extends Record<string, any>>(
  data: T[],
  searchableFields: string[] = [],
  defaultLimit: number = 10
) => {
  const [options, setOptions] = useState<SearchFilterOptions>({
    search: '',
    status: 'all',
    dateRange: { start: '', end: '' },
    type: 'all',
    page: 1,
    limit: defaultLimit
  });

  const [isLoading, setIsLoading] = useState(false);

  // Search function
  const searchItems = useCallback((items: T[], searchTerm: string) => {
    if (!searchTerm.trim()) return items;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return items.filter(item => {
      return searchableFields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [searchableFields]);

  // Filter function
  const filterItems = useCallback((items: T[], filters: SearchFilterOptions) => {
    let filtered = [...items];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt || item.created_at);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        
        return true;
      });
    }

    return filtered;
  }, []);

  // Apply search and filters
  const processedData = useMemo(() => {
    setIsLoading(true);
    
    // Apply search
    let result = searchItems(data, options.search);
    
    // Apply filters
    result = filterItems(result, options);
    
    setIsLoading(false);
    
    return result;
  }, [data, options.search, options.status, options.dateRange, options.type, searchItems, filterItems]);

  // Calculate pagination
  const pagination = useMemo((): PaginationInfo => {
    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / options.limit);
    
    return {
      currentPage: options.page,
      totalPages,
      totalItems,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1
    };
  }, [processedData.length, options.page, options.limit]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, options.page, options.limit]);

  // Update search
  const updateSearch = useCallback((search: string) => {
    setOptions(prev => ({ ...prev, search, page: 1 }));
  }, []);

  // Update filters
  const updateFilters = useCallback((filters: Partial<SearchFilterOptions>) => {
    setOptions(prev => ({ ...prev, ...filters, page: 1 }));
  }, []);

  // Update pagination
  const updatePage = useCallback((page: number) => {
    setOptions(prev => ({ ...prev, page }));
  }, []);

  const updateLimit = useCallback((limit: number) => {
    setOptions(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setOptions({
      search: '',
      status: 'all',
      dateRange: { start: '', end: '' },
      type: 'all',
      page: 1,
      limit: defaultLimit
    });
  }, [defaultLimit]);

  // Performance optimization - debounced search
  const debouncedSearch = useCallback(
    debounce((search: string) => {
      updateSearch(search);
    }, 300),
    [updateSearch]
  );

  return {
    // Data
    data: paginatedData,
    allData: processedData,
    
    // State
    options,
    isLoading,
    pagination,
    
    // Actions
    updateSearch: debouncedSearch,
    updateFilters,
    updatePage,
    updateLimit,
    resetFilters,
    
    // Computed
    hasResults: processedData.length > 0,
    isEmpty: data.length === 0,
    isFiltered: options.search || options.status !== 'all' || options.type !== 'all' || options.dateRange.start || options.dateRange.end
  };
};

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Advanced search with multiple criteria
export const useAdvancedSearch = <T extends Record<string, any>>(
  data: T[],
  searchConfig: {
    fields: string[];
    weights?: Record<string, number>;
    fuzzy?: boolean;
  }
) => {
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);

  const performAdvancedSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setResults(data);
      return;
    }

    const weights = searchConfig.weights || {};
    const fuzzy = searchConfig.fuzzy || false;

    const scored = data.map(item => {
      let score = 0;
      const queryParts = query.toLowerCase().split(' ');

      searchConfig.fields.forEach(field => {
        const value = String(item[field] || '').toLowerCase();
        const weight = weights[field] || 1;

        queryParts.forEach(part => {
          if (value.includes(part)) {
            score += weight;
          } else if (fuzzy && value.includes(part.substring(0, Math.max(1, part.length - 1)))) {
            score += weight * 0.5;
          }
        });
      });

      return { item, score };
    });

    const filtered = scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    setResults(filtered);
  }, [data, searchConfig]);

  return {
    query: advancedQuery,
    results,
    setQuery: setAdvancedQuery,
    search: performAdvancedSearch
  };
};

export default useResellerSearchFilter;
