// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

// Search and filter types
interface SearchFilterOptions {
  query: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  environment?: string;
  author?: string;
  language?: string;
  tags?: string[];
}

interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchFilterResult<T> {
  data: T[];
  pagination: PaginationOptions;
  filters: SearchFilterOptions;
  isLoading: boolean;
  hasResults: boolean;
}

interface UseSearchFilterProps<T> {
  data: T[];
  defaultLimit?: number;
  searchFields: (keyof T)[];
  filterOptions?: {
    statusField?: keyof T;
    dateField?: keyof T;
    environmentField?: keyof T;
    authorField?: keyof T;
    languageField?: keyof T;
  };
}

// Search and filter hook
const useDeveloperSearchFilter = <T>({
  data,
  defaultLimit = 20,
  searchFields,
  filterOptions
}: UseSearchFilterProps<T>): SearchFilterResult<T> & {
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilterOptions>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearFilters: () => void;
  exportResults: () => void;
} => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilterOptions>({
    query: '',
    status: '',
    dateRange: undefined,
    environment: '',
    author: '',
    language: '',
    tags: []
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [isLoading, setIsLoading] = useState(false);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    setIsLoading(true);
    
    let result = [...data];

    // Text search
    if (query.trim()) {
      const searchQuery = query.toLowerCase().trim();
      result = result.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery);
          }
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).toLowerCase().includes(searchQuery);
          }
          return false;
        });
      });
    }

    // Status filter
    if (filters.status && filterOptions?.statusField) {
      result = result.filter(item => {
        const status = item[filterOptions.statusField!];
        return status === filters.status;
      });
    }

    // Date range filter
    if (filters.dateRange && filterOptions?.dateField) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      result = result.filter(item => {
        const itemDate = new Date(item[filterOptions.dateField!] as string);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Environment filter
    if (filters.environment && filterOptions?.environmentField) {
      result = result.filter(item => {
        const environment = item[filterOptions.environmentField!];
        return environment === filters.environment;
      });
    }

    // Author filter
    if (filters.author && filterOptions?.authorField) {
      result = result.filter(item => {
        const author = item[filterOptions.authorField!];
        if (typeof author === 'string') {
          return author.toLowerCase().includes(filters.author!.toLowerCase());
        }
        if (typeof author === 'object' && author !== null) {
          const authorName = (author as any).name || '';
          return authorName.toLowerCase().includes(filters.author!.toLowerCase());
        }
        return false;
      });
    }

    // Language filter
    if (filters.language && filterOptions?.languageField) {
      result = result.filter(item => {
        const language = item[filterOptions.languageField!];
        return language === filters.language;
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(item => {
        const itemTags = (item as any).tags || [];
        return filters.tags!.some(tag => itemTags.includes(tag));
      });
    }

    setIsLoading(false);
    return result;
  }, [data, query, filters, searchFields, filterOptions]);

  // Pagination
  const pagination = useMemo(() => {
    const total = filteredData.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      page,
      limit,
      total,
      totalPages,
      startIndex,
      endIndex,
      data: paginatedData
    };
  }, [filteredData, page, limit]);

  // Update query and filters
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setFilters(prev => ({ ...prev, query: newQuery }));
    setPage(1); // Reset to first page on search
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page on filter
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setFilters({
      query: '',
      status: '',
      dateRange: undefined,
      environment: '',
      author: '',
      language: '',
      tags: []
    });
    setPage(1);
  }, []);

  // Export results
  const exportResults = useCallback(() => {
    const exportData = pagination.data.map(item => ({
      ...item,
      exported_at: new Date().toISOString()
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer-data-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pagination.data]);

  // Reset page when limit changes
  useEffect(() => {
    setPage(1);
  }, [limit]);

  return {
    data: pagination.data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    },
    filters,
    isLoading,
    hasResults: pagination.data.length > 0,
    setQuery: updateQuery,
    setFilters: updateFilters,
    setPage,
    setLimit,
    clearFilters,
    exportResults
  };
};

// Search component factory
export const createSearchConfig = {
  projects: {
    searchFields: ['name', 'description', 'status'] as const,
    filterOptions: {
      statusField: 'status' as const,
      dateField: 'createdAt' as const
    }
  },
  repositories: {
    searchFields: ['name', 'description', 'language', 'visibility'] as const,
    filterOptions: {
      languageField: 'language' as const,
      dateField: 'createdAt' as const
    }
  },
  commits: {
    searchFields: ['message', 'hash', 'author'] as const,
    filterOptions: {
      authorField: 'author' as const,
      dateField: 'timestamp' as const
    }
  },
  pipelines: {
    searchFields: ['name', 'status', 'branch'] as const,
    filterOptions: {
      statusField: 'status' as const,
      dateField: 'createdAt' as const
    }
  },
  deployments: {
    searchFields: ['version', 'environment', 'status'] as const,
    filterOptions: {
      statusField: 'status' as const,
      environmentField: 'environment' as const,
      dateField: 'createdAt' as const
    }
  },
  logs: {
    searchFields: ['message', 'level', 'source'] as const,
    filterOptions: {
      dateField: 'timestamp' as const
    }
  },
  errors: {
    searchFields: ['message', 'level', 'source'] as const,
    filterOptions: {
      statusField: 'status' as const,
      dateField: 'timestamp' as const
    }
  }
};

export default useDeveloperSearchFilter;
