// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Search, X, Download, RefreshCw } from 'lucide-react';

interface SearchFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  pagination: any;
  onPaginationChange: (pagination: any) => void;
  onClearFilters: () => void;
  onExport: () => void;
  isLoading: boolean;
  totalCount: number;
  type: 'projects' | 'repositories' | 'commits' | 'pipelines' | 'deployments' | 'logs' | 'errors';
}

const DeveloperSearchFilter: React.FC<SearchFilterProps> = ({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  pagination,
  onPaginationChange,
  onClearFilters,
  onExport,
  isLoading,
  totalCount,
  type
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const statusOptions = {
    projects: ['active', 'inactive', 'archived'],
    repositories: ['public', 'private', 'internal'],
    commits: ['added', 'modified', 'deleted'],
    pipelines: ['pending', 'running', 'success', 'failed', 'cancelled'],
    deployments: ['pending', 'deploying', 'deployed', 'failed', 'rolled_back'],
    logs: ['debug', 'info', 'warn', 'error', 'fatal'],
    errors: ['open', 'investigating', 'resolved', 'closed']
  };

  const environmentOptions = ['development', 'staging', 'production'];

  const languageOptions = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 
    'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust', 'C++'
  ];

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${type}...`}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {Object.values(filters).filter(v => v && v !== '').length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onExport}
              disabled={isLoading || totalCount === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Status Filter */}
              {statusOptions[type] && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      {statusOptions[type].map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Environment Filter */}
              {['deployments', 'logs', 'errors'].includes(type) && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Environment</label>
                  <Select
                    value={filters.environment || ''}
                    onValueChange={(value) => onFiltersChange({ ...filters, environment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Environments</SelectItem>
                      {environmentOptions.map(env => (
                        <SelectItem key={env} value={env}>
                          {env.charAt(0).toUpperCase() + env.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Language Filter */}
              {type === 'repositories' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <Select
                    value={filters.language || ''}
                    onValueChange={(value) => onFiltersChange({ ...filters, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Languages</SelectItem>
                      {languageOptions.map(lang => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Author Filter */}
              {['commits', 'pipelines', 'deployments'].includes(type) && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Author</label>
                  <Input
                    placeholder="Search by author..."
                    value={filters.author || ''}
                    onChange={(e) => onFiltersChange({ ...filters, author: e.target.value })}
                  />
                </div>
              )}

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value }
                    })}
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, end: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Per Page Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Per Page</label>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => onPaginationChange({ ...pagination, limit: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <span className="text-sm font-medium">Active Filters:</span>
                {filters.status && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {filters.status}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, status: '' })}
                    />
                  </Badge>
                )}
                {filters.environment && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Environment: {filters.environment}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, environment: '' })}
                    />
                  </Badge>
                )}
                {filters.language && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Language: {filters.language}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, language: '' })}
                    />
                  </Badge>
                )}
                {filters.author && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Author: {filters.author}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, author: '' })}
                    />
                  </Badge>
                )}
                {filters.dateRange?.start && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Date: {filters.dateRange.start} to {filters.dateRange.end || 'Now'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, dateRange: undefined })}
                    />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            'Searching...'
          ) : (
            `Showing ${pagination.data?.length || 0} of {totalCount} ${type}`
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperSearchFilter;
