// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  isLoading?: boolean;
  showItemsPerPageSelector?: boolean;
  maxVisiblePages?: number;
}

const DeveloperPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
  showItemsPerPageSelector = true,
  maxVisiblePages = 5
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getVisiblePages = () => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !isLoading) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (newLimit: string) => {
    const limit = parseInt(newLimit);
    if (limit > 0 && !isLoading) {
      onItemsPerPageChange(limit);
    }
  };

  if (totalPages <= 1 && !showItemsPerPageSelector) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          `Showing ${startItem} to ${endItem} of ${totalItems} results`
        ) : (
          'No results to show'
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Items Per Page Selector */}
        {showItemsPerPageSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20">
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
        )}

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={!canGoBack || isLoading}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoBack || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {/* Show first page if not in visible range */}
            {visiblePages[0] > 1 && (
              <>
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={isLoading}
                >
                  1
                </Button>
                {visiblePages[0] > 2 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
              </>
            )}

            {/* Visible page numbers */}
            {visiblePages.map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={isLoading}
              >
                {page}
              </Button>
            ))}

            {/* Show last page if not in visible range */}
            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={isLoading}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoForward || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={!canGoForward || isLoading}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPagination;
