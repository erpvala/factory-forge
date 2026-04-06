// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  type: 'dashboard' | 'projects' | 'repositories' | 'commits' | 'pipelines' | 'deployments' | 'logs' | 'errors' | 'api' | 'settings';
  count?: number;
}

const DeveloperLoadingState: React.FC<LoadingStateProps> = ({ 
  type, 
  count = 5 
}) => {
  const renderSkeletonCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );

  const renderDashboardSkeleton = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Table Header */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Table Rows */}
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => renderSkeletonCard())}
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => renderSkeletonCard())}
    </div>
  );

  switch (type) {
    case 'dashboard':
      return renderDashboardSkeleton();
    case 'projects':
    case 'repositories':
      return renderGridSkeleton();
    case 'commits':
    case 'pipelines':
    case 'deployments':
    case 'logs':
    case 'errors':
      return renderTableSkeleton();
    case 'api':
    case 'settings':
      return renderListSkeleton();
    default:
      return <div className="space-y-4">{[...Array(count)].map((_, i) => renderSkeletonCard())}</div>;
  }
};

export default DeveloperLoadingState;
